import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/videos/[id]/like — Toggle like
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
  const videoId = id;

  const existing = await prisma.like.findUnique({
    where: { userId_mediaType_mediaId: { userId, mediaType: "video", mediaId: videoId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.video.update({
      where: { id: videoId },
      data: { likesCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.like.create({
      data: { userId, mediaType: "video", mediaId: videoId },
    });
    await prisma.video.update({
      where: { id: videoId },
      data: { likesCount: { increment: 1 } },
    });
    return NextResponse.json({ liked: true });
  }
}

// GET /api/internal/videos/[id]/like — Check like status
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
    where: { userId_mediaType_mediaId: { userId, mediaType: "video", mediaId: id } },
  });

  return NextResponse.json({ liked: !!existing });
}
