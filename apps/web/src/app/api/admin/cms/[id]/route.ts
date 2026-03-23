import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

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
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 }
      );
    }

    let result: any;

    switch (type) {
      case "hero-image": {
        const existing = await prisma.heroImage.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: "Hero image not found" },
            { status: 404 }
          );
        }

        const updateData: any = {};
        if (data.photoId !== undefined) {
          const photo = await prisma.photo.findUnique({
            where: { id: data.photoId },
            select: { id: true },
          });
          if (!photo) {
            return NextResponse.json(
              { error: "Photo not found" },
              { status: 404 }
            );
          }
          updateData.photoId = data.photoId;
        }
        if (data.displayDate !== undefined) updateData.displayDate = new Date(data.displayDate);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        result = await prisma.heroImage.update({
          where: { id },
          data: updateData,
          include: {
            photo: {
              select: {
                id: true,
                slug: true,
                altText: true,
                originalUrl: true,
                width: true,
                height: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        });
        break;
      }

      case "sponsor-placement": {
        const existing = await prisma.sponsorPlacement.findUnique({
          where: { id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Sponsor placement not found" },
            { status: 404 }
          );
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.slot !== undefined) updateData.slot = data.slot.trim();
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
        if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl || null;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
        if (data.endsAt !== undefined) updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;

        result = await prisma.sponsorPlacement.update({
          where: { id },
          data: updateData,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    await logAuditEvent({
      userId: adminUserId,
      action: "cms.update",
      targetType: type,
      targetId: id,
      details: { type, changes: Object.keys(data) },
    });

    return NextResponse.json({ item: result });
  } catch (error: any) {
    console.error("Failed to update CMS item:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Unique constraint violation (e.g. duplicate display date)" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update item" },
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
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing type" },
        { status: 400 }
      );
    }

    switch (type) {
      case "hero-image": {
        const existing = await prisma.heroImage.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { error: "Hero image not found" },
            { status: 404 }
          );
        }
        await prisma.heroImage.delete({ where: { id } });
        break;
      }

      case "sponsor-placement": {
        const existing = await prisma.sponsorPlacement.findUnique({
          where: { id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Sponsor placement not found" },
            { status: 404 }
          );
        }
        await prisma.sponsorPlacement.delete({ where: { id } });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    await logAuditEvent({
      userId: adminUserId,
      action: "cms.delete",
      targetType: type,
      targetId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete CMS item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
