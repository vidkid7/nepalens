import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const VALID_ACTIONS = ["review", "dismiss", "escalate"] as const;
const VALID_MEDIA_ACTIONS = ["remove", "hide", "none"] as const;
const VALID_USER_ACTIONS = ["ban", "warn", "none"] as const;

const STATUS_MAP: Record<string, string> = {
  review: "reviewed",
  dismiss: "dismissed",
  escalate: "escalated",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const moderatorId = (session.user as any).id as string;
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, notes, mediaAction, userAction } = body as {
      action: string;
      notes?: string;
      mediaAction?: string;
      userAction?: string;
    };

    if (
      !action ||
      !VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid action. Must be review, dismiss, or escalate." },
        { status: 400 }
      );
    }

    if (
      mediaAction &&
      !VALID_MEDIA_ACTIONS.includes(
        mediaAction as (typeof VALID_MEDIA_ACTIONS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid mediaAction. Must be remove, hide, or none." },
        { status: 400 }
      );
    }

    if (
      userAction &&
      !VALID_USER_ACTIONS.includes(
        userAction as (typeof VALID_USER_ACTIONS)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid userAction. Must be ban, warn, or none." },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: STATUS_MAP[action],
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Handle media action (hide or remove)
    if (mediaAction && mediaAction !== "none") {
      const mediaStatus = mediaAction === "remove" ? "removed" : "hidden";
      if (report.mediaType === "photo") {
        await prisma.photo.update({
          where: { id: report.mediaId },
          data: { status: mediaStatus },
        });
      } else if (report.mediaType === "video") {
        await prisma.video.update({
          where: { id: report.mediaId },
          data: { status: mediaStatus },
        });
      }
    }

    // Handle user action (ban or warn the content owner)
    if (userAction && userAction !== "none") {
      let ownerId: string | null = null;
      if (report.mediaType === "photo") {
        const photo = await prisma.photo.findUnique({
          where: { id: report.mediaId },
          select: { userId: true },
        });
        ownerId = photo?.userId || null;
      } else if (report.mediaType === "video") {
        const video = await prisma.video.findUnique({
          where: { id: report.mediaId },
          select: { userId: true },
        });
        ownerId = video?.userId || null;
      }

      if (ownerId) {
        if (userAction === "ban") {
          await prisma.user.update({
            where: { id: ownerId },
            data: { isBanned: true },
          });
        }

        // Log warning/ban as a separate audit event
        await logAuditEvent({
          userId: moderatorId,
          action: userAction === "ban" ? "user.ban" : "user.warn",
          targetType: "user",
          targetId: ownerId,
          details: {
            triggeredByReport: id,
            reason: report.reason,
          },
        });
      }
    }

    // Create moderation decision record
    await prisma.moderationDecision.create({
      data: {
        moderatorId,
        mediaType: report.mediaType,
        mediaId: report.mediaId,
        action: `report_${action}`,
        reasonCode: report.reason,
        notes: notes || null,
      },
    });

    // Audit log for the report decision
    await logAuditEvent({
      userId: moderatorId,
      action: `report.${action}`,
      targetType: "report",
      targetId: id,
      details: {
        reportReason: report.reason,
        mediaType: report.mediaType,
        mediaId: report.mediaId,
        mediaAction: mediaAction || "none",
        userAction: userAction || "none",
        notes: notes || null,
      },
    });

    // Re-fetch with media info for the response
    let media = null;
    if (report.mediaType === "photo") {
      const photo = await prisma.photo.findUnique({
        where: { id: report.mediaId },
        select: {
          id: true,
          altText: true,
          originalUrl: true,
          slug: true,
          status: true,
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isBanned: true,
            },
          },
        },
      });
      if (photo) {
        media = {
          ...photo,
          type: "photo",
          title: photo.altText || photo.slug,
          thumbnailUrl: photo.originalUrl,
        };
      }
    } else if (report.mediaType === "video") {
      const video = await prisma.video.findUnique({
        where: { id: report.mediaId },
        select: {
          id: true,
          altText: true,
          thumbnailUrl: true,
          slug: true,
          status: true,
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isBanned: true,
            },
          },
        },
      });
      if (video) {
        media = {
          ...video,
          type: "video",
          title: video.altText || video.slug,
          thumbnailUrl: video.thumbnailUrl,
        };
      }
    }

    return NextResponse.json({
      report: { ...updatedReport, media },
    });
  } catch (error) {
    console.error("Admin report action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
