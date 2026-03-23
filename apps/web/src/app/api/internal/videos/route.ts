import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@pixelstock/database";

// POST /api/internal/videos — Create video record after S3 upload
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawUserId = (session.user as any).id;

  // Validate user exists in DB to prevent FK constraint violations
  const user = await prisma.user.findUnique({
    where: { id: rawUserId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found. Please sign out and sign in again." }, { status: 401 });
  }
  const userId = user.id;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { s3Key, cloudinaryUrl, title, description, altText, tags, isPremium, width, height, duration } = body;

  if (!s3Key || !title) {
    return NextResponse.json({ error: "s3Key and title are required" }, { status: 400 });
  }

  try {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Use cloudinaryUrl if provided, otherwise fall back to CDN_URL + s3Key
    const originalUrl = cloudinaryUrl || `${process.env.NEXT_PUBLIC_CDN_URL || ""}/${s3Key}`;

    // Auto-generate thumbnail from Cloudinary video URL
    let thumbnailUrl: string | null = null;
    if (cloudinaryUrl && cloudinaryUrl.includes("res.cloudinary.com")) {
      // Transform video URL to get a frame as JPG thumbnail
      // e.g. .../video/upload/v123/path.mp4 → .../video/upload/so_0,w_640,c_limit,f_jpg/v123/path.mp4.jpg
      thumbnailUrl = cloudinaryUrl
        .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
        .replace(/\.[^.]+$/, ".jpg");
    }

    const w = typeof width === "number" && width > 0 ? width : 1920;
    const h = typeof height === "number" && height > 0 ? height : 1080;
    const orientation = w > h ? "landscape" : w < h ? "portrait" : "square";
    const durationSeconds = typeof duration === "number" && duration > 0 ? Math.round(duration) : null;

    const video = await prisma.video.create({
      data: {
        userId,
        slug,
        altText: altText || title || null,
        description: description || null,
        width: w,
        height: h,
        durationSeconds,
        orientation,
        status: "approved",
        isPremium: isPremium === true,
        thumbnailUrl,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Create a single VideoFile record for the original upload
    await prisma.videoFile.create({
      data: {
        videoId: video.id,
        quality: "original",
        fileType: "mp4",
        width: w,
        height: h,
        cdnUrl: originalUrl,
      },
    });

    // Create HD variant pointing to same file (until transcoding worker runs)
    if (w >= 1280) {
      await prisma.videoFile.create({
        data: {
          videoId: video.id,
          quality: "hd",
          fileType: "mp4",
          width: Math.min(w, 1280),
          height: Math.round((Math.min(w, 1280) / w) * h),
          cdnUrl: originalUrl,
        },
      });
    }

    // Create SD variant pointing to same file (until transcoding worker runs)
    await prisma.videoFile.create({
      data: {
        videoId: video.id,
        quality: "sd",
        fileType: "mp4",
        width: Math.min(w, 960),
        height: Math.round((Math.min(w, 960) / w) * h),
        cdnUrl: originalUrl,
      },
    });

    // Upsert tags and create VideoTag relations
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const normalized = String(tagName).trim().toLowerCase();
        if (!normalized) continue;

        const tagSlug = normalized
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        const tag = await prisma.tag.upsert({
          where: { name: normalized },
          update: {},
          create: { name: normalized, slug: tagSlug },
        });

        await prisma.videoTag.create({
          data: { videoId: video.id, tagId: tag.id },
        }).catch(() => {}); // ignore duplicate
      }
    }

    // Re-fetch with all relations
    const result = await prisma.video.findUnique({
      where: { id: video.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        files: { orderBy: { width: "asc" } },
        tags: { include: { tag: true } },
      },
    });

    const safeResult = JSON.parse(
      JSON.stringify(result, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );

    return NextResponse.json({ video: safeResult }, { status: 201 });
  } catch (err: any) {
    console.error("Video create error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create video" },
      { status: 500 }
    );
  }
}