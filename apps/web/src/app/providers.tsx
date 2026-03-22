"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { SubscriptionProvider } from "@/hooks/useSubscription";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SubscriptionProvider>
        <ToastProvider>{children}</ToastProvider>
      </SubscriptionProvider>
    </SessionProvider>
  );
}
