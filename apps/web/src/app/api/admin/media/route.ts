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

// GET /api/admin/media — Paginated media list with filters and status counts
export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const type = searchParams.get("type") || undefined;
  const q = searchParams.get("q") || undefined;
  const sort = searchParams.get("sort") || "newest";
  const dateRange = searchParams.get("dateRange") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "20")));

  // Build date filter
  let dateFilter: Date | undefined;
  if (dateRange === "today") {
    dateFilter = new Date();
    dateFilter.setHours(0, 0, 0, 0);
  } else if (dateRange === "week") {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (dateRange === "month") {
    dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 1);
  }

  // Build sort
  type SortOrder = "asc" | "desc";
  let orderBy: Record<string, SortOrder> = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  else if (sort === "most_views") orderBy = { viewsCount: "desc" };
  else if (sort === "most_downloads") orderBy = { downloadsCount: "desc" };

  const includePhotos = type !== "video";
  const includeVideos = type !== "photo";

  // Helper to build where clause
  const buildPhotoWhere = () => {
    const where: any = {};
    if (status) where.status = status;
    if (dateFilter) where.createdAt = { gte: dateFilter };
    if (q) {
      where.OR = [
        { altText: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { user: { username: { contains: q, mode: "insensitive" } } },
        { user: { displayName: { contains: q, mode: "insensitive" } } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ];
    }
    return where;
  };

  const buildVideoWhere = () => {
    const where: any = {};
    if (status) where.status = status;
    if (dateFilter) where.createdAt = { gte: dateFilter };
    if (q) {
      where.OR = [
        { altText: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { user: { username: { contains: q, mode: "insensitive" } } },
        { user: { displayName: { contains: q, mode: "insensitive" } } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ];
    }
    return where;
  };

  try {
    // Status counts (always across all media)
    const [
      photoTotal,
      photoPending,
      photoApproved,
      photoRejected,
      videoTotal,
      videoPending,
      videoApproved,
      videoRejected,
    ] = await Promise.all([
      prisma.photo.count(),
      prisma.photo.count({ where: { status: "pending" } }),
      prisma.photo.count({ where: { status: "approved" } }),
      prisma.photo.count({ where: { status: "rejected" } }),
      prisma.video.count(),
      prisma.video.count({ where: { status: "pending" } }),
      prisma.video.count({ where: { status: "approved" } }),
      prisma.video.count({ where: { status: "rejected" } }),
    ]);

    const counts = {
      total: photoTotal + videoTotal,
      pending: photoPending + videoPending,
      approved: photoApproved + videoApproved,
      rejected: photoRejected + videoRejected,
    };

    // Fetch media items
    type MediaItem = {
      id: string;
      type: "photo" | "video";
      slug: string;
      title: string | null;
      altText: string | null;
      description: string | null;
      width: number;
      height: number;
      thumbnailUrl: string | null;
      status: string;
      isFeatured: boolean;
      isCurated: boolean;
      viewsCount: number;
      downloadsCount: number;
      likesCount: number;
      createdAt: Date;
      tags: string[];
      user: {
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
    };

    let allItems: MediaItem[] = [];

    if (includePhotos) {
      const photoWhere = buildPhotoWhere();
      const photos = await prisma.photo.findMany({
        where: photoWhere,
        select: {
          id: true,
          slug: true,
          altText: true,
          description: true,
          width: true,
          height: true,
          originalUrl: true,
          status: true,
          isFeatured: true,
          isCurated: true,
          viewsCount: true,
          downloadsCount: true,
          likesCount: true,
          createdAt: true,
          user: { select: { username: true, displayName: true, avatarUrl: true } },
          tags: { select: { tag: { select: { name: true } } }, take: 10 },
        },
        orderBy,
        ...(includeVideos
          ? {}
          : { take: perPage, skip: (page - 1) * perPage }),
      });

      allItems.push(
        ...photos.map((p) => ({
          id: p.id,
          type: "photo" as const,
          slug: p.slug,
          title: p.altText,
          altText: p.altText,
          description: p.description,
          width: p.width,
          height: p.height,
          thumbnailUrl: p.originalUrl,
          status: p.status,
          isFeatured: p.isFeatured,
          isCurated: p.isCurated,
          viewsCount: Number(p.viewsCount),
          downloadsCount: Number(p.downloadsCount),
          likesCount: p.likesCount,
          createdAt: p.createdAt,
          tags: p.tags.map((t) => t.tag.name),
          user: p.user,
        }))
      );
    }

    if (includeVideos) {
      const videoWhere = buildVideoWhere();
      const videos = await prisma.video.findMany({
        where: videoWhere,
        select: {
          id: true,
          slug: true,
          altText: true,
          description: true,
          width: true,
          height: true,
          thumbnailUrl: true,
          status: true,
          isFeatured: true,
          viewsCount: true,
          downloadsCount: true,
          likesCount: true,
          createdAt: true,
          user: { select: { username: true, displayName: true, avatarUrl: true } },
          tags: { select: { tag: { select: { name: true } } }, take: 10 },
        },
        orderBy,
        ...(includePhotos
          ? {}
          : { take: perPage, skip: (page - 1) * perPage }),
      });

      allItems.push(
        ...videos.map((v) => ({
          id: v.id,
          type: "video" as const,
          slug: v.slug,
          title: v.altText,
          altText: v.altText,
          description: v.description,
          width: v.width,
          height: v.height,
          thumbnailUrl: v.thumbnailUrl,
          status: v.status,
          isFeatured: v.isFeatured,
          isCurated: false,
          viewsCount: Number(v.viewsCount),
          downloadsCount: Number(v.downloadsCount),
          likesCount: v.likesCount,
          createdAt: v.createdAt,
          tags: v.tags.map((t) => t.tag.name),
          user: v.user,
        }))
      );
    }

    // If fetching both types, sort combined + paginate in memory
    if (includePhotos && includeVideos) {
      allItems.sort((a, b) => {
        if (sort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
        if (sort === "most_views") return b.viewsCount - a.viewsCount;
        if (sort === "most_downloads") return b.downloadsCount - a.downloadsCount;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    // Get total filtered count
    let filteredTotal = 0;
    if (includePhotos) {
      filteredTotal += await prisma.photo.count({ where: buildPhotoWhere() });
    }
    if (includeVideos) {
      filteredTotal += await prisma.video.count({ where: buildVideoWhere() });
    }

    // Paginate combined results
    const paginatedItems =
      includePhotos && includeVideos
        ? allItems.slice((page - 1) * perPage, page * perPage)
        : allItems;

    return NextResponse.json({
      items: paginatedItems,
      total: filteredTotal,
      page,
      perPage,
      totalPages: Math.ceil(filteredTotal / perPage),
      counts,
    });
  } catch (error) {
    console.error("Admin media API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
