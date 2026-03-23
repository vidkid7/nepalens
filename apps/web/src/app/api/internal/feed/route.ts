import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";

export const dynamic = "force-dynamic";

/**
 * GET /api/internal/feed — Mixed photo + video feed for the homepage
 * Returns interleaved photos and videos, with videos sprinkled in.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "30"), 100);
  const sort = searchParams.get("sort") || "curated";

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";

  // Calculate how many of each to fetch (roughly 1 video per 5 photos)
  const videoCount = Math.max(Math.floor(perPage / 5), 2);
  const photoCount = perPage - videoCount;

  const photoOrderBy = sort === "popular"
    ? { viewsCount: "desc" as const }
    : sort === "newest"
      ? { createdAt: "desc" as const }
      : { createdAt: "desc" as const };

  const [photos, videos] = await Promise.all([
    prisma.photo.findMany({
      where: { status: "approved", width: { gt: 0 }, height: { gt: 0 } },
      orderBy: photoOrderBy,
      skip: (page - 1) * photoCount,
      take: photoCount,
      include: {
        user: { select: { username: true, displayName: true } },
      },
    }),
    prisma.video.findMany({
      where: { status: "approved", width: { gt: 0 }, height: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * videoCount,
      take: videoCount,
      include: {
        user: { select: { username: true, displayName: true } },
        files: { orderBy: { width: "asc" } },
      },
    }),
  ]);

  function getPhotoUrl(photo: { id: string; cdnKey: string | null; originalUrl: string; isPremium?: boolean }) {
    if (photo.isPremium) return `/api/internal/photos/${photo.id}/preview?w=800`;
    if (photo.originalUrl?.startsWith("http")) return photo.originalUrl;
    return photo.cdnKey ? `${cdnBase}/${photo.cdnKey}` : photo.originalUrl;
  }

  // Map photos
  const mappedPhotos = photos.map((p) => ({
    id: p.id,
    slug: p.slug || p.id,
    alt: p.altText,
    width: p.width,
    height: p.height,
    src: { large: getPhotoUrl(p) },
    photographer: p.user?.displayName || p.user?.username || "Unknown",
    photographer_url: `/profile/${p.user?.username || "user"}`,
    avg_color: p.dominantColor || null,
    blur_hash: p.blurHash || null,
    isPremium: p.isPremium,
    mediaType: "photo" as const,
  }));

  // Map videos
  const mappedVideos = videos.map((v) => {
    const originalFile = v.files.find((f) => f.quality === "original") || v.files[0];
    let videoUrl = originalFile?.cdnUrl?.startsWith("http")
      ? originalFile.cdnUrl
      : originalFile?.cdnUrl
        ? `${cdnBase}/${originalFile.cdnUrl}`
        : null;

    let thumbnailUrl = v.thumbnailUrl;
    if (!thumbnailUrl && videoUrl?.includes("res.cloudinary.com")) {
      thumbnailUrl = videoUrl
        .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
        .replace(/\.[^.]+$/, ".jpg");
    }

    return {
      id: v.id,
      slug: v.slug || v.id,
      alt: v.altText || v.description,
      width: v.width,
      height: v.height,
      src: { large: thumbnailUrl || `https://placehold.co/${v.width}x${v.height}/1a1a1a/ffffff?text=Video` },
      photographer: v.user?.displayName || v.user?.username || "Unknown",
      photographer_url: `/profile/${v.user?.username || "user"}`,
      avg_color: "#1a1a1a",
      isPremium: v.isPremium,
      mediaType: "video" as const,
      videoUrl,
      duration: v.durationSeconds,
    };
  });

  // Interleave: insert a video roughly every 4-5 photos
  const feed: (typeof mappedPhotos[0] | typeof mappedVideos[0])[] = [];
  let vi = 0;
  for (let pi = 0; pi < mappedPhotos.length; pi++) {
    feed.push(mappedPhotos[pi]);
    if ((pi + 1) % 4 === 0 && vi < mappedVideos.length) {
      feed.push(mappedVideos[vi]);
      vi++;
    }
  }
  while (vi < mappedVideos.length) {
    feed.push(mappedVideos[vi]);
    vi++;
  }

  const safeResult = JSON.parse(
    JSON.stringify({ items: feed, hasMore: photos.length === photoCount }, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );

  return NextResponse.json(safeResult);
}
