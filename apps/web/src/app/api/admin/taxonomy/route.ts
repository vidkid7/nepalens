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
    const [categories, tags, featuredTopics, searchSynonyms, blockedKeywords] =
      await Promise.all([
        prisma.category.findMany({ orderBy: { position: "asc" } }),
        prisma.tag.findMany({
          orderBy: { photosCount: "desc" },
          take: 100,
        }),
        prisma.featuredTopic.findMany({ orderBy: { position: "asc" } }),
        prisma.searchSynonym.findMany({ orderBy: { term: "asc" } }),
        prisma.blockedKeyword.findMany({ orderBy: { createdAt: "desc" } }),
      ]);

    return NextResponse.json({
      categories,
      tags,
      featuredTopics,
      searchSynonyms,
      blockedKeywords,
    });
  } catch (error) {
    console.error("Failed to fetch taxonomy data:", error);
    return NextResponse.json(
      { error: "Failed to fetch taxonomy data" },
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

    const adminUserId = (session.user as any).id;
    let result: any;

    switch (type) {
      case "category": {
        if (!data.name || !data.slug) {
          return NextResponse.json(
            { error: "Name and slug are required" },
            { status: 400 }
          );
        }
        result = await prisma.category.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            iconUrl: data.iconUrl || null,
            position: data.position ?? 0,
          },
        });
        break;
      }

      case "tag": {
        if (!data.name || !data.slug) {
          return NextResponse.json(
            { error: "Name and slug are required" },
            { status: 400 }
          );
        }
        result = await prisma.tag.create({
          data: {
            name: data.name,
            slug: data.slug,
          },
        });
        break;
      }

      case "featured-topic": {
        if (!data.name || !data.slug) {
          return NextResponse.json(
            { error: "Name and slug are required" },
            { status: 400 }
          );
        }
        result = await prisma.featuredTopic.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            coverUrl: data.coverUrl || null,
            position: data.position ?? 0,
            isActive: data.isActive ?? true,
          },
        });
        break;
      }

      case "synonym": {
        if (!data.term || !data.synonym) {
          return NextResponse.json(
            { error: "Term and synonym are required" },
            { status: 400 }
          );
        }
        result = await prisma.searchSynonym.create({
          data: {
            term: data.term.toLowerCase().trim(),
            synonym: data.synonym.toLowerCase().trim(),
          },
        });
        break;
      }

      case "blocked-keyword": {
        if (!data.keyword) {
          return NextResponse.json(
            { error: "Keyword is required" },
            { status: 400 }
          );
        }
        result = await prisma.blockedKeyword.create({
          data: {
            keyword: data.keyword.toLowerCase().trim(),
            reason: data.reason || null,
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
      action: `taxonomy.create`,
      targetType: type,
      targetId: result.id,
      details: { type, data },
    });

    return NextResponse.json({ item: result }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create taxonomy item:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An item with that name or slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
