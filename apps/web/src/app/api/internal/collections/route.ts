import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/internal/collections — List collections (own or by ?user=username)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("user");

  let targetUserId: string | null = null;

  if (username) {
    // Viewing another user's public collections
    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ collections: [] });
    }
    targetUserId = target.id;
  } else {
    // Viewing own collections (auth required)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    targetUserId = (session.user as any).id;
  }

  const where: any = { userId: targetUserId };
  // If viewing another user's collections, only show public ones
  if (username) {
    where.isPrivate = false;
  }

  const collections = await prisma.collection.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        take: 4,
        orderBy: { addedAt: "desc" },
      },
      _count: { select: { items: true } },
    },
  });

  const mapped = collections.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    isPrivate: c.isPrivate,
    coverUrl: null, // Could be derived from first item
    itemsCount: c._count.items,
    items: c.items,
  }));

  return NextResponse.json({ collections: mapped });
}

// POST /api/internal/collections — Create collection
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { title, description, isPrivate } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const collection = await prisma.collection.create({
    data: { userId, title: title.trim(), description, slug, isPrivate: !!isPrivate },
  });

  return NextResponse.json({ collection }, { status: 201 });
}
