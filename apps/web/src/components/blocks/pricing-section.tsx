"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ArrowRight } from "lucide-react";

interface Feature {
  name: string;
  included: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    quarterly: number;
    semiannual: number;
    yearly: number;
  };
  description: string;
  features: Feature[];
  highlight?: boolean;
  badge?: string;
  icon: React.ReactNode;
}

type BillingCycle = "monthly" | "quarterly" | "semiannual" | "yearly";

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "3 Months",
  semiannual: "6 Months",
  yearly: "1 Year",
};

const CYCLE_SUFFIX: Record<BillingCycle, string> = {
  monthly: "/mo",
  quarterly: "/3 mo",
  semiannual: "/6 mo",
  yearly: "/yr",
};

interface PricingSectionProps {
  tiers: PricingTier[];
  className?: string;
  onSubscribe?: (planId: string, cycle: BillingCycle) => void;
  loading?: boolean;
}

function PricingSection({ tiers, className, onSubscribe, loading }: PricingSectionProps) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  function getPrice(tier: PricingTier): number {
    return tier.price[cycle];
  }

  function getMonthlyEquivalent(tier: PricingTier): number | null {
    if (cycle === "monthly") return null;
    const total = tier.price[cycle];
    const months = cycle === "quarterly" ? 3 : cycle === "semiannual" ? 6 : 12;
    return Math.round(total / months);
  }

  function getSavings(tier: PricingTier): number | null {
    if (cycle === "monthly" || tier.price.monthly === 0) return null;
    const months = cycle === "quarterly" ? 3 : cycle === "semiannual" ? 6 : 12;
    const fullPrice = tier.price.monthly * months;
    const discounted = tier.price[cycle];
    const pct = Math.round(((fullPrice - discounted) / fullPrice) * 100);
    return pct > 0 ? pct : null;
  }

  return (
    <section className={cn("relative py-16 px-4 md:py-24", className)}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900">
            Simple, transparent pricing
          </h2>
          <p className="text-body text-surface-500 max-w-lg">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center p-1.5 bg-surface-100 rounded-full border border-surface-200 shadow-sm mt-2">
            {(Object.keys(CYCLE_LABELS) as BillingCycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "px-4 sm:px-6 py-2 text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap",
                  c === cycle
                    ? "bg-surface-900 text-white shadow-lg"
                    : "text-surface-500 hover:text-surface-900"
                )}
              >
                {CYCLE_LABELS[c]}
                {c === "yearly" && (
                  <span className="ml-1.5 text-[10px] font-bold text-emerald-400 uppercase">
                    Best
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => {
            const price = getPrice(tier);
            const monthlyEq = getMonthlyEquivalent(tier);
            const savings = getSavings(tier);

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative group rounded-2xl transition-all duration-300 flex flex-col",
                  tier.highlight
                    ? "bg-gradient-to-b from-surface-100/80 to-white border-2 border-brand/30 shadow-xl ring-1 ring-brand/10"
                    : "bg-white border border-surface-200 shadow-md hover:shadow-lg",
                )}
              >
                {tier.badge && tier.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="px-4 py-1 text-xs font-bold bg-brand text-white border-none shadow-lg">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <div className="p-6 sm:p-8 flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl",
                        tier.highlight
                          ? "bg-brand/10 text-brand"
                          : "bg-surface-100 text-surface-500"
                      )}
                    >
                      {tier.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900">
                      {tier.name}
                    </h3>
                  </div>

                  <div className="mb-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-surface-900">
                        {price === 0 ? "Free" : `$${(price / 100).toFixed(2)}`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-surface-400">
                          {CYCLE_SUFFIX[cycle]}
                        </span>
                      )}
                    </div>
                    {monthlyEq !== null && price > 0 && (
                      <p className="text-xs text-surface-400 mt-1">
                        ${(monthlyEq / 100).toFixed(2)}/mo equivalent
                        {savings && (
                          <span className="ml-1.5 text-emerald-600 font-semibold">
                            Save {savings}%
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 mb-6">
                    {tier.description}
                  </p>

                  <div className="space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature.name} className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex-shrink-0 rounded-full p-0.5",
                            feature.included
                              ? "text-emerald-600"
                              : "text-surface-300"
                          )}
                        >
                          <Check className="w-4 h-4" />
                        </div>
                        <span
                          className={cn(
                            "text-sm",
                            feature.included
                              ? "text-surface-700"
                              : "text-surface-400 line-through"
                          )}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 sm:p-8 pt-0 mt-auto">
                  <Button
                    onClick={() => onSubscribe?.(tier.id, cycle)}
                    disabled={loading}
                    className={cn(
                      "w-full h-12 rounded-xl transition-all duration-300",
                      tier.highlight
                        ? "bg-brand text-white hover:bg-brand/90 shadow-lg hover:shadow-xl font-semibold text-base"
                        : price === 0
                          ? "bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200 font-medium"
                          : "bg-surface-900 text-white hover:bg-surface-800 shadow-sm hover:shadow-md font-medium"
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {price === 0 ? "Get Started Free" : tier.highlight ? "Subscribe Now" : "Get Started"}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-surface-400">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" /> Cancel anytime
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" /> No hidden fees
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" /> 14-day money-back guarantee
          </span>
        </div>
      </div>
    </section>
  );
}

export { PricingSection, type PricingTier, type BillingCycle };
