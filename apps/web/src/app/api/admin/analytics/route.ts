import { NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function last7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return formatDate(d);
  });
}

// GET /api/admin/analytics
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sevenDaysAgo = daysAgo(7);
  const dates = last7Days();

  const [
    totalPhotos,
    totalVideos,
    totalUsers,
    totalDownloads,
    totalViews,
    pendingPhotos,
    pendingVideos,
    pendingReports,
    approvedPhotos,
    rejectedPhotos,
    recentDownloads,
    recentPhotos,
    recentUsers,
    topTags,
    categories,
    searchLogs,
    activeUserCount,
    storageSumResult,
  ] = await Promise.all([
    prisma.photo.count({ where: { status: "approved" } }),
    prisma.video.count({ where: { status: "approved" } }),
    prisma.user.count(),
    prisma.download.count(),
    prisma.photo.aggregate({ _sum: { viewsCount: true } }),
    prisma.photo.count({ where: { status: "pending" } }),
    prisma.video.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { status: "pending" } }),
    prisma.photo.count({ where: { status: "approved" } }),
    prisma.photo.count({ where: { status: "rejected" } }),
    prisma.download.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.photo.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.tag.findMany({
      orderBy: { photosCount: "desc" },
      take: 30,
      select: { name: true, photosCount: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.auditLog.findMany({
      where: { action: "search", createdAt: { gte: daysAgo(30) } },
      select: { details: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.auditLog.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.photo.aggregate({ _sum: { fileSizeBytes: true } }),
  ]);

  // Build time-series by bucketing into days
  const bucket = (items: { createdAt: Date }[]) => {
    const map: Record<string, number> = {};
    for (const d of dates) map[d] = 0;
    for (const item of items) {
      const key = formatDate(item.createdAt);
      if (map[key] !== undefined) map[key]++;
    }
    return dates.map((date) => ({ date, count: map[date] || 0 }));
  };

  const downloadsByDay = bucket(recentDownloads);
  const uploadsByDay = bucket(recentPhotos);
  const signupsByDay = bucket(recentUsers);

  // Top searches from audit logs
  const searchCounts: Record<string, number> = {};
  for (const log of searchLogs) {
    const details = log.details as Record<string, unknown> | null;
    const query = (details?.query as string) || (details?.term as string);
    if (query) {
      const q = query.toLowerCase().trim();
      searchCounts[q] = (searchCounts[q] || 0) + 1;
    }
  }
  let topSearches = Object.entries(searchCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  // Fallback: use top tags as proxy for searches if no audit search logs
  if (topSearches.length === 0) {
    topSearches = topTags.slice(0, 20).map((t) => ({
      query: t.name,
      count: t.photosCount,
    }));
  }

  // Category photo counts via tags matching category slugs (approximate)
  const topCategories = categories.map((c) => {
    const matchingTag = topTags.find(
      (t) => t.name.toLowerCase() === c.name.toLowerCase()
    );
    return { name: c.name, slug: c.slug, photoCount: matchingTag?.photosCount || 0 };
  });

  // Approval rate
  const totalDecided = approvedPhotos + rejectedPhotos;
  const approvalRate = totalDecided > 0
    ? Math.round((approvedPhotos / totalDecided) * 100)
    : 100;

  // Storage estimate
  const storageBytes = Number(storageSumResult._sum.fileSizeBytes || 0);

  // Total views (BigInt → number)
  const viewsTotal = Number(totalViews._sum.viewsCount || 0);

  return NextResponse.json({
    totalPhotos,
    totalVideos,
    totalUsers,
    totalDownloads,
    totalViews: viewsTotal,
    pendingQueue: pendingPhotos + pendingVideos,
    pendingReports,
    approvalRate,
    downloadsByDay,
    uploadsByDay,
    signupsByDay,
    topSearches,
    zeroResultQueries: [] as { query: string; count: number }[],
    topCategories,
    topTags: topTags.map((t) => ({ name: t.name, count: t.photosCount })),
    activeUsers: activeUserCount.length,
    storageBytes,
  });
}
