import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const reason = searchParams.get("reason") || undefined;
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "20")));

  const where: Record<string, unknown> = {};
  if (status !== "all") where.status = status;
  if (reason) where.reason = reason;

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  try {
    const [total, pending, reviewed, dismissed, escalated, totalFiltered, reports] =
      await Promise.all([
        prisma.report.count(),
        prisma.report.count({ where: { status: "pending" } }),
        prisma.report.count({ where: { status: "reviewed" } }),
        prisma.report.count({ where: { status: "dismissed" } }),
        prisma.report.count({ where: { status: "escalated" } }),
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          include: {
            reporter: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy,
          take: perPage,
          skip: (page - 1) * perPage,
        }),
      ]);

    // Batch-fetch associated media for all reports
    const photoIds = reports
      .filter((r) => r.mediaType === "photo")
      .map((r) => r.mediaId);
    const videoIds = reports
      .filter((r) => r.mediaType === "video")
      .map((r) => r.mediaId);

    const [photos, videos] = await Promise.all([
      photoIds.length > 0
        ? prisma.photo.findMany({
            where: { id: { in: photoIds } },
            select: {
              id: true,
              altText: true,
              originalUrl: true,
              slug: true,
              status: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isBanned: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      videoIds.length > 0
        ? prisma.video.findMany({
            where: { id: { in: videoIds } },
            select: {
              id: true,
              altText: true,
              thumbnailUrl: true,
              slug: true,
              status: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  isBanned: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const photoMap = new Map(
      photos.map((p) => [
        p.id,
        {
          ...p,
          type: "photo" as const,
          title: p.altText || p.slug,
          thumbnailUrl: p.originalUrl,
        },
      ])
    );
    const videoMap = new Map(
      videos.map((v) => [
        v.id,
        {
          ...v,
          type: "video" as const,
          title: v.altText || v.slug,
          thumbnailUrl: v.thumbnailUrl,
        },
      ])
    );

    const enrichedReports = reports.map((report) => ({
      ...report,
      media:
        report.mediaType === "photo"
          ? photoMap.get(report.mediaId) || null
          : videoMap.get(report.mediaId) || null,
    }));

    return NextResponse.json({
      reports: enrichedReports,
      total: totalFiltered,
      page,
      perPage,
      totalPages: Math.ceil(totalFiltered / perPage),
      counts: { total, pending, reviewed, dismissed, escalated },
    });
  } catch (error) {
    console.error("Admin reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
