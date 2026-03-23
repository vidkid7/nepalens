import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const VALID_STATUSES = [
  "draft",
  "active",
  "upcoming",
  "voting",
  "completed",
  "archived",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Get submission count and submissions via submissionTag
    let submissionCount = 0;
    let submissions: any[] = [];
    if (challenge.submissionTag) {
      const tag = await prisma.tag.findUnique({
        where: { slug: challenge.submissionTag },
        select: { id: true, photosCount: true },
      });
      submissionCount = tag?.photosCount ?? 0;

      if (tag) {
        const photoTags = await prisma.photoTag.findMany({
          where: { tagId: tag.id },
          take: 50,
          include: {
            photo: {
              select: {
                id: true,
                slug: true,
                altText: true,
                originalUrl: true,
                width: true,
                height: true,
                status: true,
                likesCount: true,
                viewsCount: true,
                downloadsCount: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });
        submissions = photoTags
          .map((pt) => pt.photo)
          .filter((p) => p.status === "approved");
      }
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        submissionCount,
        submissions,
      },
    });
  } catch (error) {
    console.error("Failed to fetch challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const adminUserId = (session.user as any).id as string;

  try {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      coverUrl,
      prizeDesc,
      submissionTag,
      startsAt,
      endsAt,
      status,
      winnerId,
    } = body;

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const effectiveStart = startsAt !== undefined
      ? (startsAt ? new Date(startsAt) : null)
      : challenge.startsAt;
    const effectiveEnd = endsAt !== undefined
      ? (endsAt ? new Date(endsAt) : null)
      : challenge.endsAt;

    if (
      effectiveStart &&
      effectiveEnd &&
      new Date(effectiveEnd) <= new Date(effectiveStart)
    ) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description || null;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl || null;
    if (prizeDesc !== undefined) updateData.prizeDesc = prizeDesc || null;
    if (submissionTag !== undefined) updateData.submissionTag = submissionTag || null;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;
    if (status !== undefined) updateData.status = status;
    if (winnerId !== undefined) updateData.winnerId = winnerId || null;

    const updated = await prisma.challenge.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      userId: adminUserId,
      action: "challenge.update",
      targetType: "challenge",
      targetId: id,
      details: { changes: Object.keys(updateData), status: updated.status },
    });

    return NextResponse.json({ challenge: updated });
  } catch (error: any) {
    console.error("Failed to update challenge:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A challenge with that slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update challenge" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const adminUserId = (session.user as any).id as string;

  try {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft challenges can be deleted" },
        { status: 400 }
      );
    }

    await prisma.challenge.delete({ where: { id } });

    await logAuditEvent({
      userId: adminUserId,
      action: "challenge.delete",
      targetType: "challenge",
      targetId: id,
      details: { title: challenge.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete challenge:", error);
    return NextResponse.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    );
  }
}
