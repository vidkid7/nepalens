import crypto from "crypto";
import { prisma } from "@nepalens/database";

// ─── Constants ───
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes (seconds)
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days (seconds)
const REFRESH_TOKEN_BYTES = 48; // 384-bit token

export { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE };

// ─── Generate a cryptographically secure refresh token ───
function generateToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ─── Create a new refresh token for a user ───
export async function createRefreshToken(
  userId: string,
  family?: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<{ rawToken: string; family: string }> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const tokenFamily = family || crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 25),
      userId,
      token: tokenHash,
      family: tokenFamily,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent?.slice(0, 500),
    },
  });

  return { rawToken, family: tokenFamily };
}

// ─── Rotate: validate old token, revoke it, issue new one ───
export async function rotateRefreshToken(
  rawToken: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<{
  rawToken: string;
  family: string;
  userId: string;
} | null> {
  const tokenHash = hashToken(rawToken);

  const existing = await prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: { user: { select: { id: true, isBanned: true } } },
  });

  if (!existing) return null;

  // Token already revoked → possible theft! Revoke entire family.
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { family: existing.family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // Token expired
  if (existing.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // User banned
  if (existing.user.isBanned) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  // Issue new token in the same family
  const newResult = await createRefreshToken(
    existing.userId,
    existing.family,
    meta
  );

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedBy: hashToken(newResult.rawToken) },
  });

  return {
    rawToken: newResult.rawToken,
    family: newResult.family,
    userId: existing.userId,
  };
}

// ─── Revoke a specific refresh token ───
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken
    .update({
      where: { token: tokenHash },
      data: { revokedAt: new Date() },
    })
    .catch(() => {});
}

// ─── Revoke all tokens for a user (logout everywhere) ───
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ─── Cleanup expired tokens (call periodically) ───
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });
  return result.count;
}
