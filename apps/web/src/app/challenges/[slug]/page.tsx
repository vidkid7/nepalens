import { prisma } from "@nepalens/database";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ChallengeDetailClient from "./ChallengeDetailClient";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await prisma.challenge.findUnique({ where: { slug } });
  if (!challenge) return { title: "Challenge Not Found \u2014 NepaLens" };
  return {
    title: `${challenge.title} \u2014 NepaLens Challenges`,
    description: challenge.description?.slice(0, 160) || "Join this photography challenge on NepaLens.",
  };
}

export default async function ChallengeDetailPage({ params }: Props) {
  const { slug } = await params;

  let challenge;
  try {
    challenge = await prisma.challenge.findUnique({ where: { slug } });
  } catch {
    challenge = null;
  }

  if (!challenge) notFound();

  // Fetch submissions via the challenge's submission tag
  let submissions: any[] = [];
  let submissionCount = 0;
  const submissionTag = challenge.submissionTag || challenge.slug;

  if (submissionTag) {
    try {
      const [photos, tag] = await Promise.all([
        prisma.photo.findMany({
          where: {
            status: "approved",
            tags: { some: { tag: { slug: submissionTag } } },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.tag.findUnique({
          where: { slug: submissionTag },
          select: { photosCount: true },
        }),
      ]);
      submissions = photos;
      submissionCount = tag?.photosCount ?? photos.length;
    } catch {
      submissions = [];
    }
  }

  // Fetch winner data if challenge is completed and has a winnerId
  let winner = null;
  if (
    challenge.winnerId &&
    (challenge.status === "completed" || challenge.status === "ended")
  ) {
    try {
      winner = await prisma.photo.findUnique({
        where: { id: challenge.winnerId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });
    } catch {
      winner = null;
    }
  }

  // Serialize for client component
  const challengeData = {
    id: challenge.id,
    title: challenge.title,
    slug: challenge.slug,
    description: challenge.description,
    rules: (challenge as any).rules || null,
    coverUrl: challenge.coverUrl,
    prizeDesc: challenge.prizeDesc,
    submissionTag: challenge.submissionTag,
    startsAt: challenge.startsAt?.toISOString() || null,
    endsAt: challenge.endsAt?.toISOString() || null,
    status: challenge.status,
    winnerId: challenge.winnerId,
    submissionCount,
    submissions: submissions.map((s: any) => ({
      id: s.id,
      slug: s.slug,
      altText: s.altText,
      originalUrl: s.originalUrl,
      thumbnailUrl: s.originalUrl && s.originalUrl.startsWith("http")
        ? s.originalUrl
        : s.cdnKey
          ? `${process.env.NEXT_PUBLIC_CDN_URL || ""}/${s.cdnKey}`
          : s.originalUrl,
      width: s.width,
      height: s.height,
      dominantColor: s.dominantColor,
      likesCount: Number(s.likesCount || 0),
      viewsCount: Number(s.viewsCount || 0),
      user: s.user,
    })),
    winner: winner
      ? {
          id: winner.id,
          slug: winner.slug,
          altText: winner.altText,
          originalUrl: winner.originalUrl,
          thumbnailUrl: winner.originalUrl && winner.originalUrl.startsWith("http")
            ? winner.originalUrl
            : (winner as any).cdnKey
              ? `${process.env.NEXT_PUBLIC_CDN_URL || ""}/${(winner as any).cdnKey}`
              : winner.originalUrl,
          width: winner.width,
          height: winner.height,
          dominantColor: winner.dominantColor,
          user: (winner as any).user,
        }
      : null,
  };

  return <ChallengeDetailClient challenge={challengeData} />;
}
