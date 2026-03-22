import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
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
      select: { id: true, originalUrl: true, cdnKey: true, width: true, height: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // --- Resolve the original image bytes ---
    let imageBuffer: Buffer;

    if (photo.cdnKey) {
      // Uploaded photo stored in MinIO/S3
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
      if (photo.originalUrl.startsWith("http")) {
        // External URL
        const res = await fetch(photo.originalUrl);
        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to fetch original (${res.status})` },
            { status: 502 }
          );
        }
        imageBuffer = Buffer.from(await res.arrayBuffer());
      } else {
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
