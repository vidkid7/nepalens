import { prisma } from "@pixelstock/database";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProfileContent from "./ProfileContent";

interface ProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { title: "User Not Found" };

  return {
    title: `${user.displayName || user.username} - Photographer`,
    description: user.bio || `View photos and videos by ${user.displayName || user.username} on PixelStock.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const username = decodeURIComponent(params.username);

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
        },
      },
    },
  });

  if (!user) notFound();

  const totalViews = await prisma.photo.aggregate({
    where: { userId: user.id, status: "approved" },
    _sum: { viewsCount: true },
  });

  const totalDownloads = await prisma.photo.aggregate({
    where: { userId: user.id, status: "approved" },
    _sum: { downloadsCount: true },
  });

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
        coverUrl: user.coverUrl,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        isVerified: user.isVerified,
      }}
      stats={{
        photos: user._count.photos,
        videos: user._count.videos,
        totalViews: Number(totalViews._sum.viewsCount || 0),
        totalDownloads: Number(totalDownloads._sum.downloadsCount || 0),
      }}
      photos={user.photos.map((p) => ({
        id: p.id,
        slug: p.slug,
        alt: p.altText,
        width: p.width,
        height: p.height,
        src: { large: p.originalUrl },
        photographer: user.displayName || user.username,
        photographer_url: `/profile/${user.username}`,
        avg_color: p.dominantColor,
      }))}
    />
  );
}
