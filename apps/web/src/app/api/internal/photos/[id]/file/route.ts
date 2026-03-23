import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const SIZE_MAP: Record<string, number | null> = {
  original: null,
  large: 1920,
  medium: 1280,
  small: 640,
};

/**
 * GET /api/internal/photos/[id]/file?size=original|large|medium|small
 *
 * Serves the actual image binary, resized on-the-fly when a smaller
 * variant is requested. Works for both local stock images (public/)
 * and MinIO-uploaded images.
 *
 * Access control:
 *  - Premium images: Pro users only (all sizes)
 *  - Original size: Pro users only (all images)
 *  - Free images (non-original): anyone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const size = request.nextUrl.searchParams.get("size") || "original";
    const maxWidth = SIZE_MAP[size] ?? null;

    const photo = await prisma.photo.findUnique({
      where: { id },
      select: { id: true, originalUrl: true, cdnKey: true, width: true, height: true, isPremium: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // --- Access control ---
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;
    const isPro = await isProSubscriber(userId);

    // Premium images: Pro only (all sizes)
    if (photo.isPremium && !isPro) {
      return NextResponse.json(
        { error: "Premium photos are available only for Pro subscribers." },
        { status: 403 }
      );
    }

    // Original quality: Pro only (all images)
    if (size === "original" && !isPro) {
      return NextResponse.json(
        { error: "Original quality requires a Pro subscription." },
        { status: 403 }
      );
    }

    // --- Resolve the original image bytes ---
    let imageBuffer: Buffer;

    if (photo.originalUrl && photo.originalUrl.startsWith("http")) {
      // Cloudinary or external URL — fetch directly
      const res = await fetch(photo.originalUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch original (${res.status})` },
          { status: 502 }
        );
      }
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else if (photo.cdnKey) {
      // Legacy: MinIO/S3 path via CDN base
      const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
      const fileUrl = `${cdnBase}/${photo.cdnKey}`;
      const res = await fetch(fileUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch original from storage (${res.status})` },
          { status: 502 }
        );
      }
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else if (photo.originalUrl) {
      // Local file in public/ directory (seeded stock images)
      const localPath = path.join(process.cwd(), "public", photo.originalUrl);
      try {
        imageBuffer = Buffer.from(await fs.readFile(localPath));
      } catch {
        return NextResponse.json(
          { error: "Original file not found on disk" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json({ error: "No source file available" }, { status: 404 });
    }

    // --- Resize if needed ---
    let outputBuffer: Buffer;
    let outputWidth: number;
    let outputHeight: number;

    if (maxWidth !== null) {
      // Get metadata to check if resize is necessary
      const metadata = await sharp(imageBuffer).metadata();
      const origW = metadata.width || photo.width || 1920;

      if (origW > maxWidth) {
        const resized = sharp(imageBuffer)
          .resize({ width: maxWidth, withoutEnlargement: true })
          .jpeg({ quality: 85, mozjpeg: true });

        outputBuffer = await resized.toBuffer();
        const outMeta = await sharp(outputBuffer).metadata();
        outputWidth = outMeta.width || maxWidth;
        outputHeight = outMeta.height || 0;
      } else {
        // Image is already smaller than requested size — serve original
        outputBuffer = imageBuffer;
        outputWidth = metadata.width || 0;
        outputHeight = metadata.height || 0;
      }
    } else {
      // Original — serve as-is
      outputBuffer = imageBuffer;
    }

    // Determine content type
    const isJpeg =
      outputBuffer[0] === 0xff && outputBuffer[1] === 0xd8;
    const contentType = isJpeg ? "image/jpeg" : "image/png";

    const filename = `pixelstock-${photo.id}-${size}.jpg`;

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(outputBuffer.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: any) {
    console.error("File serve error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to serve file" },
      { status: 500 }
    );
  }
}
