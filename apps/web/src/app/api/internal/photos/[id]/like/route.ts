import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/photos/[id]/like — Toggle like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const photoId = id;

  const existing = await prisma.like.findUnique({
    where: { userId_mediaType_mediaId: { userId, mediaType: "photo", mediaId: photoId } },
  });

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.photo.update({
      where: { id: photoId },
      data: { likesCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await prisma.like.create({
      data: { userId, mediaType: "photo", mediaId: photoId },
    });
    await prisma.photo.update({
      where: { id: photoId },
      data: { likesCount: { increment: 1 } },
    });
    return NextResponse.json({ liked: true });
  }
}

// GET /api/internal/photos/[id]/like — Check like status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ liked: false });
  }

  const userId = (session.user as any).id;
  const existing = await prisma.like.findUnique({
    where: { userId_mediaType_mediaId: { userId, mediaType: "photo", mediaId: id } },
  });

  return NextResponse.json({ liked: !!existing });
}
