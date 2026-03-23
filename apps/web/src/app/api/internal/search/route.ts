import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { cached, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

// GET /api/internal/search — Unified search across photos, videos, users
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tab = searchParams.get("tab") || "photos";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "30"), 80);
  const orientation = searchParams.get("orientation") || "";
  const size = searchParams.get("size") || "";
  const color = searchParams.get("color") || "";
  const sort = searchParams.get("sort") || "relevant";

  // Build a stable cache key from all parameters
  const cacheKey = `search:${tab}:${q}:${sort}:${orientation}:${size}:${color}:p${page}:n${perPage}`;

  const result = await cached(cacheKey, CacheTTL.FEED, async () => {
    const skip = (page - 1) * perPage;

    // Always get counts for all tabs
    const photoCountWhere = buildPhotoWhere(q, orientation, size, color);
    const videoCountWhere = buildVideoWhere(q, orientation);

    const [photoCount, videoCount, userCount] = await Promise.all([
      prisma.photo.count({ where: photoCountWhere }),
      prisma.video.count({ where: videoCountWhere }),
      q
        ? prisma.user.count({
            where: {
              isBanned: false,
              OR: [
                { username: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
              ],
            },
          })
        : prisma.user.count({ where: { isBanned: false } }),
    ]);

    const counts = { photos: photoCount, videos: videoCount, users: userCount };

    if (tab === "photos") {
      const orderBy = getPhotoOrderBy(sort);
      const photos = await prisma.photo.findMany({
        where: photoCountWhere,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          tags: { include: { tag: true } },
        },
        orderBy,
        take: perPage,
        skip,
      });

      const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
      const formatted = photos.map((p) => {
        const isPremium = p.isPremium || false;
        const rawUrl = p.originalUrl && p.originalUrl.startsWith("http")
          ? p.originalUrl
          : p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl;
        const displayUrl = isPremium
          ? `/api/internal/photos/${p.id}/preview?w=1200`
          : rawUrl;
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
        isPremium,
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
        tags: p.tags.map((pt) => pt.tag.name),
        liked: false,
        created_at: p.createdAt.toISOString(),
      };
      });

      return { results: formatted, total_results: photoCount, page, per_page: perPage, counts };
    }

    if (tab === "videos") {
      const orderBy = getVideoOrderBy(sort);
      const videos = await prisma.video.findMany({
        where: videoCountWhere,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          tags: { include: { tag: true } },
          files: true,
        },
        orderBy,
        take: perPage,
        skip,
      });

      const formatted = videos.map((v) => {
        // Build thumbnail: use stored one, or auto-generate from Cloudinary video, or placeholder
        let thumbnail = v.thumbnailUrl;
        if (!thumbnail) {
          const originalFile = v.files.find((f) => f.quality === "original") || v.files[0];
          if (originalFile?.cdnUrl?.includes("res.cloudinary.com")) {
            thumbnail = originalFile.cdnUrl
              .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
              .replace(/\.[^.]+$/, ".jpg");
          } else {
            thumbnail = `https://placehold.co/640x360/1a1a1a/fff?text=Video`;
          }
        }
        // Pick the best file for hover preview (prefer SD/HD for fast loading)
        const previewFile = v.files.find((f) => f.quality === "sd") 
          || v.files.find((f) => f.quality === "hd") 
          || v.files[0];

        return {
          id: v.id,
          slug: v.slug,
          alt: v.altText,
          width: v.width,
          height: v.height,
          duration: v.durationSeconds,
          thumbnail,
          videoUrl: previewFile?.cdnUrl || null,
          isPremium: v.isPremium || false,
          photographer: v.user?.displayName || v.user?.username || "Unknown",
          photographer_url: v.user ? `/profile/${v.user.username}` : "",
          photographer_id: v.userId,
          tags: v.tags.map((vt) => vt.tag.name),
          files: v.files.map((f) => ({
            quality: f.quality,
            width: f.width,
            height: f.height,
            url: f.cdnUrl,
          })),
          created_at: v.createdAt.toISOString(),
        };
      });

      return { results: formatted, total_results: videoCount, page, per_page: perPage, counts };
    }

    if (tab === "users") {
      const users = await prisma.user.findMany({
        where: {
          isBanned: false,
          ...(q
            ? {
                OR: [
                  { username: { contains: q, mode: "insensitive" } },
                  { displayName: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          followersCount: true,
          _count: { select: { photos: true, videos: true } },
        },
        orderBy: { followersCount: "desc" },
        take: perPage,
        skip,
      });

      const formatted = users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        followersCount: u.followersCount,
        photosCount: u._count.photos,
        videosCount: u._count.videos,
      }));

      return { results: formatted, total_results: userCount, page, per_page: perPage, counts };
    }

    return null;
  });

  if (!result) {
    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  }

  return NextResponse.json(result);
}

function buildPhotoWhere(q: string, orientation: string, size: string, color: string) {
  const where: any = { status: "approved", width: { gt: 0 }, height: { gt: 0 } };

  if (q) {
    where.OR = [
      { altText: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      { tags: { some: { tag: { slug: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  if (orientation) {
    where.orientation = orientation;
  }

  if (size === "large") {
    where.AND = [...(where.AND || []), { width: { gte: 4000 } }];
  } else if (size === "medium") {
    where.AND = [
      ...(where.AND || []),
      { width: { gte: 2000 } },
      { width: { lt: 4000 } },
    ];
  } else if (size === "small") {
    where.AND = [...(where.AND || []), { width: { lt: 2000 } }];
  }

  if (color) {
    // Match by colorBucket (exact name match) or by dominantColor hex approximation
    const colorHexMap: Record<string, string[]> = {
      red: ["#ef4444", "#dc2626", "#b91c1c", "#e8"],
      orange: ["#f97316", "#ea580c", "#e87", "#E87", "#E86"],
      yellow: ["#eab308", "#ca8a04", "#D4A"],
      green: ["#22c55e", "#16a34a", "#4A6E", "#5C8A", "#6B8A", "#4D6B", "#2D6B", "#3D8A", "#5A7D3D"],
      turquoise: ["#14b8a6", "#0d9488", "#3D7D6B"],
      blue: ["#3b82f6", "#2563eb", "#5A7D8F", "#4A8A", "#2D6BAD", "#87CEEB", "#1A2A3D"],
      violet: ["#8b5cf6", "#7c3aed", "#8A5C"],
      pink: ["#ec4899", "#db2777", "#AD5C"],
      brown: ["#a16207", "#92400e", "#8B7D", "#8B6B", "#6B5A"],
      black: ["#171717", "#1a1a1a", "#0a0a0a"],
      gray: ["#9ca3af", "#6b7280", "#7D8A", "#8A9D", "#6B7D"],
      white: ["#f5f5f5", "#ffffff", "#e5e5e5"],
    };
    where.OR = [
      ...(where.OR || []),
    ];
    // Wrap existing OR in AND to not conflict
    const existingOr = where.OR.length > 0 ? [...where.OR] : undefined;
    delete where.OR;
    
    const colorConditions: any[] = [{ colorBucket: color }];
    const hexPrefixes = colorHexMap[color] || [];
    for (const prefix of hexPrefixes) {
      colorConditions.push({ dominantColor: { startsWith: prefix, mode: "insensitive" } });
    }
    
    if (existingOr && existingOr.length > 0) {
      where.AND = [
        ...(where.AND || []),
        { OR: existingOr },
        { OR: colorConditions },
      ];
    } else {
      where.AND = [
        ...(where.AND || []),
        { OR: colorConditions },
      ];
    }
  }

  return where;
}

function buildVideoWhere(q: string, orientation: string) {
  const where: any = { status: "approved", width: { gt: 0 }, height: { gt: 0 } };

  if (q) {
    where.OR = [
      { altText: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      { tags: { some: { tag: { slug: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  if (orientation) {
    where.orientation = orientation;
  }

  return where;
}

function getPhotoOrderBy(sort: string) {
  switch (sort) {
    case "popular":
      return [{ viewsCount: "desc" as const }, { likesCount: "desc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }];
    default:
      return [{ isCurated: "desc" as const }, { isFeatured: "desc" as const }, { createdAt: "desc" as const }];
  }
}

function getVideoOrderBy(sort: string) {
  switch (sort) {
    case "popular":
      return [{ viewsCount: "desc" as const }, { likesCount: "desc" as const }];
    case "newest":
      return [{ createdAt: "desc" as const }];
    default:
      return [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];
  }
}
