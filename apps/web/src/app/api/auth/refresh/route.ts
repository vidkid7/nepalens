import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/tokens";
import { prisma } from "@nepalens/database";
import { encode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/refresh
 * 
 * Manual refresh endpoint for API consumers who manage their own token lifecycle.
 * Accepts a refresh token and returns a new access token + refresh token pair.
 * 
 * The primary refresh flow happens automatically via NextAuth's JWT callback,
 * but this endpoint enables:
 * - Mobile apps
 * - Third-party integrations
 * - Manual token rotation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const ua = req.headers.get("user-agent") || undefined;

    const result = await rotateRefreshToken(refreshToken, {
      ipAddress: ip,
      userAgent: ua,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isAdmin: true,
        isContributor: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Encode a new JWT access token
    const accessToken = await encode({
      token: {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        isContributor: user.isContributor,
        email: user.email,
        name: user.displayName || user.username,
        picture: user.avatarUrl,
        accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 min
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 15 * 60,
    });

    return NextResponse.json({
      accessToken,
      refreshToken: result.rawToken,
      expiresIn: 15 * 60,
      tokenType: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
        isContributor: user.isContributor,
      },
    });
  } catch (error) {
    console.error("[refresh] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
