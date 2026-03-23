import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let redisStatus = false;
  try {
    const { isRedisConnected } = await import("@/lib/cache");
    redisStatus = isRedisConnected();
  } catch {
    // Redis not available — that's okay
  }

  return NextResponse.json({
    status: "ok",
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
}
