import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";
import { invalidatePhotoDetail } from "@/lib/cache";

// Premium images are exclusively available to Pro subscribers — no free-tier quota.

// POST /api/internal/photos/[id]/download — Track download and return URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const rawUserId = (session?.user as any)?.id || null;
  const body = await request.json().catch(() => ({}));
  const sizeVariant = body.size || "original";

  // Validate the userId actually exists in DB to avoid FK constraint violations
  let userId: string | null = null;
  if (rawUserId) {
    const userExists = await prisma.user.findUnique({
      where: { id: rawUserId },
      select: { id: true },
    });
    userId = userExists ? rawUserId : null;
  }

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isPro = await isProSubscriber(userId);

  // --- Original quality is Pro-only for ALL images ---
  if (sizeVariant === "original" && !isPro) {
    return NextResponse.json(
      {
        error: "Pro required",
        upgradeRequired: true,
        message: "Original quality downloads are available for Pro subscribers only. Upgrade to Pro for full resolution access.",
      },
      { status: 403 }
    );
  }

  // --- Access control logic ---
  // Free images: anyone can download (no login needed)
  // Premium images: Pro users ONLY — no free-tier downloads allowed

  if (photo.isPremium) {
    if (!userId) {
      return NextResponse.json(
        {
          error: "Login required",
          requiresLogin: true,
          message: "Sign in to download premium photos.",
        },
        { status: 401 }
      );
    }

    if (!isPro) {
      return NextResponse.json(
        {
          error: "Pro required",
          upgradeRequired: true,
          message: "Premium photos are available exclusively for Pro subscribers. Upgrade to Pro for unlimited premium downloads.",
        },
        { status: 403 }
      );
    }
  }

  // Track download — don't let tracking failures block the actual download
  try {
    await prisma.download.create({
      data: {
        mediaType: "photo",
        mediaId: id,
        userId,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent")?.substring(0, 500),
        source: "website",
        sizeVariant,
      },
    });
  } catch (trackErr) {
    console.error("Download tracking failed (non-blocking):", trackErr);
  }

  // Increment download count
  await prisma.photo.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  }).catch(() => {});

  await invalidatePhotoDetail(id);

  // Build download URL — point to the file endpoint which resizes on-the-fly
  const downloadUrl = `/api/internal/photos/${id}/file?size=${encodeURIComponent(sizeVariant)}`;

  const response: Record<string, unknown> = { url: downloadUrl };

  return NextResponse.json(response);
  } catch (err: any) {
    console.error("Download API error:", err);
    return NextResponse.json(
      { error: err.message || "Download failed" },
      { status: 500 }
    );
  }
}
