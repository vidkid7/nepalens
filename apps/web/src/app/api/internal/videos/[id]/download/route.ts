import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/videos/[id]/download — Track download and return URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const body = await request.json().catch(() => ({}));
  const quality = body.quality || "hd";

  const video = await prisma.video.findUnique({
    where: { id },
    include: { files: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.download.create({
    data: {
      mediaType: "video",
      mediaId: id,
      userId,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent")?.substring(0, 500),
      source: "website",
      sizeVariant: quality,
    },
  });

  await prisma.video.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  });

  const file = video.files.find((f) => f.quality === quality) || video.files[0];
  if (!file) {
    return NextResponse.json({ error: "No video file available" }, { status: 404 });
  }
  const downloadUrl = file.cdnUrl || "";

  return NextResponse.json({ url: downloadUrl, quality: file.quality });
}
