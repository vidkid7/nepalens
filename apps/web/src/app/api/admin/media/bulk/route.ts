import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// PATCH /api/admin/media/bulk — Bulk approve/reject/feature media
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { ids, action } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const validActions = ["approved", "rejected", "featured", "unfeatured", "removed"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const moderatorId = (session.user as any).id;
    const now = new Date();
    let updatedCount = 0;

    for (const id of ids) {
      const photo = await prisma.photo.findUnique({ where: { id } });

      if (photo) {
        if (action === "approved") {
          await prisma.photo.update({
            where: { id },
            data: { status: "approved", approvedBy: moderatorId, approvedAt: now },
          });
        } else if (action === "rejected") {
          await prisma.photo.update({
            where: { id },
            data: { status: "rejected", rejectionReason: "Bulk action by moderator" },
          });
        } else if (action === "featured") {
          await prisma.photo.update({
            where: { id },
            data: { isFeatured: true, featuredAt: now },
          });
        } else if (action === "unfeatured") {
          await prisma.photo.update({
            where: { id },
            data: { isFeatured: false, featuredAt: null },
          });
        } else if (action === "removed") {
          await prisma.photo.update({
            where: { id },
            data: { status: "removed" },
          });
        }
        updatedCount++;
        continue;
      }

      const video = await prisma.video.findUnique({ where: { id } });
      if (video) {
        if (action === "approved") {
          await prisma.video.update({ where: { id }, data: { status: "approved" } });
        } else if (action === "rejected") {
          await prisma.video.update({ where: { id }, data: { status: "rejected" } });
        } else if (action === "featured") {
          await prisma.video.update({ where: { id }, data: { isFeatured: true } });
        } else if (action === "unfeatured") {
          await prisma.video.update({ where: { id }, data: { isFeatured: false } });
        } else if (action === "removed") {
          await prisma.video.update({ where: { id }, data: { status: "removed" } });
        }
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `${updatedCount} item(s) updated`,
      updatedCount,
    });
  } catch (error) {
    console.error("Bulk action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
