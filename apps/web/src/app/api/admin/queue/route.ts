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

// GET /api/admin/queue — Get pending media for review
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "photo";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  if (type === "video") {
    const [videos, count] = await Promise.all([
      prisma.video.findMany({
        where: { status: "pending" },
        include: { user: { select: { username: true, displayName: true } } },
        orderBy: { createdAt: "asc" },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.video.count({ where: { status: "pending" } }),
    ]);
    return NextResponse.json({ items: videos, total: count, type: "video" });
  }

  const [photos, count] = await Promise.all([
    prisma.photo.findMany({
      where: { status: "pending" },
      include: { user: { select: { username: true, displayName: true } } },
      orderBy: { createdAt: "asc" },
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    prisma.photo.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({ items: photos, total: count, type: "photo" });
}
