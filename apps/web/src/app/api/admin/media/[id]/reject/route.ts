import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CONTENT_STATES, isValidTransition } from "@pixelstock/shared";

// PATCH /api/admin/media/[id]/reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const moderatorId = (session.user as any).id;
  const body = await request.json().catch(() => ({} as any));
  const action = body.action || "reject";
  const reason = body.reason || "";
  const notes = body.notes || null;

  const targetStatus =
    action === "needs_changes" ? CONTENT_STATES.NEEDS_CHANGES : CONTENT_STATES.REJECTED;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!isValidTransition(video.status, targetStatus)) {
      return NextResponse.json(
        { error: `Cannot transition video from '${video.status}' to '${targetStatus}'` },
        { status: 422 }
      );
    }

    const updated = await prisma.video.update({
      where: { id },
      data: { status: targetStatus },
    });

    await prisma.moderationDecision.create({
      data: {
        moderatorId,
        mediaType: "video",
        mediaId: id,
        action: targetStatus,
        reasonCode: reason || null,
        notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: moderatorId,
        action: `media.${targetStatus}`,
        targetType: "video",
        targetId: id,
        details: { previousStatus: video.status, newStatus: targetStatus, reason },
      },
    });

    return NextResponse.json({
      message: `Video set to ${targetStatus}`,
      status: targetStatus,
      id: updated.id,
    });
  }

  if (!isValidTransition(photo.status, targetStatus)) {
    return NextResponse.json(
      { error: `Cannot transition photo from '${photo.status}' to '${targetStatus}'` },
      { status: 422 }
    );
  }

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      status: targetStatus,
      rejectionReason: reason || "Does not meet quality guidelines",
    },
  });

  await prisma.moderationDecision.create({
    data: {
      moderatorId,
      mediaType: "photo",
      mediaId: id,
      action: targetStatus,
      reasonCode: reason || null,
      notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: moderatorId,
      action: `media.${targetStatus}`,
      targetType: "photo",
      targetId: id,
      details: { previousStatus: photo.status, newStatus: targetStatus, reason },
    },
  });

  return NextResponse.json({
    message: `Photo set to ${targetStatus}`,
    status: targetStatus,
    id: updated.id,
  });
}
