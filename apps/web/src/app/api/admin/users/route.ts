import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "all";
  const status = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "20", 10)));

  // Build WHERE clause
  const where: any = {};

  // Search filter
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
    ];
  }

  // Role filter
  switch (role) {
    case "admin":
      where.isAdmin = true;
      break;
    case "contributor":
      where.isContributor = true;
      break;
    case "regular":
      where.isAdmin = false;
      where.isContributor = false;
      break;
  }

  // Status filter
  switch (status) {
    case "active":
      where.isBanned = false;
      break;
    case "banned":
      where.isBanned = true;
      break;
    case "verified":
      where.isVerified = true;
      break;
  }

  // Build ORDER BY
  let orderBy: any;
  switch (sort) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "most-uploads":
      orderBy = { photos: { _count: "desc" } };
      break;
    case "most-downloads":
      // Sort by follower count as proxy; downloads are on media not user directly
      orderBy = { followersCount: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        location: true,
        websiteUrl: true,
        isAdmin: true,
        isContributor: true,
        isVerified: true,
        isBanned: true,
        followersCount: true,
        followingCount: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            photos: true,
            videos: true,
            downloads: true,
            reports: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}
