import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const perPage = Math.min(
      Math.max(parseInt(searchParams.get("per_page") || "30", 10) || 30, 1),
      80
    );

    const downloads = await prisma.download.findMany({
      where: { userId, mediaType: "photo" },
      orderBy: { createdAt: "desc" },
      take: perPage,
      include: {
        photo: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
    });

    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";

    const photos = downloads
      .filter((d) => d.photo !== null)
      .map((d) => {
        const p = d.photo!;
        const isPremium = p.isPremium || false;
        const rawUrl = p.originalUrl && p.originalUrl.startsWith("http")
          ? p.originalUrl
          : p.cdnKey ? `${cdnBase}/${p.cdnKey}` : p.originalUrl;
        const src = isPremium
          ? `/api/internal/photos/${p.id}/preview?w=1200`
          : rawUrl;
        const photographer =
          p.user?.displayName || p.user?.username || "Unknown";
        const photographerUrl = p.user?.username
          ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/profile/${p.user.username}`
          : "";

        return {
          id: p.id,
          slug: p.slug,
          alt: p.altText || "",
          width: p.width,
          height: p.height,
          src: { large: src },
          photographer,
          photographer_url: photographerUrl,
          avg_color: p.avgColor || p.dominantColor || "#cccccc",
          isPremium,
        };
      });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("GET /api/internal/downloads error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
