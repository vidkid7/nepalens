import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";

export const dynamic = "force-dynamic";

// GET /api/internal/leaderboard
export async function GET(request: NextRequest) {
  // Get top photographers by views on photos from last 4 weeks
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const leaders = await prisma.user.findMany({
    where: {
      isContributor: true,
      photos: {
        some: {
          status: "approved",
          createdAt: { gte: fourWeeksAgo },
        },
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      photos: {
        where: {
          status: "approved",
          createdAt: { gte: fourWeeksAgo },
        },
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

  // Sort by total views
  const sorted = leaders
    .map((user) => ({
      ...user,
      totalViews: user.photos.reduce((sum, p) => sum + Number(p.viewsCount), 0),
      photoCount: user.photos.length,
    }))
    .sort((a, b) => b.totalViews - a.totalViews);

  return NextResponse.json({ leaders: sorted });
}
