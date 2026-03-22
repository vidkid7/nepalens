import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/admin/media/[id]/approve
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const feature = body.feature || false;
  const curate = body.curate || false;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    // Try video
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.video.update({
      where: { id },
      data: {
        status: "approved",
        isFeatured: feature,
      },
    });
    return NextResponse.json({ message: "Video approved" });
  }

  await prisma.photo.update({
    where: { id },
    data: {
      status: "approved",
      approvedBy: (session.user as any).id,
      approvedAt: new Date(),
      isFeatured: feature,
      isCurated: curate,
      ...(feature ? { featuredAt: new Date() } : {}),
      ...(curate ? { curatedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ message: "Photo approved" });
}
