"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { SessionGuard } from "@/components/auth/SessionGuard";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={14 * 60} refetchOnWindowFocus={true}>
      <SessionGuard>
        <SubscriptionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SubscriptionProvider>
      </SessionGuard>
    </SessionProvider>
  );
}
