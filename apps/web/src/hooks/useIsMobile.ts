"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Lightweight hook that returns true when viewport is below the mobile breakpoint.
 * Uses matchMedia for efficient, paint-free change detection.
 */
export function useIsMobile(breakpoint = MOBILE_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    onChange(mql);
    mql.addEventListener("change", onChange as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener("change", onChange as (e: MediaQueryListEvent) => void);
  }, [breakpoint]);

  return isMobile;
}
