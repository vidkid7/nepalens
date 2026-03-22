import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPlans() {
  console.log("🏷️  Seeding subscription plans...");

  // Delete subscriptions referencing old plans before removing them
  const oldPlans = await prisma.subscriptionPlan.findMany({
    where: { slug: { in: ["basic", "enterprise"] } },
    select: { id: true },
  });
  if (oldPlans.length > 0) {
    await prisma.subscription.deleteMany({
      where: { planId: { in: oldPlans.map((p) => p.id) } },
    });
    await prisma.subscriptionPlan.deleteMany({
      where: { slug: { in: ["basic", "enterprise"] } },
    });
    console.log("  ✓ Removed old Basic/Enterprise plans and their subscriptions");
  }

  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "Browse and preview with watermarks",
      priceMonthly: 0,
      priceQuarter: 0,
      priceSemiAnnual: 0,
      priceYearly: 0,
      downloadsPerMonth: 0,
      apiCallsPerMonth: 0,
      prioritySupport: false,
      commercialLicense: false,
      noAttribution: false,
      earlyAccess: false,
      features: [
        "Browse all photos & videos",
        "Preview with watermark",
        "Create collections",
        "Follow photographers",
        "Community access",
      ],
      highlight: false,
      position: 0,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "Unlimited watermark-free downloads for creators & businesses",
      priceMonthly: 1999, // $19.99
      priceQuarter: 4999, // $49.99 ($16.66/mo)
      priceSemiAnnual: 8999, // $89.99 ($15/mo)
      priceYearly: 14999, // $149.99 ($12.50/mo)
      downloadsPerMonth: -1, // Unlimited
      apiCallsPerMonth: 10000,
      prioritySupport: true,
      commercialLicense: true,
      noAttribution: true,
      earlyAccess: true,
      features: [
        "Unlimited downloads",
        "No watermarks",
        "Full resolution + RAW",
        "Commercial license",
        "No attribution required",
        "API access (10K calls/mo)",
        "Priority support",
        "Early access to new content",
      ],
      highlight: true,
      position: 1,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ ${plan.name} plan`);
  }

  console.log("✅ Subscription plans seeded!");
}

seedPlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
