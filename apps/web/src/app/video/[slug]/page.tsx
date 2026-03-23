import { Metadata } from "next";
import { prisma } from "@nepalens/database";
import { notFound } from "next/navigation";
import VideoDetailClient from "./VideoDetailClient";

interface VideoPageProps {
  params: Promise<{ slug: string }>;
}

async function getVideo(slug: string) {
  const parts = slug.split("-");
  const videoId = parts[parts.length - 1];

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            followersCount: true,
          },
        },
        files: {
          orderBy: { width: "asc" },
        },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, downloads: true } },
      },
    });
    return video;
  } catch {
    return null;
  }
}

async function getRelatedVideos(videoId: string, tags: string[]) {
  try {
    const related = await prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: "approved",
        tags: tags.length > 0 ? { some: { tag: { name: { in: tags } } } } : undefined,
      },
      take: 8,
      orderBy: { viewsCount: "desc" },
      include: {
        user: { select: { username: true, displayName: true } },
        files: { orderBy: { width: "asc" } },
      },
    });
    return related;
  } catch {
    return [];
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: bigint | null): string {
  if (!bytes) return "—";
  const mb = Number(bytes) / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  const parts = slug.split("-");
  const fallbackName = parts.slice(0, -1).join(" ");
  const title = video?.altText || video?.description || fallbackName || "Video";

  return {
    title: `${title} — Free Stock Video | NepaLens`,
    description: `Download this free video: ${title}. Free for personal and commercial use.`,
    openGraph: video?.thumbnailUrl
      ? {
          images: [{ url: video.thumbnailUrl, width: video.width, height: video.height }],
        }
      : undefined,
  };
}

export default async function VideoDetailPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = await getVideo(slug);
  const parts = slug.split("-");
  const videoId = parts[parts.length - 1];
  const fallbackTitle = parts.slice(0, -1).join(" ");

  const videoData = video
    ? {
        id: video.id,
        slug: video.slug,
        title: video.altText || video.description || fallbackTitle || "Untitled Video",
        description: video.description || null,
        width: video.width,
        height: video.height,
        duration: video.durationSeconds,
        durationFormatted: formatDuration(video.durationSeconds),
        fps: video.frameRate,
        isPremium: video.isPremium,
        photographerId: video.user.id,
        thumbnailUrl: (() => {
          if (video.thumbnailUrl) return video.thumbnailUrl;
          // Auto-generate from Cloudinary video URL
          const originalFile = video.files.find((f: any) => f.quality === "original") || video.files[0];
          if (originalFile?.cdnUrl?.includes("res.cloudinary.com")) {
            return originalFile.cdnUrl
              .replace("/video/upload/", "/video/upload/so_0,w_1280,c_limit,q_auto,f_jpg/")
              .replace(/\.[^.]+$/, ".jpg");
          }
          return `https://placehold.co/${video.width}x${video.height}/1a1a1a/ffffff?text=${encodeURIComponent(fallbackTitle || "Video")}`;
        })(),
        photographer: {
          username: video.user.username,
          displayName: video.user.displayName || video.user.username,
          avatarUrl: video.user.avatarUrl,
          bio: video.user.bio,
          followersCount: video.user.followersCount,
        },
        files: video.files.map((f) => ({
          id: f.id,
          quality: f.quality,
          width: f.width,
          height: f.height,
          fps: f.fps,
          fileSize: formatFileSize(f.fileSize),
          fileSizeRaw: f.fileSize ? Number(f.fileSize) : 0,
          url: f.cdnUrl,
        })),
        tags: video.tags.map((vt: any) => vt.tag.name),
        likes: video._count.likes,
        downloads: video._count.downloads,
        views: Number(video.viewsCount),
      }
    : {
        id: videoId,
        slug: videoId,
        title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1) || "Video",
        description: null,
        width: 1920,
        height: 1080,
        duration: null,
        durationFormatted: "—",
        fps: null,
        isPremium: false,
        thumbnailUrl: `https://placehold.co/1920x1080/1a1a1a/ffffff?text=${encodeURIComponent(fallbackTitle || "Video")}`,
        photographer: {
          username: "videographer",
          displayName: "Videographer",
          avatarUrl: null,
          bio: null,
          followersCount: 0,
        },
        files: [
          { id: "hd", quality: "hd", width: 1280, height: 720, fps: 30, fileSize: "~15 MB", fileSizeRaw: 0, url: "" },
          { id: "fhd", quality: "fhd", width: 1920, height: 1080, fps: 30, fileSize: "~35 MB", fileSizeRaw: 0, url: "" },
        ],
        tags: (fallbackTitle || "stock video").split(" ").filter(Boolean).map((w) => w.toLowerCase()),
        likes: 0,
        downloads: 0,
        views: 0,
      };

  const tagNames = video ? video.tags.map((vt: any) => vt.tag.name) : [];
  const relatedVideos = await getRelatedVideos(videoId, tagNames);

  const relatedData = relatedVideos.map((v: any) => {
    let thumb = v.thumbnailUrl;
    if (!thumb) {
      const origFile = v.files?.find((f: any) => f.quality === "original") || v.files?.[0];
      if (origFile?.cdnUrl?.includes("res.cloudinary.com")) {
        thumb = origFile.cdnUrl
          .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
          .replace(/\.[^.]+$/, ".jpg");
      } else {
        thumb = `https://placehold.co/640x360/1a1a1a/fff?text=Video`;
      }
    }
    return {
      id: v.id,
      slug: v.slug,
      title: v.altText || v.description || "Video",
      width: v.width,
      height: v.height,
      duration: v.durationSeconds,
      thumbnailUrl: thumb,
      photographer: v.user?.displayName || v.user?.username || "Unknown",
      photographerUrl: `/profile/${v.user?.username || "user"}`,
      previewUrl: v.files?.[0]?.cdnUrl || null,
    };
  });

  return <VideoDetailClient video={videoData} relatedVideos={relatedData} />;
}
