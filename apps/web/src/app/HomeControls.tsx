"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

const TABS = [
  { label: "Home", href: "/", match: (p: string, _s: string) => p === "/" },
  {
    label: "Photos",
    href: "/discover",
    match: (p: string, _s: string) => p === "/discover",
  },
  {
    label: "Videos",
    href: "/search?tab=videos",
    match: (p: string, s: string) => s.includes("tab=videos"),
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    match: (p: string, _s: string) => p.startsWith("/leaderboard"),
  },
  {
    label: "Challenges",
    href: "/challenges",
    match: (p: string, _s: string) => p.startsWith("/challenges"),
  },
];

export default function HomeControls() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <nav className="sticky top-16 z-sticky bg-white/95 backdrop-blur-md border-b border-surface-100">
      <div className="container-app flex items-center justify-center py-3">
        <div className="flex items-center gap-1.5">
          {TABS.map((tab) => {
            const active = tab.match(pathname, search);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
