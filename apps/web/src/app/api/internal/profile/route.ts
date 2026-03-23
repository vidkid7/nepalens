import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/internal/profile — Return current user's full profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
      location: true,
      websiteUrl: true,
      avatarUrl: true,
      coverUrl: true,
      isVerified: true,
      isContributor: true,
      isAdmin: true,
      oauthProvider: true,
      followersCount: true,
      followingCount: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const MAX_BIO_LENGTH = 500;
const MAX_DISPLAY_NAME_LENGTH = 100;
const MAX_LOCATION_LENGTH = 100;

// PATCH /api/internal/profile — Update profile fields
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await request.json();
  const { displayName, bio, location, websiteUrl, avatarUrl } = body;

  // Validate displayName
  if (displayName !== undefined) {
    if (typeof displayName !== "string" || displayName.trim().length > MAX_DISPLAY_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
  }

  // Validate bio length
  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.length > MAX_BIO_LENGTH) {
      return NextResponse.json(
        { error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
  }

  // Validate location
  if (location !== undefined) {
    if (typeof location !== "string" || location.trim().length > MAX_LOCATION_LENGTH) {
      return NextResponse.json(
        { error: `Location must be ${MAX_LOCATION_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }
  }

  // Validate websiteUrl
  if (websiteUrl !== undefined && websiteUrl !== "") {
    if (typeof websiteUrl !== "string" || !isValidUrl(websiteUrl)) {
      return NextResponse.json(
        { error: "Website must be a valid URL (https://...)" },
        { status: 400 }
      );
    }
  }

  // Validate avatarUrl
  if (avatarUrl !== undefined && avatarUrl !== "") {
    if (typeof avatarUrl !== "string" || !isValidUrl(avatarUrl)) {
      return NextResponse.json(
        { error: "Avatar URL must be a valid URL (https://...)" },
        { status: 400 }
      );
    }
  }

  const data: Record<string, any> = {};
  if (displayName !== undefined) data.displayName = displayName.trim() || null;
  if (bio !== undefined) data.bio = bio.trim() || null;
  if (location !== undefined) data.location = location.trim() || null;
  if (websiteUrl !== undefined) data.websiteUrl = websiteUrl.trim() || null;
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl.trim() || null;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      bio: true,
      location: true,
      websiteUrl: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ user });
}
