import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@pixelstock/database";
import { cached, cacheDel, CacheKeys, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

// GET /api/internal/photos — Curated feed, user photos, or liked photos
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "30"), 80);
  const cursor = searchParams.get("cursor");
  const sort = searchParams.get("sort") || "curated";
  const userFilter = searchParams.get("user");
  const likedFilter = searchParams.get("liked");

  // If requesting liked photos, require auth (not cached — user-specific)
  if (likedFilter === "true") {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const likes = await prisma.like.findMany({
      where: { userId, mediaType: "photo" },
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip: (page - 1) * perPage,
      select: { mediaId: true },
    });

    const photoIds = likes.map((l) => l.mediaId);
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where: { id: { in: photoIds } },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          tags: { include: { tag: true } },
        },
      }),
      prisma.like.count({ where: { userId, mediaType: "photo" } }),
    ]);

    const photosMap = new Map(photos.map((p) => [p.id, p]));
    const ordered = photoIds.map((id) => photosMap.get(id)).filter(Boolean) as typeof photos;

    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
    const formatted = ordered.map((p) => formatPhoto(p, cdnBase, true));

    return NextResponse.json({
      photos: formatted,
      total_results: total,
      page,
      per_page: perPage,
    });
  }

  // User-specific feed (not cached)
  if (userFilter) {
    return fetchUserPhotos(userFilter, page, perPage, sort);
  }

  // Public feed — CACHED
  const cacheKey = CacheKeys.photoFeed(sort, cursor ? 0 : page, perPage);
  const result = await cached(cacheKey, CacheTTL.FEED, async () => {
    const where: any = {
      status: "approved",
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    const orderBy =
      sort === "newest"
        ? [{ createdAt: "desc" as const }]
        : sort === "popular"
          ? [{ viewsCount: "desc" as const }, { createdAt: "desc" as const }]
          : [{ isCurated: "desc" as const }, { isFeatured: "desc" as const }, { createdAt: "desc" as const }];

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          tags: { include: { tag: true } },
        },
        orderBy,
        take: perPage,
        skip: cursor ? 0 : (page - 1) * perPage,
      }),
      prisma.photo.count({ where }),
    ]);

    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
    const formatted = photos.map((p) => formatPhoto(p, cdnBase, false));
    const nextCursor = photos.length > 0 ? photos[photos.length - 1].createdAt.toISOString() : null;

    return {
      photos: formatted,
      total_results: total,
      page,
      per_page: perPage,
      next_cursor: nextCursor,
    };
  });

  // Overlay per-user liked status if logged in (fast single query)
  const session = await getServerSession(authOptions);
  if (session?.user && result.photos.length > 0) {
    const userId = (session.user as any).id;
    const photoIds = result.photos.map((p: any) => p.id);
    const likes = await prisma.like.findMany({
      where: { userId, mediaType: "photo", mediaId: { in: photoIds } },
      select: { mediaId: true },
    });
    const likedIds = new Set(likes.map((l) => l.mediaId));
    result.photos = result.photos.map((p: any) => ({ ...p, liked: likedIds.has(p.id) }));
  }

  return NextResponse.json(result);
}

// POST /api/internal/photos — Upload a new photo
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawUserId = (session.user as any).id;

  // Validate user exists in DB to prevent FK constraint violations (stale JWT)
  const user = await prisma.user.findUnique({
    where: { id: rawUserId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found. Please sign out and sign in again." }, { status: 401 });
  }
  const userId = user.id;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { s3Key, title, description, altText, category, tags, location, challengeId, isPremium, width, height } = body;

  if (!s3Key || !title) {
    return NextResponse.json({ error: "s3Key and title are required" }, { status: 400 });
  }

  try {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  const originalUrl = `${cdnBase}/${s3Key}`;

  // Determine orientation from dimensions
  const w = typeof width === "number" && width > 0 ? width : 0;
  const h = typeof height === "number" && height > 0 ? height : 0;
  const orientation = w > 0 && h > 0 ? (w > h ? "landscape" : w < h ? "portrait" : "square") : null;
  const megapixels = w > 0 && h > 0 ? parseFloat(((w * h) / 1_000_000).toFixed(1)) : null;

  const photo = await prisma.photo.create({
    data: {
      userId,
      slug,
      altText: altText || null,
      description: description || null,
      originalUrl,
      cdnKey: s3Key,
      locationName: location || null,
      width: w,
      height: h,
      orientation,
      megapixels,
      status: "approved",
      isPremium: isPremium === true,
      approvedAt: new Date(),
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  // Upsert tags and create PhotoTag relations
  if (tags && Array.isArray(tags) && tags.length > 0) {
    for (const tagName of tags) {
      const normalized = String(tagName).trim().toLowerCase();
      if (!normalized) continue;

      const tagSlug = normalized
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      const tag = await prisma.tag.upsert({
        where: { name: normalized },
        update: {},
        create: { name: normalized, slug: tagSlug },
      });

      await prisma.photoTag.create({
        data: { photoId: photo.id, tagId: tag.id },
      });
    }
  }

  // Submit to challenge if specified — add the challenge's submission tag
  if (challengeId) {
    try {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        select: { submissionTag: true },
      });
      if (challenge?.submissionTag) {
        const tagSlug = challenge.submissionTag.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
        const tag = await prisma.tag.upsert({
          where: { name: challenge.submissionTag.toLowerCase() },
          update: {},
          create: { name: challenge.submissionTag.toLowerCase(), slug: tagSlug },
        });
        await prisma.photoTag.create({
          data: { photoId: photo.id, tagId: tag.id },
        }).catch(() => {}); // ignore duplicate
      }
    } catch {
      // Challenge submission is optional — don't fail the upload
    }
  }

  // Re-fetch with tags included
  const result = await prisma.photo.findUnique({
    where: { id: photo.id },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      tags: { include: { tag: true } },
    },
  });

  // Invalidate feed caches so new upload appears
  await Promise.all([
    cacheDel(CacheKeys.photoFeed("curated", 1, 30)),
    cacheDel(CacheKeys.photoFeed("newest", 1, 30)),
    cacheDel(CacheKeys.photoFeed("popular", 1, 30)),
  ]).catch(() => {});

  // Serialize safely — Prisma BigInt fields (fileSizeBytes, viewsCount, etc.) crash JSON.stringify
  const safeResult = JSON.parse(
    JSON.stringify(result, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );

  return NextResponse.json({ photo: safeResult }, { status: 201 });
  } catch (err: any) {
    console.error("Photo create error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create photo" },
      { status: 500 }
    );
  }
}

// Fetch photos for a specific user (not cached — user-specific)
async function fetchUserPhotos(username: string, page: number, perPage: number, sort: string) {
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json({ photos: [], total_results: 0, page, per_page: perPage });
  }

  const where: any = { status: "approved", userId: targetUser.id };
  const orderBy =
    sort === "popular"
      ? [{ viewsCount: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.photo.count({ where }),
  ]);

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  const formatted = photos.map((p) => formatPhoto(p, cdnBase, false));

  return NextResponse.json({ photos: formatted, total_results: total, page, per_page: perPage });
}

// Shared formatter for photo responses
function formatPhoto(
  p: any,
  cdnBase: string,
  liked: boolean,
) {
  const isPremium = p.isPremium || false;

  // For premium images, use the auth proxy so raw CDN URL is never exposed
  // to non-Pro users. The proxy bakes watermarks server-side.
  const displayUrl = isPremium
    ? `/api/internal/photos/${p.id}/preview?w=1200`
    : p.cdnKey
      ? `${cdnBase}/${p.cdnKey}`
      : p.originalUrl;

  const smallUrl = isPremium
    ? `/api/internal/photos/${p.id}/preview?w=640`
    : displayUrl;

  return {
    id: p.id,
    slug: p.slug,
    alt: p.altText,
    width: p.width,
    height: p.height,
    photographer: p.user?.displayName || p.user?.username || "Unknown",
    photographer_url: p.user ? `/profile/${p.user.username}` : "",
    photographer_id: p.userId,
    avg_color: p.dominantColor || "#cccccc",
    blur_hash: p.blurHash,
    src: {
      original: displayUrl,
      large2x: displayUrl,
      large: displayUrl,
      medium: displayUrl,
      small: smallUrl,
      portrait: displayUrl,
      landscape: displayUrl,
      tiny: smallUrl,
    },
    tags: p.tags.map((pt: any) => pt.tag.name),
    liked,
    isPremium,
    created_at: p.createdAt.toISOString(),
  };
}
