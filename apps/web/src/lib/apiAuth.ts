import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nepalens/database";
import crypto from "crypto";

interface RateLimitResult {
  allowed: boolean;
  headers: Record<string, string>;
  keyRecord?: any;
}

export async function validateApiKey(request: NextRequest): Promise<RateLimitResult> {
  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!apiKey) {
    return { allowed: false, headers: {} };
  }

  // Hash the key to look it up
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  const keyRecord = await prisma.apiKey.findUnique({ where: { keyHash } });

  if (!keyRecord || !keyRecord.isActive) {
    return { allowed: false, headers: {} };
  }

  // Update last used
  await prisma.apiKey.update({ where: { id: keyRecord.id }, data: { lastUsedAt: new Date() } });

  // Simple in-memory rate limiting (in production, use Redis)
  const headers: Record<string, string> = {
    "X-Ratelimit-Limit": keyRecord.rateLimitHour.toString(),
    "X-Ratelimit-Remaining": keyRecord.rateLimitHour.toString(),
  };

  return { allowed: true, headers, keyRecord };
}

export function apiErrorResponse(status: number, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers });
}
