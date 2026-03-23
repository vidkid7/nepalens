"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Monitors the session for refresh token expiry.
 * When the server-side JWT callback sets `session.error = "RefreshTokenExpired"`,
 * this component automatically signs the user out and redirects to login.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const hasSignedOut = useRef(false);

  useEffect(() => {
    if (
      status === "authenticated" &&
      (session as any)?.error === "RefreshTokenExpired" &&
      !hasSignedOut.current
    ) {
      hasSignedOut.current = true;
      signOut({ callbackUrl: "/login?expired=1" });
    }
  }, [session, status]);

  return <>{children}</>;
}
