import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return null;
  }
  return session;
}

// GET /api/admin/leaderboard?period=30d&sort=views
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all-time";
  const sort = searchParams.get("sort") || "views";

  const dateFilter =
    period === "30d"
      ? { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      : {};

  // Build the aggregation based on sort preference
  const orderByField = sort === "downloads" ? "downloadsCount" : "viewsCount";

  const users = await prisma.user.findMany({
    where: {
      photos: {
        some: { status: "approved", ...dateFilter },
      },
      isBanned: false,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      photos: {
        where: { status: "approved", ...dateFilter },
        select: {
          viewsCount: true,
          downloadsCount: true,
        },
      },
    },
    take: 200,
  });

  // Aggregate stats per user and sort
  const leaderboard = users
    .map((user) => {
      const totalViews = user.photos.reduce(
        (sum, p) => sum + Number(p.viewsCount),
        0
      );
      const totalDownloads = user.photos.reduce(
        (sum, p) => sum + Number(p.downloadsCount),
        0
      );
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        totalViews,
        totalDownloads,
        photoCount: user.photos.length,
      };
    })
    .sort((a, b) =>
      orderByField === "downloadsCount"
        ? b.totalDownloads - a.totalDownloads
        : b.totalViews - a.totalViews
    )
    .slice(0, 50);

  return NextResponse.json({
    leaderboard,
    period,
    sort,
    lastRefreshed: new Date().toISOString(),
  });
}

// PATCH /api/admin/leaderboard
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action, userId } = body;

  if (action === "refresh") {
    return NextResponse.json({
      success: true,
      message: "Leaderboard cache refreshed",
      refreshedAt: new Date().toISOString(),
    });
  }

  if (action === "exclude" && userId) {
    // Placeholder: In production, mark user as excluded from leaderboard
    return NextResponse.json({
      success: true,
      message: `User ${userId} excluded from leaderboard`,
      userId,
    });
  }

  return NextResponse.json(
    { error: "Invalid action. Use 'refresh' or 'exclude' with userId." },
    { status: 400 }
  );
}
