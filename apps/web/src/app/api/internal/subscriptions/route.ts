import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@nepalens/database";

// GET — fetch subscription plans (public) or user's active subscription
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mySubscription = searchParams.get("my") === "1";

  if (mySubscription) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "past_due"] },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscription });
  }

  // Public: return all active plans
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({ plans });
}

// POST — create a subscription
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { planId, billingCycle } = body;

  if (!planId || !billingCycle) {
    return NextResponse.json({ error: "planId and billingCycle are required" }, { status: 400 });
  }

  const validCycles = ["monthly", "quarterly", "semiannual", "yearly"];
  if (!validCycles.includes(billingCycle)) {
    return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const priceMap: Record<string, number> = {
    monthly: plan.priceMonthly,
    quarterly: plan.priceQuarter,
    semiannual: plan.priceSemiAnnual,
    yearly: plan.priceYearly,
  };
  const amount = priceMap[billingCycle];

  const monthsMap: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    yearly: 12,
  };
  const months = monthsMap[billingCycle];

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + months);

  // Cancel any existing active subscription
  await prisma.subscription.updateMany({
    where: { userId, status: "active" },
    data: { status: "canceled", canceledAt: now },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      billingCycle,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      amount,
    },
    include: { plan: true },
  });

  return NextResponse.json({ subscription }, { status: 201 });
}

// PATCH — cancel subscription
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "cancel") {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "canceled", canceledAt: new Date() },
      include: { plan: true },
    });

    return NextResponse.json({ subscription: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
