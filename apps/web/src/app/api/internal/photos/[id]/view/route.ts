import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";

// POST /api/internal/photos/[id]/view — Track view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Fire and forget — don't block response
  prisma.photo
    .update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
