import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";

// POST /api/internal/photos/[id]/view — Track view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fire and forget — don't block response
  prisma.photo
    .update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
