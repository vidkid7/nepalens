import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/internal/challenges/[slug]/submit — Submit a photo to a challenge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { slug } = await params;

  try {
    const body = await request.json();
    const { photoId } = body;

    if (!photoId) {
      return NextResponse.json(
        { error: "photoId is required" },
        { status: 400 }
      );
    }

    // Find the challenge
    const challenge = await prisma.challenge.findUnique({
      where: { slug },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.status !== "active") {
      return NextResponse.json(
        { error: "This challenge is not currently accepting submissions" },
        { status: 400 }
      );
    }

    // Verify photo belongs to user and is approved
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { tags: { include: { tag: true } } },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      );
    }

    if (photo.userId !== userId) {
      return NextResponse.json(
        { error: "You can only submit your own photos" },
        { status: 403 }
      );
    }

    if (photo.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved photos can be submitted to challenges" },
        { status: 400 }
      );
    }

    // Check if already submitted (photo already has the challenge tag)
    const submissionTag = challenge.submissionTag || challenge.slug;
    const alreadyTagged = photo.tags.some(
      (pt) => pt.tag.slug === submissionTag || pt.tag.name === submissionTag
    );

    if (alreadyTagged) {
      return NextResponse.json(
        { error: "This photo has already been submitted to this challenge" },
        { status: 409 }
      );
    }

    // Find or create the challenge tag
    let tag = await prisma.tag.findUnique({
      where: { slug: submissionTag },
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: submissionTag,
          slug: submissionTag,
        },
      });
    }

    // Link photo to challenge via tag
    await prisma.photoTag.create({
      data: {
        photoId: photo.id,
        tagId: tag.id,
      },
    });

    // Increment tag photo count
    await prisma.tag.update({
      where: { id: tag.id },
      data: { photosCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: "Photo submitted to challenge successfully",
    });
  } catch (error: any) {
    console.error("Failed to submit to challenge:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "This photo has already been submitted to this challenge" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit photo" },
      { status: 500 }
    );
  }
}

// GET /api/internal/challenges/[slug]/submit — Get user's submissions for this challenge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { slug } = await params;

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { slug },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    const submissionTag = challenge.submissionTag || challenge.slug;

    const submissions = await prisma.photo.findMany({
      where: {
        userId,
        tags: {
          some: {
            tag: { slug: submissionTag },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        altText: true,
        originalUrl: true,
        cdnKey: true,
        width: true,
        height: true,
        dominantColor: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
