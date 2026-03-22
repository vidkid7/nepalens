import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";

// GET /api/internal/subscriptions/status — Check current user's subscription
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ isPro: false, plan: null });
  }

  const sub = await getActiveSubscription(userId);

  return NextResponse.json({
    isPro: sub !== null && sub.planSlug !== "free",
    plan: sub
      ? {
          name: sub.planName,
          slug: sub.planSlug,
          billingCycle: sub.billingCycle,
          currentPeriodEnd: sub.currentPeriodEnd,
        }
      : null,
  });
}
