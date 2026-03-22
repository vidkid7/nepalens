import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { cached, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

// GET /api/internal/search/autocomplete?q=...
export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") || "";
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const prefix = query.toLowerCase();
  const tags = await cached(
    `autocomplete:${prefix}`,
    CacheTTL.AUTOCOMPLETE,
    () =>
      prisma.tag.findMany({
        where: { name: { startsWith: prefix } },
        orderBy: { photosCount: "desc" },
        take: 8,
        select: { name: true, photosCount: true },
      })
  );

  return NextResponse.json({
    suggestions: tags.map((t: any) => ({ text: t.name, count: t.photosCount })),
  });
}
