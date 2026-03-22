import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";

// POST /api/internal/videos/[id]/view — Track view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  prisma.video
    .update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
