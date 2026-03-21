import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [heroImages, sponsorPlacements] = await Promise.all([
      prisma.heroImage.findMany({
        orderBy: { displayDate: "desc" },
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
      }),
      prisma.sponsorPlacement.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ heroImages, sponsorPlacements });
  } catch (error) {
    console.error("Failed to fetch CMS data:", error);
    return NextResponse.json(
      { error: "Failed to fetch CMS data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 }
      );
    }

    const adminUserId = (session.user as any).id as string;
    let result: any;

    switch (type) {
      case "hero-image": {
        if (!data.photoId || !data.displayDate) {
          return NextResponse.json(
            { error: "Photo ID and display date are required" },
            { status: 400 }
          );
        }

        // Verify photo exists
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

        result = await prisma.heroImage.create({
          data: {
            photoId: data.photoId,
            userId: adminUserId,
            displayDate: new Date(data.displayDate),
            isActive: data.isActive ?? true,
          },
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
        if (!data.name || !data.slot) {
          return NextResponse.json(
            { error: "Name and slot are required" },
            { status: 400 }
          );
        }

        result = await prisma.sponsorPlacement.create({
          data: {
            name: data.name.trim(),
            slot: data.slot.trim(),
            imageUrl: data.imageUrl || null,
            linkUrl: data.linkUrl || null,
            isActive: data.isActive ?? true,
            startsAt: data.startsAt ? new Date(data.startsAt) : null,
            endsAt: data.endsAt ? new Date(data.endsAt) : null,
          },
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
      action: "cms.create",
      targetType: type,
      targetId: result.id,
      details: { type, data },
    });

    return NextResponse.json({ item: result }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create CMS item:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An item with that unique constraint already exists (e.g. duplicate display date for hero image)" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
