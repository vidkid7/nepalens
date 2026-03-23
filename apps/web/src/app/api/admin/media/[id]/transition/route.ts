import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CONTENT_STATES, isValidTransition } from "@nepalens/shared";

const VALID_STATES = new Set(Object.values(CONTENT_STATES));

// PATCH /api/admin/media/[id]/transition
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
  const body = await request.json();
  const { targetState, reason, notes } = body;

  if (!targetState || !VALID_STATES.has(targetState)) {
    return NextResponse.json(
      { error: `Invalid target state '${targetState}'. Valid states: ${[...VALID_STATES].join(", ")}` },
      { status: 400 }
    );
  }

  // Try photo first, then video
  let mediaType: "photo" | "video";
  let currentStatus: string;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (photo) {
    mediaType = "photo";
    currentStatus = photo.status;
  } else {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    mediaType = "video";
    currentStatus = video.status;
  }

  if (!isValidTransition(currentStatus, targetState)) {
    return NextResponse.json(
      {
        error: `Invalid transition from '${currentStatus}' to '${targetState}'`,
        currentStatus,
        targetState,
      },
      { status: 422 }
    );
  }

  // Perform the update
  const updateData: Record<string, any> = { status: targetState };

  if (mediaType === "photo") {
    if (targetState === CONTENT_STATES.APPROVED) {
      updateData.approvedBy = moderatorId;
      updateData.approvedAt = new Date();
    }
    if (targetState === CONTENT_STATES.REJECTED || targetState === CONTENT_STATES.NEEDS_CHANGES) {
      updateData.rejectionReason = reason || null;
    }
  }

  const updated =
    mediaType === "photo"
      ? await prisma.photo.update({ where: { id }, data: updateData })
      : await prisma.video.update({ where: { id }, data: updateData });

  await prisma.moderationDecision.create({
    data: {
      moderatorId,
      mediaType,
      mediaId: id,
      action: targetState,
      reasonCode: reason || null,
      notes: notes || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: moderatorId,
      action: `media.transition`,
      targetType: mediaType,
      targetId: id,
      details: {
        previousStatus: currentStatus,
        newStatus: targetState,
        reason: reason || null,
        notes: notes || null,
      },
    },
  });

  return NextResponse.json({
    message: `${mediaType} transitioned from '${currentStatus}' to '${targetState}'`,
    id: updated.id,
    previousStatus: currentStatus,
    status: targetState,
    mediaType,
  });
}
