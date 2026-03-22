"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useSession } from "next-auth/react";

interface SubStatus {
  isPro: boolean;
  plan: { name: string; slug: string; billingCycle: string; currentPeriodEnd: string } | null;
  loading: boolean;
}

const SubContext = createContext<SubStatus>({ isPro: false, plan: null, loading: true });

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [subStatus, setSubStatus] = useState<SubStatus>({ isPro: false, plan: null, loading: true });

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setSubStatus({ isPro: false, plan: null, loading: false });
      return;
    }

    fetch("/api/internal/subscriptions/status")
      .then((r) => r.json())
      .then((data) => setSubStatus({ isPro: data.isPro, plan: data.plan, loading: false }))
      .catch(() => setSubStatus({ isPro: false, plan: null, loading: false }));
  }, [session, status]);

  return <SubContext.Provider value={subStatus}>{children}</SubContext.Provider>;
}

export function useSubscription() {
  return useContext(SubContext);
}
