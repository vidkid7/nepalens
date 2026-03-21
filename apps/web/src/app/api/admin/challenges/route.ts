import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

const VALID_STATUSES = [
  "draft",
  "active",
  "upcoming",
  "voting",
  "completed",
  "archived",
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("per_page") || "20", 10))
    );
    const q = searchParams.get("q")?.trim() || "";

    const where: any = {};

    if (status !== "all" && VALID_STATUSES.includes(status as any)) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.challenge.count({ where }),
    ]);

    // Fetch submission counts for each challenge via their submissionTag
    const challengesWithCounts = await Promise.all(
      challenges.map(async (c) => {
        let submissionCount = 0;
        if (c.submissionTag) {
          const tag = await prisma.tag.findUnique({
            where: { slug: c.submissionTag },
            select: { photosCount: true },
          });
          submissionCount = tag?.photosCount ?? 0;
        }
        return { ...c, submissionCount };
      })
    );

    // Counts by status
    const statusCounts = await prisma.challenge.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const counts: Record<string, number> = { total };
    for (const s of statusCounts) {
      counts[s.status] = s._count.id;
    }

    return NextResponse.json({
      challenges: challengesWithCounts,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      counts,
    });
  } catch (error) {
    console.error("Failed to fetch challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
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
    const {
      title,
      description,
      coverUrl,
      prizeDesc,
      submissionTag,
      startsAt,
      endsAt,
      status,
      rules,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const slug = slugify(title);

    const challenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        slug,
        description: description || null,
        coverUrl: coverUrl || null,
        prizeDesc: prizeDesc || null,
        submissionTag: submissionTag || slug,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        status: status || "draft",
      },
    });

    // Ensure the submission tag exists
    const tagSlug = submissionTag || slug;
    await prisma.tag.upsert({
      where: { slug: tagSlug },
      update: {},
      create: {
        name: `challenge-${slug}`,
        slug: tagSlug,
      },
    });

    const adminUserId = (session.user as any).id;
    await logAuditEvent({
      userId: adminUserId,
      action: "challenge.create",
      targetType: "challenge",
      targetId: challenge.id,
      details: { title: challenge.title, status: challenge.status },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create challenge:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A challenge with that slug already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
