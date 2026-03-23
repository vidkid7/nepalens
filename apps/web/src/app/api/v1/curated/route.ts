import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { validateApiKey, apiErrorResponse } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/curated?per_page=15&page=1
export async function GET(request: NextRequest) {
  const { allowed, headers } = await validateApiKey(request);
  if (!allowed) return apiErrorResponse(401, "Invalid or missing API key");

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "15"), 80);

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where: { status: "approved" },
      include: { user: { select: { id: true, username: true, displayName: true } } },
      orderBy: [{ isCurated: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.photo.count({ where: { status: "approved" } }),
  ]);

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
    width: p.width,
    height: p.height,
    url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/photo/${p.slug}-${p.id}`,
    photographer: p.user?.displayName || p.user?.username || "Unknown",
    photographer_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/profile/${p.user?.username}`,
    photographer_id: p.userId,
    avg_color: p.dominantColor || "#cccccc",
    liked: false,
    alt: p.altText || "",
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
  };
  });

  return NextResponse.json(
    {
      total_results: total,
      page,
      per_page: perPage,
      photos: formatted,
      next_page: total > page * perPage ? `${request.url.split("?")[0]}?page=${page + 1}&per_page=${perPage}` : undefined,
    },
    { headers }
  );
}
