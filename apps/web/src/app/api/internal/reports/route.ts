import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const VALID_REASONS = [
  "copyright",
  "abuse",
  "nudity",
  "spam",
  "impersonation",
  "illegal",
  "other",
];

// POST /api/internal/reports — Create a content report
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { mediaType, mediaId, reason, description } = body;

  if (!mediaType || !mediaId || !reason) {
    return NextResponse.json(
      { error: "mediaType, mediaId, and reason are required" },
      { status: 400 }
    );
  }

  if (!["photo", "video"].includes(mediaType)) {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  // Check for duplicate report
  const existing = await prisma.report.findFirst({
    where: { reporterId: userId, mediaType, mediaId, status: "pending" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already reported this content" },
      { status: 409 }
    );
  }

  const report = await prisma.report.create({
    data: {
      reporterId: userId,
      mediaType,
      mediaId,
      reason,
      description: description?.substring(0, 2000) || null,
    },
  });

  return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
}
