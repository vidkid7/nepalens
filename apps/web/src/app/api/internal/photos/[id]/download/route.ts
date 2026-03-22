import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";

const FREE_PREMIUM_PHOTO_LIMIT = 5;

/**
 * Count how many premium photo downloads a user has made this month.
 */
async function getPremiumPhotoDownloadsThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get IDs of premium photos
  const downloads = await prisma.download.findMany({
    where: {
      userId,
      mediaType: "photo",
      createdAt: { gte: monthStart },
    },
    select: { mediaId: true },
  });

  if (downloads.length === 0) return 0;

  const mediaIds = [...new Set(downloads.map((d) => d.mediaId))];

  const premiumCount = await prisma.photo.count({
    where: {
      id: { in: mediaIds },
      isPremium: true,
    },
  });

  return premiumCount;
}

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

  // --- Access control logic ---
  // Free images: anyone can download (no login needed)
  // Premium images:
  //   - Pro users: unlimited
  //   - Free users (logged in): 5 premium photos/month
  //   - Anonymous: must log in first

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
      const premiumCount = await getPremiumPhotoDownloadsThisMonth(userId);
      if (premiumCount >= FREE_PREMIUM_PHOTO_LIMIT) {
        return NextResponse.json(
          {
            error: "Monthly limit reached",
            quotaExceeded: true,
            premiumDownloadsUsed: premiumCount,
            premiumDownloadsLimit: FREE_PREMIUM_PHOTO_LIMIT,
            message: `You've used all ${FREE_PREMIUM_PHOTO_LIMIT} free premium downloads this month. Upgrade to Pro for unlimited access.`,
          },
          { status: 403 }
        );
      }
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

  // Build download URL — point to the file endpoint which resizes on-the-fly
  const downloadUrl = `/api/internal/photos/${id}/file?size=${encodeURIComponent(sizeVariant)}`;

  // Return remaining downloads info for free users downloading premium
  const response: Record<string, unknown> = { url: downloadUrl };

  if (photo.isPremium && !isPro && userId) {
    const usedAfter = (await getPremiumPhotoDownloadsThisMonth(userId));
    response.remainingDownloads = Math.max(0, FREE_PREMIUM_PHOTO_LIMIT - usedAfter);
    response.premiumDownloadsUsed = usedAfter;
    response.premiumDownloadsLimit = FREE_PREMIUM_PHOTO_LIMIT;
  }

  return NextResponse.json(response);
  } catch (err: any) {
    console.error("Download API error:", err);
    return NextResponse.json(
      { error: err.message || "Download failed" },
      { status: 500 }
    );
  }
}
