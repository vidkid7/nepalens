import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { validateApiKey, apiErrorResponse } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/search?query=nature&orientation=landscape&size=large&color=green&per_page=30&page=1
export async function GET(request: NextRequest) {
  const { allowed, headers } = await validateApiKey(request);
  if (!allowed) return apiErrorResponse(401, "Invalid or missing API key");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const orientation = searchParams.get("orientation");
  const color = searchParams.get("color");
  const size = searchParams.get("size");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "15"), 80);

  if (!query) return apiErrorResponse(400, "query parameter is required");

  const where: any = { status: "approved" };

  if (orientation) where.orientation = orientation;
  if (color) where.colorBucket = color;
  if (size) where.sizeTier = size;

  // Simple text search on tags (full Elasticsearch in production)
  if (query) {
    where.OR = [
      { altText: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: query.toLowerCase() } } } } },
    ];
  }

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      include: { user: { select: { id: true, username: true, displayName: true } } },
      orderBy: [{ isFeatured: "desc" }, { viewsCount: "desc" }],
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.photo.count({ where }),
  ]);

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  const formatted = photos.map((p) => ({
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
    src: {
      original: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      large2x: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      large: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      medium: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      small: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      portrait: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      landscape: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
      tiny: p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl,
    },
  }));

  return NextResponse.json(
    {
      total_results: total,
      page,
      per_page: perPage,
      photos: formatted,
      next_page: total > page * perPage ? `${request.url.split("?")[0]}?query=${query}&page=${page + 1}&per_page=${perPage}` : undefined,
    },
    { headers }
  );
}
