import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
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
  const isPremium = photo.isPremium || false;
  const rawUrl = photo.originalUrl && photo.originalUrl.startsWith("http")
    ? photo.originalUrl
    : photo.cdnKey ? `${cdnBase}/${photo.cdnKey}` : photo.originalUrl;
  const displayUrl = isPremium
    ? `/api/internal/photos/${photo.id}/preview?w=1200`
    : rawUrl;
  const smallUrl = isPremium
    ? `/api/internal/photos/${photo.id}/preview?w=640`
    : displayUrl;

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
      isPremium,
      src: {
        original: displayUrl,
        large2x: displayUrl,
        large: displayUrl,
        medium: displayUrl,
        small: smallUrl,
        portrait: displayUrl,
        landscape: displayUrl,
        tiny: smallUrl,
      },
    },
    { headers }
  );
}
