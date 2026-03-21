import { prisma } from "@pixelstock/database";
import { indexPhoto, indexVideo, deleteFromIndex, PHOTO_INDEX, VIDEO_INDEX } from "@pixelstock/search";
import type { SearchIndexJob } from "../index";

export async function processSearchIndex(job: { data: SearchIndexJob }): Promise<void> {
  const { mediaType, mediaId, action } = job.data;

  if (action === "delete") {
    const index = mediaType === "photo" ? PHOTO_INDEX : VIDEO_INDEX;
    await deleteFromIndex(index, mediaId);
    console.log(`Deleted from search index: ${mediaType}/${mediaId}`);
    return;
  }

  if (mediaType === "photo") {
    const photo = await prisma.photo.findUnique({
      where: { id: mediaId },
      include: {
        user: { select: { username: true, displayName: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!photo) return;

    const engagementScore =
      Number(photo.viewsCount) * 0.3 + Number(photo.downloadsCount) * 0.7;

    await indexPhoto({
      id: photo.id,
      altText: photo.altText,
      description: photo.description,
      tags: photo.tags.map((pt) => pt.tag.name).join(" "),
      photographer: photo.user?.displayName || photo.user?.username,
      colorBucket: photo.colorBucket,
      dominantColor: photo.dominantColor,
      orientation: photo.orientation,
      sizeTier: photo.sizeTier,
      megapixels: photo.megapixels,
      isFeatured: photo.isFeatured,
      isCurated: photo.isCurated,
      viewsCount: Number(photo.viewsCount),
      downloadsCount: Number(photo.downloadsCount),
      likesCount: photo.likesCount,
      engagementScore,
      createdAt: photo.createdAt.toISOString(),
      status: photo.status,
    });

    console.log(`Indexed photo: ${mediaId}`);
  } else if (mediaType === "video") {
    const video = await prisma.video.findUnique({
      where: { id: mediaId },
      include: {
        user: { select: { username: true, displayName: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!video) return;

    await indexVideo({
      id: video.id,
      altText: video.altText,
      description: video.description,
      tags: video.tags.map((vt) => vt.tag.name).join(" "),
      videographer: video.user?.displayName || video.user?.username,
      orientation: video.orientation,
      isFeatured: video.isFeatured,
      viewsCount: Number(video.viewsCount),
      downloadsCount: Number(video.downloadsCount),
      likesCount: video.likesCount,
      durationSeconds: video.durationSeconds,
      createdAt: video.createdAt.toISOString(),
      status: video.status,
    });

    console.log(`Indexed video: ${mediaId}`);
  }
}
