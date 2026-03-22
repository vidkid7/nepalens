import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/users/[username]/follow — Toggle follow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followerId = (session.user as any).id;
  const target = await prisma.user.findUnique({ where: { username } });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.id === followerId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  if (existing) {
    // Unfollow
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId: target.id } },
    });
    await prisma.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } });
    await prisma.user.update({ where: { id: target.id }, data: { followersCount: { decrement: 1 } } });
    return NextResponse.json({ following: false });
  } else {
    // Follow
    await prisma.follow.create({ data: { followerId, followingId: target.id } });
    await prisma.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } });
    await prisma.user.update({ where: { id: target.id }, data: { followersCount: { increment: 1 } } });
    return NextResponse.json({ following: true });
  }
}

// GET /api/internal/users/[username]/follow — Check follow status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ following: false });
  }

  const followerId = (session.user as any).id;
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return NextResponse.json({ following: false });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  return NextResponse.json({ following: !!existing });
}
