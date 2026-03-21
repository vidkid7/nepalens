import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pixelstock/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === key);
    });
  });
}

// DELETE /api/internal/profile/delete — Delete (anonymize) account
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { confirmPassword } = await request.json();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, oauthProvider: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // For credential users, verify password
  if (user.passwordHash) {
    if (!confirmPassword) {
      return NextResponse.json(
        { error: "Password confirmation is required" },
        { status: 400 }
      );
    }
    const valid = await verifyPassword(confirmPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Password is incorrect" }, { status: 403 });
    }
  }

  // Anonymize user data (soft delete)
  const anonId = crypto.randomBytes(8).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${anonId}@deleted.local`,
      username: `deleted_${anonId}`,
      displayName: "Deleted User",
      bio: null,
      location: null,
      websiteUrl: null,
      avatarUrl: null,
      coverUrl: null,
      passwordHash: null,
      oauthProvider: null,
      oauthUid: null,
      paypalEmail: null,
      isBanned: true,
    },
  });

  return NextResponse.json({ message: "Account deleted successfully" });
}
