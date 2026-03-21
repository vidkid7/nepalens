import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/photos/[id]/download — Track download and return URL
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || null;
  const body = await request.json().catch(() => ({}));
  const sizeVariant = body.size || "original";

  const photo = await prisma.photo.findUnique({ where: { id: params.id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Track download
  await prisma.download.create({
    data: {
      mediaType: "photo",
      mediaId: params.id,
      userId,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent")?.substring(0, 500),
      source: "website",
      sizeVariant,
    },
  });

  // Increment download count
  await prisma.photo.update({
    where: { id: params.id },
    data: { downloadsCount: { increment: 1 } },
  });

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  let downloadUrl: string;

  if (photo.cdnKey) {
    const sizeMap: Record<string, string> = {
      original: `${cdnBase}/photos/${photo.id}/original.jpg`,
      large: `${cdnBase}/photos/${photo.id}/large.jpg`,
      medium: `${cdnBase}/photos/${photo.id}/medium.jpg`,
      small: `${cdnBase}/photos/${photo.id}/small.jpg`,
    };
    downloadUrl = sizeMap[sizeVariant] || sizeMap.original;
  } else {
    downloadUrl = photo.originalUrl;
  }

  return NextResponse.json({ url: downloadUrl });
}
