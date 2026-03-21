import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/admin/media/[id]/reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reason } = await request.json().catch(() => ({ reason: "" }));

  const photo = await prisma.photo.findUnique({ where: { id: params.id } });
  if (!photo) {
    const video = await prisma.video.findUnique({ where: { id: params.id } });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.video.update({
      where: { id: params.id },
      data: { status: "rejected" },
    });
    return NextResponse.json({ message: "Video rejected" });
  }

  await prisma.photo.update({
    where: { id: params.id },
    data: {
      status: "rejected",
      rejectionReason: reason || "Does not meet quality guidelines",
    },
  });

  return NextResponse.json({ message: "Photo rejected" });
}
