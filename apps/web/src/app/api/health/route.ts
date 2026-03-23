import { NextResponse } from "next/server";
import { isRedisConnected } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    redis: isRedisConnected(),
    timestamp: new Date().toISOString(),
  });
}
