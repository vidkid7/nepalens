import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

/**
 * GET /api/internal/photos/[id]/preview?w=800
 *
 * Serves premium images through an auth-checking proxy.
 * - Pro users: serves clean image at requested width
 * - Non-Pro users: serves image with watermark baked into pixels
 * - Free images: serves clean image (no watermark needed)
 *
 * This prevents free users from accessing unwatermarked premium images
 * by inspecting network requests or right-clicking to save.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const width = parseInt(request.nextUrl.searchParams.get("w") || "1200");
    const maxW = Math.min(Math.max(width, 200), 1920);

    const photo = await prisma.photo.findUnique({
      where: { id },
      select: { id: true, originalUrl: true, cdnKey: true, width: true, height: true, isPremium: true },
    });

    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check auth
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;
    const isPro = await isProSubscriber(userId);

    // For free images and Pro users on premium images — serve clean
    const needsWatermark = photo.isPremium && !isPro;

    // Fetch original image bytes
    let imageBuffer: Buffer;
    if (photo.originalUrl && photo.originalUrl.startsWith("http")) {
      // Cloudinary or external URL — fetch directly
      const res = await fetch(photo.originalUrl);
      if (!res.ok) {
        return NextResponse.json({ error: "Source unavailable" }, { status: 502 });
      }
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else if (photo.cdnKey) {
      const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
      const fileUrl = `${cdnBase}/${photo.cdnKey}`;
      const res = await fetch(fileUrl);
      if (!res.ok) {
        return NextResponse.json({ error: "Source unavailable" }, { status: 502 });
      }
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else if (photo.originalUrl) {
      const localPath = path.join(process.cwd(), "public", photo.originalUrl);
      try {
        imageBuffer = Buffer.from(await fs.readFile(localPath));
      } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "No source" }, { status: 404 });
    }

    let outputBuffer: Buffer;

    if (needsWatermark) {
      // Resize first, then get dimensions for watermark
      const resized = await sharp(imageBuffer)
        .resize({ width: maxW, withoutEnlargement: true })
        .toBuffer();

      const meta = await sharp(resized).metadata();
      const imgW = meta.width || maxW;
      const imgH = meta.height || maxW;

      const watermarkSvg = buildWatermarkSvg(imgW, imgH);

      outputBuffer = await sharp(resized)
        .composite([{ input: Buffer.from(watermarkSvg), gravity: "center" }])
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();
    } else {
      outputBuffer = await sharp(imageBuffer)
        .resize({ width: maxW, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    }

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(outputBuffer.length),
        "Cache-Control": isPro
          ? "private, max-age=3600"
          : "private, max-age=600, no-transform",
      },
    });
  } catch (err: any) {
    console.error("Preview serve error:", err);
    return NextResponse.json({ error: "Failed to serve preview" }, { status: 500 });
  }
}

/** Generate SVG watermark with repeating diagonal "NepaLens" text */
function buildWatermarkSvg(width: number, height: number): string {
  const fontSize = Math.max(Math.round(width / 14), 24);
  const spacing = fontSize * 3;
  const rows = Math.ceil(height / spacing) + 2;
  const cols = Math.ceil(width / spacing) + 2;

  let texts = "";
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * spacing + (r % 2 === 0 ? 0 : spacing / 2);
      const y = r * spacing;
      texts += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" fill-opacity="0.25" transform="rotate(-30 ${x} ${y})">NepaLens</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${texts}</svg>`;
}
