import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";

export const dynamic = "force-dynamic";

// GET /api/internal/photos — Curated feed for homepage
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "30"), 80);
  const cursor = searchParams.get("cursor");

  const where = {
    status: "approved" as const,
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ isCurated: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
      take: perPage,
      skip: cursor ? 0 : (page - 1) * perPage,
    }),
    prisma.photo.count({ where: { status: "approved" } }),
  ]);

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  const formatted = photos.map((p) => ({
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
    tags: p.tags.map((pt) => pt.tag.name),
    liked: false,
    created_at: p.createdAt.toISOString(),
  }));

  const nextCursor = photos.length > 0 ? photos[photos.length - 1].createdAt.toISOString() : null;

  return NextResponse.json({
    photos: formatted,
    total_results: total,
    page,
    per_page: perPage,
    next_cursor: nextCursor,
  });
}
