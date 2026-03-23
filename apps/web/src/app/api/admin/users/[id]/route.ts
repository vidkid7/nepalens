import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = [
  "ban",
  "unban",
  "verify",
  "unverify",
  "make-admin",
  "remove-admin",
  "make-contributor",
  "remove-contributor",
] as const;

type Action = (typeof VALID_ACTIONS)[number];

function getUpdateData(action: Action): Record<string, boolean> {
  switch (action) {
    case "ban":
      return { isBanned: true };
    case "unban":
      return { isBanned: false };
    case "verify":
      return { isVerified: true };
    case "unverify":
      return { isVerified: false };
    case "make-admin":
      return { isAdmin: true };
    case "remove-admin":
      return { isAdmin: false };
    case "make-contributor":
      return { isContributor: true };
    case "remove-contributor":
      return { isContributor: false };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
      location: true,
      websiteUrl: true,
      avatarUrl: true,
      coverUrl: true,
      isAdmin: true,
      isContributor: true,
      isVerified: true,
      isBanned: true,
      followersCount: true,
      followingCount: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          photos: true,
          videos: true,
          downloads: true,
          reports: true,
          collections: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Aggregate total views and downloads across user's media
  const [photoStats, videoStats] = await Promise.all([
    prisma.photo.aggregate({
      where: { userId: id },
      _sum: { viewsCount: true, downloadsCount: true },
    }),
    prisma.video.aggregate({
      where: { userId: id },
      _sum: { viewsCount: true, downloadsCount: true },
    }),
  ]);

  const totalViews =
    Number(photoStats._sum.viewsCount || 0) +
    Number(videoStats._sum.viewsCount || 0);
  const totalDownloads =
    Number(photoStats._sum.downloadsCount || 0) +
    Number(videoStats._sum.downloadsCount || 0);

  return NextResponse.json({
    user: {
      ...user,
      totalViews,
      totalDownloads,
    },
  });
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
  const body = await request.json();
  const action = body.action as Action;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  // Prevent self-demotion for admin removal
  const adminUserId = (session.user as any).id;
  if (action === "remove-admin" && id === adminUserId) {
    return NextResponse.json(
      { error: "Cannot remove your own admin privileges" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData = getUpdateData(action);
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      isAdmin: true,
      isContributor: true,
      isVerified: true,
      isBanned: true,
      followersCount: true,
      followingCount: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          photos: true,
          videos: true,
          downloads: true,
          reports: true,
        },
      },
    },
  });

  await logAuditEvent({
    userId: adminUserId,
    action: `user.${action}`,
    targetType: "user",
    targetId: id,
    details: {
      action,
      targetUsername: existing.username,
      changes: updateData,
    },
  });

  return NextResponse.json({ user: updatedUser });
}
