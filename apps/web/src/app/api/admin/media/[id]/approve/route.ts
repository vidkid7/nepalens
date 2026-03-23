import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CONTENT_STATES, isValidTransition } from "@nepalens/shared";
import { invalidateFeeds } from "@/lib/cache";

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

  const moderatorId = (session.user as any).id;
  const body = await request.json().catch(() => ({}));
  const feature = body.feature || false;
  const curate = body.curate || false;
  const publish = body.publish || false;

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!isValidTransition(video.status, CONTENT_STATES.APPROVED)) {
      return NextResponse.json(
        { error: `Cannot approve video in '${video.status}' state` },
        { status: 422 }
      );
    }

    let targetStatus: string = CONTENT_STATES.APPROVED;
    if (publish && isValidTransition(CONTENT_STATES.APPROVED, CONTENT_STATES.PUBLISHED)) {
      targetStatus = CONTENT_STATES.PUBLISHED;
    }

    const updated = await prisma.video.update({
      where: { id },
      data: {
        status: targetStatus,
        isFeatured: feature,
      },
    });

    await prisma.moderationDecision.create({
      data: {
        moderatorId,
        mediaType: "video",
        mediaId: id,
        action: targetStatus === CONTENT_STATES.PUBLISHED ? "approve_and_publish" : "approve",
        notes: body.notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: moderatorId,
        action: "media.approve",
        targetType: "video",
        targetId: id,
        details: {
          previousStatus: video.status,
          newStatus: targetStatus,
          feature,
          publish,
        },
      },
    });

    await invalidateFeeds();

    return NextResponse.json({
      message: `Video ${targetStatus}`,
      status: targetStatus,
      id: updated.id,
    });
  }

  if (!isValidTransition(photo.status, CONTENT_STATES.APPROVED)) {
    return NextResponse.json(
      { error: `Cannot approve photo in '${photo.status}' state` },
      { status: 422 }
    );
  }

  let targetStatus: string = CONTENT_STATES.APPROVED;
  if (publish && isValidTransition(CONTENT_STATES.APPROVED, CONTENT_STATES.PUBLISHED)) {
    targetStatus = CONTENT_STATES.PUBLISHED;
  }

  const updated = await prisma.photo.update({
    where: { id },
    data: {
      status: targetStatus,
      approvedBy: moderatorId,
      approvedAt: new Date(),
      isFeatured: feature,
      isCurated: curate,
      ...(feature ? { featuredAt: new Date() } : {}),
      ...(curate ? { curatedAt: new Date() } : {}),
    },
  });

  await prisma.moderationDecision.create({
    data: {
      moderatorId,
      mediaType: "photo",
      mediaId: id,
      action: targetStatus === CONTENT_STATES.PUBLISHED ? "approve_and_publish" : "approve",
      notes: body.notes || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: moderatorId,
      action: "media.approve",
      targetType: "photo",
      targetId: id,
      details: {
        previousStatus: photo.status,
        newStatus: targetStatus,
        feature,
        curate,
        publish,
      },
    },
  });

  await invalidateFeeds();

  return NextResponse.json({
    message: `Photo ${targetStatus}`,
    status: targetStatus,
    id: updated.id,
  });
}
