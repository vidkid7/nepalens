import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";

export const dynamic = "force-dynamic";

// GET /api/internal/search/autocomplete?q=...
export async function GET(request: NextRequest) {
  const query = new URL(request.url).searchParams.get("q") || "";
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const tags = await prisma.tag.findMany({
    where: { name: { startsWith: query.toLowerCase() } },
    orderBy: { photosCount: "desc" },
    take: 8,
    select: { name: true, photosCount: true },
  });

  return NextResponse.json({
    suggestions: tags.map((t) => ({ text: t.name, count: t.photosCount })),
  });
}
