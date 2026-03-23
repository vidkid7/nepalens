import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/collections/[id]/items — Add media to collection
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
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const { mediaType, mediaId } = await request.json();
  if (!mediaType || !mediaId) {
    return NextResponse.json({ error: "mediaType and mediaId required" }, { status: 400 });
  }

  const existing = await prisma.collectionItem.findUnique({
    where: { collectionId_mediaType_mediaId: { collectionId: id, mediaType, mediaId } },
  });

  if (existing) {
    return NextResponse.json({ message: "Already in collection" });
  }

  await prisma.collectionItem.create({
    data: { collectionId: id, mediaType, mediaId },
  });

  await prisma.collection.update({
    where: { id },
    data: { itemsCount: { increment: 1 } },
  });

  return NextResponse.json({ message: "Added to collection" }, { status: 201 });
}

// DELETE /api/internal/collections/[id]/items — Remove media from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
  });

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const { mediaType, mediaId } = await request.json();

  await prisma.collectionItem.deleteMany({
    where: { collectionId: id, mediaType, mediaId },
  });

  await prisma.collection.update({
    where: { id },
    data: { itemsCount: { decrement: 1 } },
  });

  return NextResponse.json({ message: "Removed from collection" });
}
