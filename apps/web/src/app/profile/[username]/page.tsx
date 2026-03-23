import { prisma } from "@pixelstock/database";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProfileContent from "./ProfileContent";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { title: "User Not Found" };

  return {
    title: `${user.displayName || user.username} - Photographer`,
    description: user.bio || `View photos and videos by ${user.displayName || user.username} on PixelStock.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      photos: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: {
        select: {
          photos: { where: { status: "approved" } },
          videos: { where: { status: "approved" } },
          followers: true,
          following: true,
          collections: { where: { isPrivate: false } },
        },
      },
    },
  });

  if (!user) notFound();

  const [totalViews, totalDownloads, topPhoto] = await Promise.all([
    prisma.photo.aggregate({
      where: { userId: user.id, status: "approved" },
      _sum: { viewsCount: true },
    }),
    prisma.photo.aggregate({
      where: { userId: user.id, status: "approved" },
      _sum: { downloadsCount: true },
    }),
    // Get the user's most popular photo for potential cover
    prisma.photo.findFirst({
      where: { userId: user.id, status: "approved" },
      orderBy: { viewsCount: "desc" },
      select: { id: true, cdnKey: true, originalUrl: true, isPremium: true },
    }),
  ]);

  const topPhotoUrl = topPhoto
    ? topPhoto.isPremium
      ? `/api/internal/photos/${topPhoto.id}/preview?w=1200`
      : topPhoto.cdnKey
        ? `${cdnBase}/${topPhoto.cdnKey}`
        : topPhoto.originalUrl
    : null;

  return (
    <ProfileContent
      user={{
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        location: user.location,
        websiteUrl: user.websiteUrl,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl || topPhotoUrl,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isVerified: user.isVerified,
      }}
      stats={{
        photos: user._count.photos,
        videos: user._count.videos,
        collections: user._count.collections,
        totalViews: Number(totalViews._sum.viewsCount || 0),
        totalDownloads: Number(totalDownloads._sum.downloadsCount || 0),
        followers: user._count.followers,
        following: user._count.following,
      }}
      initialPhotos={user.photos.map((p) => ({
        id: p.id,
        slug: p.slug,
        alt: p.altText,
        width: p.width,
        height: p.height,
        isPremium: p.isPremium || false,
        src: {
          large: p.isPremium
            ? `/api/internal/photos/${p.id}/preview?w=1200`
            : p.cdnKey
              ? `${cdnBase}/${p.cdnKey}`
              : p.originalUrl,
        },
        photographer: user.displayName || user.username,
        photographer_url: `/profile/${user.username}`,
        avg_color: p.dominantColor,
      }))}
    />
  );
}
