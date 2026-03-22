import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("per_page") || "20", 10))
    );

    const where: any = {
      status: { notIn: ["draft"] },
    };

    if (status === "active") {
      where.status = "active";
    } else if (status === "upcoming") {
      where.status = "upcoming";
    } else if (status === "past") {
      where.status = { in: ["completed", "archived", "ended"] };
    } else if (status !== "all") {
      where.status = status;
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

    return NextResponse.json({
      challenges: challengesWithCounts,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error("Failed to fetch challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}
