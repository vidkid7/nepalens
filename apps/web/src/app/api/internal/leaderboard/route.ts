import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { cached, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

// GET /api/internal/leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";

    const cacheKey = `internal-leaderboard:${period}`;

    const sorted = await cached(cacheKey, CacheTTL.LEADERBOARD, async () => {
      const dateFilter = period === "alltime"
        ? undefined
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const photoWhere: any = {
        status: "approved",
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      };

      const leaders = await prisma.user.findMany({
        where: {
          isContributor: true,
          photos: { some: photoWhere },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          photos: {
            where: photoWhere,
            select: {
              viewsCount: true,
              id: true,
              slug: true,
              altText: true,
              width: true,
              height: true,
              originalUrl: true,
              dominantColor: true,
            },
            orderBy: { viewsCount: "desc" },
            take: 6,
          },
        },
        take: 25,
      });

      return leaders
        .map((user) => ({
          ...user,
          totalViews: user.photos.reduce((sum, p) => sum + Number(p.viewsCount), 0),
          photoCount: user.photos.length,
        }))
        .sort((a, b) => b.totalViews - a.totalViews);
    });

    return NextResponse.json({ leaders: sorted });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ leaders: [], error: "Failed to fetch leaderboard" }, { status: 200 });
  }
}
