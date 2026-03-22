import { prisma } from "@pixelstock/database";

export interface ActiveSubscription {
  id: string;
  planSlug: string;
  planName: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: Date;
  downloadsPerMonth: number;
  commercialLicense: boolean;
  noAttribution: boolean;
}

/**
 * Check if a user has an active Pro subscription.
 * Returns the subscription details or null.
 */
export async function getActiveSubscription(userId: string): Promise<ActiveSubscription | null> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "active",
        currentPeriodEnd: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!sub || !sub.plan) return null;

    return {
      id: sub.id,
      planSlug: sub.plan.slug,
      planName: sub.plan.name,
      status: sub.status,
      billingCycle: sub.billingCycle,
      currentPeriodEnd: sub.currentPeriodEnd,
      downloadsPerMonth: sub.plan.downloadsPerMonth,
      commercialLicense: sub.plan.commercialLicense,
      noAttribution: sub.plan.noAttribution,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a user is a Pro subscriber (has paid plan with noAttribution).
 */
export async function isProSubscriber(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const sub = await getActiveSubscription(userId);
  return sub !== null && sub.planSlug !== "free";
}
