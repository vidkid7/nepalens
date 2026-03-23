import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";

/**
 * GET /api/internal/videos/[id]/file?quality=sd|hd|fhd|original
 *
 * Streams the video file with proper Content-Disposition header
 * so the browser triggers a download instead of playing in a new tab.
 *
 * Access control mirrors the download endpoint:
 *  - Premium videos: Pro users only
 *  - Original/FHD/4K/UHD quality: Pro users only
 *  - Free videos SD/HD: anyone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quality = request.nextUrl.searchParams.get("quality") || "hd";

    const video = await prisma.video.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // --- Access control ---
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;
    const isPro = await isProSubscriber(userId);

    if (video.isPremium && !isPro) {
      return NextResponse.json(
        { error: "Premium videos require a Pro subscription." },
        { status: 403 }
      );
    }

    const proOnlyQualities = ["original", "fhd", "4k", "uhd"];
    if (proOnlyQualities.includes(quality) && !isPro) {
      return NextResponse.json(
        { error: `${quality.toUpperCase()} quality requires a Pro subscription.` },
        { status: 403 }
      );
    }

    // --- Find the matching file ---
    const file = video.files.find((f) => f.quality === quality) || video.files[0];
    if (!file || !file.cdnUrl) {
      return NextResponse.json({ error: "No video file available" }, { status: 404 });
    }

    // --- Fetch the video from CDN and stream it back with download headers ---
    const upstream = await fetch(file.cdnUrl);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Failed to fetch video from storage (${upstream.status})` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "video/mp4";
    const contentLength = upstream.headers.get("content-length");
    const slug = video.slug || video.id;
    const filename = `nepalens-${slug}-${quality}.mp4`;

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    };
    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    // Stream the response body through
    return new NextResponse(upstream.body as any, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("Video file serve error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to serve video file" },
      { status: 500 }
    );
  }
}
