import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";

// POST /api/internal/videos/[id]/download — Track download and return URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const rawUserId = (session?.user as any)?.id || null;
  const body = await request.json().catch(() => ({}));
  const quality = body.quality || "hd";

  // Validate user exists to prevent FK constraint errors
  let userId: string | null = null;
  if (rawUserId) {
    const userExists = await prisma.user.findUnique({ where: { id: rawUserId }, select: { id: true } });
    userId = userExists ? rawUserId : null;
  }

  const video = await prisma.video.findUnique({
    where: { id },
    include: { files: true },
  });

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPro = await isProSubscriber(userId);

  // Premium videos: Pro users only (any quality)
  if (video.isPremium) {
    if (!userId) {
      return NextResponse.json(
        { error: "Login required", requiresLogin: true, message: "Sign in to download premium videos." },
        { status: 401 }
      );
    }
    if (!isPro) {
      return NextResponse.json(
        { error: "Pro required", upgradeRequired: true, message: "Premium videos are available only for Pro subscribers." },
        { status: 403 }
      );
    }
  }

  // Original / FHD quality: Pro users only (even for free videos)
  const proOnlyQualities = ["original", "fhd", "4k", "uhd"];
  if (proOnlyQualities.includes(quality)) {
    if (!userId) {
      return NextResponse.json(
        { error: "Login required", requiresLogin: true, message: "Sign in to download high-quality videos." },
        { status: 401 }
      );
    }
    if (!isPro) {
      return NextResponse.json(
        { error: "Pro required", upgradeRequired: true, message: `${quality.toUpperCase()} quality downloads require a Pro subscription.` },
        { status: 403 }
      );
    }
  }

  // Track download (non-blocking)
  try {
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
  } catch (trackErr) {
    console.error("Video download tracking failed (non-blocking):", trackErr);
  }

  await prisma.video.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  }).catch(() => {});

  const file = video.files.find((f) => f.quality === quality) || video.files[0];
  if (!file) {
    return NextResponse.json({ error: "No video file available" }, { status: 404 });
  }
  const downloadUrl = file.cdnUrl || "";

  return NextResponse.json({ url: downloadUrl, quality: file.quality });
  } catch (err: any) {
    console.error("Video download API error:", err);
    return NextResponse.json({ error: err.message || "Download failed" }, { status: 500 });
  }
}
