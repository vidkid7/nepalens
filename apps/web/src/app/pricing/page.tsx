import { prisma } from "@nepalens/database";
import { PricingPageClient } from "./pricing-client";

export const metadata = {
  title: "Pricing — NepaLens",
  description: "Choose the perfect plan for your creative needs. From free downloads to unlimited commercial use.",
};

export default async function PricingPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });

  const serialized = plans.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    priceMonthly: p.priceMonthly,
    priceQuarter: p.priceQuarter,
    priceSemiAnnual: p.priceSemiAnnual,
    priceYearly: p.priceYearly,
    downloadsPerMonth: p.downloadsPerMonth,
    apiCallsPerMonth: p.apiCallsPerMonth,
    prioritySupport: p.prioritySupport,
    commercialLicense: p.commercialLicense,
    noAttribution: p.noAttribution,
    earlyAccess: p.earlyAccess,
    features: p.features as string[],
    highlight: p.highlight,
    position: p.position,
  }));

  return <PricingPageClient plans={serialized} />;
}
