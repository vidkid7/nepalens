import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isProSubscriber } from "@/lib/subscription";

// GET /api/internal/subscription/status — Check if current user is Pro
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ isPro: false, active: false });
  }
  const userId = (session.user as any).id;
  const isPro = await isProSubscriber(userId);
  return NextResponse.json({ isPro, active: isPro });
}
