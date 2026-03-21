import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@pixelstock/database";
import { notFound } from "next/navigation";
import PhotoDetailClient from "./PhotoDetailClient";

interface PhotoPageProps {
  params: { slug: string };
}

async function getPhoto(slug: string) {
  const parts = slug.split("-");
  const photoId = parts[parts.length - 1];

  try {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true, avatarUrl: true,
            bio: true, followersCount: true,
          },
        },
        tags: { include: { tag: true } },
        _count: { select: { likes: true, downloads: true } },
      },
    });
    return photo;
  } catch {
    return null;
  }
}

async function getRelatedPhotos(photoId: string, tags: string[]) {
  try {
    const related = await prisma.photo.findMany({
      where: {
        id: { not: photoId },
        status: "approved",
        tags: tags.length > 0 ? { some: { tag: { name: { in: tags } } } } : undefined,
      },
      take: 12,
      orderBy: { viewsCount: "desc" },
      include: {
        user: { select: { username: true, displayName: true } },
      },
    });
    return related;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const photo = await getPhoto(params.slug);
  const title = photo?.altText || photo?.description || "Photo";

  return {
    title: `${title} | Free Stock Photo`,
    description: `Download this free photo. Free for personal and commercial use.`,
    openGraph: photo?.storageKey ? {
      images: [{ url: `${process.env.NEXT_PUBLIC_CDN_URL}/${photo.storageKey}`, width: photo.width, height: photo.height }],
    } : undefined,
  };
}

export default async function PhotoDetailPage({ params }: PhotoPageProps) {
  const photo = await getPhoto(params.slug);
  const parts = params.slug.split("-");
  const photoId = parts[parts.length - 1];
  const fallbackTitle = parts.slice(0, -1).join(" ");

  // If no DB photo, render with placeholder
  const photoData = photo
    ? {
        id: photo.id,
        title: photo.altText || photo.description || fallbackTitle || "Untitled",
        src: photo.storageKey
          ? `${process.env.NEXT_PUBLIC_CDN_URL}/${photo.storageKey}`
          : `https://placehold.co/1200x800/264653/ffffff?text=${encodeURIComponent(fallbackTitle || "Photo")}`,
        width: photo.width,
        height: photo.height,
        photographer: {
          username: photo.user.username,
          displayName: photo.user.displayName || photo.user.username,
          avatarUrl: photo.user.avatarUrl,
          bio: photo.user.bio,
          followersCount: photo.user.followersCount,
        },
        tags: photo.tags.map((pt: any) => pt.tag.name),
        likes: photo._count.likes,
        downloads: photo._count.downloads,
        views: photo.viewsCount,
        camera: photo.cameraMake && photo.cameraModel ? `${photo.cameraMake} ${photo.cameraModel}` : null,
        iso: photo.iso,
        focalLength: photo.focalLength,
        aperture: photo.aperture,
        shutterSpeed: photo.shutterSpeed,
        dominantColor: photo.dominantColor,
      }
    : {
        id: photoId,
        title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1) || "Photo",
        src: `https://placehold.co/1200x800/264653/ffffff?text=${encodeURIComponent(fallbackTitle || "Photo")}`,
        width: 1200,
        height: 800,
        photographer: { username: "photographer", displayName: "Photographer", avatarUrl: null, bio: null, followersCount: 0 },
        tags: ["nature", "landscape", "scenery", "outdoor"],
        likes: 0, downloads: 0, views: 0,
        camera: null, iso: null, focalLength: null, aperture: null, shutterSpeed: null,
        dominantColor: "#264653",
      };

  const tagNames = photo ? photo.tags.map((pt: any) => pt.tag.name) : [];
  const relatedPhotos = await getRelatedPhotos(photoId, tagNames);

  return <PhotoDetailClient photo={photoData} relatedPhotos={relatedPhotos} />;
}
