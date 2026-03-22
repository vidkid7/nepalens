import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cached, cacheDel, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return null;
  }
  return session;
}

async function getExcludedUserIds(): Promise<Set<string>> {
  const exclusions = await prisma.auditLog.findMany({
    where: { action: "leaderboard.exclude" },
    select: { targetId: true },
  });
  const inclusions = await prisma.auditLog.findMany({
    where: { action: "leaderboard.include" },
    select: { targetId: true },
  });

  const excluded = new Set<string>();
  for (const e of exclusions) {
    if (e.targetId) excluded.add(e.targetId);
  }
  for (const i of inclusions) {
    if (i.targetId) excluded.delete(i.targetId);
  }
  return excluded;
}

async function computeLeaderboard(period: string, sort: string) {
  const dateFilter =
    period === "30d"
      ? { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      : {};

  const orderByField = sort === "downloads" ? "downloadsCount" : "viewsCount";

  const excludedIds = await getExcludedUserIds();

  const users = await prisma.user.findMany({
    where: {
      photos: {
        some: { status: "approved", ...dateFilter },
      },
      isBanned: false,
      ...(excludedIds.size > 0 ? { id: { notIn: [...excludedIds] } } : {}),
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

  return users
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

  const cacheKey = `leaderboard:${period}:${sort}`;

  const result = await cached(cacheKey, CacheTTL.LEADERBOARD, async () => {
    const leaderboard = await computeLeaderboard(period, sort);
    return {
      leaderboard,
      computedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json({
    leaderboard: result.leaderboard,
    period,
    sort,
    lastRefreshed: result.computedAt,
    cached: true,
  });
}

// PATCH /api/admin/leaderboard
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { action, userId, reason } = body;
  const adminId = (session.user as any).id;

  if (action === "refresh") {
    // Invalidate all leaderboard cache keys
    await Promise.all([
      cacheDel("leaderboard:all-time:views"),
      cacheDel("leaderboard:all-time:downloads"),
      cacheDel("leaderboard:30d:views"),
      cacheDel("leaderboard:30d:downloads"),
    ]).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "leaderboard.refresh",
        details: { triggeredBy: adminId },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Leaderboard cache refreshed",
      refreshedAt: new Date().toISOString(),
    });
  }

  if (action === "exclude" && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "leaderboard.exclude",
        targetType: "user",
        targetId: userId,
        details: { reason: reason || "Excluded from leaderboard by admin" },
      },
    });

    // Invalidate cache so next GET reflects the exclusion
    await Promise.all([
      cacheDel("leaderboard:all-time:views"),
      cacheDel("leaderboard:all-time:downloads"),
      cacheDel("leaderboard:30d:views"),
      cacheDel("leaderboard:30d:downloads"),
    ]).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `User ${userId} excluded from leaderboard`,
      userId,
    });
  }

  if (action === "include" && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "leaderboard.include",
        targetType: "user",
        targetId: userId,
        details: { reason: reason || "Re-included in leaderboard by admin" },
      },
    });

    await Promise.all([
      cacheDel("leaderboard:all-time:views"),
      cacheDel("leaderboard:all-time:downloads"),
      cacheDel("leaderboard:30d:views"),
      cacheDel("leaderboard:30d:downloads"),
    ]).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `User ${userId} re-included in leaderboard`,
      userId,
    });
  }

  return NextResponse.json(
    { error: "Invalid action. Use 'refresh', 'exclude', or 'include' with userId." },
    { status: 400 }
  );
}
