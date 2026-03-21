import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 }
      );
    }

    const adminUserId = (session.user as any).id;
    let result: any;

    switch (type) {
      case "category": {
        result = await prisma.category.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.slug !== undefined && { slug: data.slug }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });
        break;
      }

      case "tag": {
        result = await prisma.tag.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.slug !== undefined && { slug: data.slug }),
          },
        });
        break;
      }

      case "featured-topic": {
        result = await prisma.featuredTopic.update({
          where: { id },
          data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.slug !== undefined && { slug: data.slug }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });
        break;
      }

      case "synonym": {
        result = await prisma.searchSynonym.update({
          where: { id },
          data: {
            ...(data.term !== undefined && {
              term: data.term.toLowerCase().trim(),
            }),
            ...(data.synonym !== undefined && {
              synonym: data.synonym.toLowerCase().trim(),
            }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
          },
        });
        break;
      }

      case "blocked-keyword": {
        result = await prisma.blockedKeyword.update({
          where: { id },
          data: {
            ...(data.keyword !== undefined && {
              keyword: data.keyword.toLowerCase().trim(),
            }),
            ...(data.reason !== undefined && { reason: data.reason }),
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
      action: `taxonomy.update`,
      targetType: type,
      targetId: id,
      details: { type, changes: data },
    });

    return NextResponse.json({ item: result });
  } catch (error: any) {
    console.error("Failed to update taxonomy item:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An item with that name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing type" },
        { status: 400 }
      );
    }

    const adminUserId = (session.user as any).id;
    let deletedItem: any;

    switch (type) {
      case "category":
        deletedItem = await prisma.category.delete({ where: { id } });
        break;
      case "tag":
        deletedItem = await prisma.tag.delete({ where: { id } });
        break;
      case "featured-topic":
        deletedItem = await prisma.featuredTopic.delete({ where: { id } });
        break;
      case "synonym":
        deletedItem = await prisma.searchSynonym.delete({ where: { id } });
        break;
      case "blocked-keyword":
        deletedItem = await prisma.blockedKeyword.delete({ where: { id } });
        break;
      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    await logAuditEvent({
      userId: adminUserId,
      action: `taxonomy.delete`,
      targetType: type,
      targetId: id,
      details: { type, deletedItem },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete taxonomy item:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
