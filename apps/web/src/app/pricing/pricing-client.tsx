"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PricingSection, type BillingCycle } from "@/components/blocks/pricing-section";
import { Zap, Crown } from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceQuarter: number;
  priceSemiAnnual: number;
  priceYearly: number;
  downloadsPerMonth: number;
  apiCallsPerMonth: number;
  prioritySupport: boolean;
  commercialLicense: boolean;
  noAttribution: boolean;
  earlyAccess: boolean;
  features: string[];
  highlight: boolean;
  position: number;
}

const ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
};

export function PricingPageClient({ plans }: { plans: PlanData[] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const tiers = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: {
      monthly: plan.priceMonthly,
      quarterly: plan.priceQuarter,
      semiannual: plan.priceSemiAnnual,
      yearly: plan.priceYearly,
    },
    description: plan.description,
    features: plan.features.map((f) => ({ name: f, included: true })),
    highlight: plan.highlight,
    badge: plan.highlight ? "Recommended" : undefined,
    icon: ICONS[plan.slug] || <Zap className="w-6 h-6" />,
  }));

  async function handleSubscribe(planId: string, cycle: BillingCycle) {
    if (!session) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    // Free plan — just redirect to homepage
    const plan = plans.find((p) => p.id === planId);
    if (plan?.slug === "free") {
      router.push("/");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/internal/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/settings?tab=subscription&success=1");
      } else {
        alert(data.error || "Failed to subscribe");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <PricingSection tiers={tiers} onSubscribe={handleSubscribe} loading={loading} />

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h3 className="text-2xl font-bold text-surface-900 text-center mb-10">
          Frequently asked questions
        </h3>
        <div className="space-y-6">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group border border-surface-200 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-surface-900 font-medium hover:bg-surface-50 transition-colors">
                {q}
                <svg
                  className="w-5 h-5 text-surface-400 group-open:rotate-180 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-sm text-surface-600 leading-relaxed">
                {a}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

const FAQ = [
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes! You can cancel at any time from your settings page. Your access continues until the end of the current billing period.",
  },
  {
    q: "What's included in the Free plan?",
    a: "The Free plan lets you browse and preview all photos with watermarks. To download watermark-free, high-resolution images, upgrade to Pro.",
  },
  {
    q: "Can I use photos for commercial projects?",
    a: "Yes! Pro subscribers get a full commercial license for all downloaded photos. Use them in websites, marketing materials, products, and more.",
  },
  {
    q: "How does the watermark work?",
    a: "All images show a watermark for non-Pro users. Once you subscribe to Pro, watermarks are removed and you get unlimited, clean downloads.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes! We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund.",
  },
];
