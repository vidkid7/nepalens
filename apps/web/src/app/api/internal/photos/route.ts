import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@pixelstock/database";

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

  // If requesting liked photos, require auth
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

    // Preserve the order from likes query
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

  // If filtering by username, look up the user
  let userIdFilter: string | undefined;
  if (userFilter) {
    const targetUser = await prisma.user.findUnique({
      where: { username: userFilter },
      select: { id: true },
    });
    if (!targetUser) {
      return NextResponse.json({ photos: [], total_results: 0, page, per_page: perPage });
    }
    userIdFilter = targetUser.id;
  }

  const where: any = {
    status: "approved",
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    ...(userIdFilter ? { userId: userIdFilter } : {}),
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

  // Check if current user liked any of these photos
  let likedIds = new Set<string>();
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const userId = (session.user as any).id;
    const photoIds = photos.map((p) => p.id);
    if (photoIds.length > 0) {
      const likes = await prisma.like.findMany({
        where: { userId, mediaType: "photo", mediaId: { in: photoIds } },
        select: { mediaId: true },
      });
      likedIds = new Set(likes.map((l) => l.mediaId));
    }
  }

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  const formatted = photos.map((p) => formatPhoto(p, cdnBase, likedIds.has(p.id)));

  const nextCursor = photos.length > 0 ? photos[photos.length - 1].createdAt.toISOString() : null;

  return NextResponse.json({
    photos: formatted,
    total_results: total,
    page,
    per_page: perPage,
    next_cursor: nextCursor,
  });
}

// POST /api/internal/photos — Upload a new photo
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { s3Key, title, description, altText, category, tags, location, challengeId } = body;

  if (!s3Key || !title) {
    return NextResponse.json({ error: "s3Key and title are required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  const originalUrl = `${cdnBase}/${s3Key}`;

  const photo = await prisma.photo.create({
    data: {
      userId,
      slug,
      altText: altText || null,
      description: description || null,
      originalUrl,
      cdnKey: s3Key,
      locationName: location || null,
      width: 0,
      height: 0,
      status: "pending",
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

  return NextResponse.json({ photo: result }, { status: 201 });
}

// Shared formatter for photo responses
function formatPhoto(
  p: any,
  cdnBase: string,
  liked: boolean,
) {
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
      original: p.originalUrl,
      large2x: p.cdnKey ? `${cdnBase}/photos/${p.id}/large2x.jpg` : p.originalUrl,
      large: p.cdnKey ? `${cdnBase}/photos/${p.id}/large.jpg` : p.originalUrl,
      medium: p.cdnKey ? `${cdnBase}/photos/${p.id}/medium.jpg` : p.originalUrl,
      small: p.cdnKey ? `${cdnBase}/photos/${p.id}/small.jpg` : p.originalUrl,
      portrait: p.cdnKey ? `${cdnBase}/photos/${p.id}/portrait.jpg` : p.originalUrl,
      landscape: p.cdnKey ? `${cdnBase}/photos/${p.id}/landscape.jpg` : p.originalUrl,
      tiny: p.cdnKey ? `${cdnBase}/photos/${p.id}/tiny.jpg` : p.originalUrl,
    },
    tags: p.tags.map((pt: any) => pt.tag.name),
    liked,
    created_at: p.createdAt.toISOString(),
  };
}
