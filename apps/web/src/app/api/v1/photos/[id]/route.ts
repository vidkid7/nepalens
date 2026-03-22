import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { validateApiKey, apiErrorResponse } from "@/lib/apiAuth";

// GET /api/v1/photos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { allowed, headers } = await validateApiKey(request);
  if (!allowed) return apiErrorResponse(401, "Invalid or missing API key");

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!photo || photo.status !== "approved") {
    return apiErrorResponse(404, "Photo not found");
  }

  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  return NextResponse.json(
    {
      id: photo.id,
      width: photo.width,
      height: photo.height,
      url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/photo/${photo.slug}-${photo.id}`,
      photographer: photo.user?.displayName || photo.user?.username || "Unknown",
      photographer_url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/profile/${photo.user?.username}`,
      photographer_id: photo.userId,
      avg_color: photo.dominantColor || "#cccccc",
      liked: false,
      alt: photo.altText || "",
      src: {
        original: photo.originalUrl,
        large2x: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/large2x.jpg` : photo.originalUrl,
        large: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/large.jpg` : photo.originalUrl,
        medium: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/medium.jpg` : photo.originalUrl,
        small: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/small.jpg` : photo.originalUrl,
        portrait: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/portrait.jpg` : photo.originalUrl,
        landscape: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/landscape.jpg` : photo.originalUrl,
        tiny: photo.cdnKey ? `${cdnBase}/photos/${photo.id}/tiny.jpg` : photo.originalUrl,
      },
    },
    { headers }
  );
}
