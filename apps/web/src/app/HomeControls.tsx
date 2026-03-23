"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const TABS = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  {
    label: "Videos",
    href: "/search?tab=videos",
    match: (p: string) => p.startsWith("/search") && p.includes("tab=videos"),
  },
  { label: "Leaderboard", href: "/leaderboard", match: (p: string) => p.startsWith("/leaderboard") },
  { label: "Challenges", href: "/challenges", match: (p: string) => p.startsWith("/challenges") },
];

export default function HomeControls() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-16 z-sticky bg-white border-b border-surface-200">
      <div className="container-app flex items-center justify-center py-2.5">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-5 py-2 rounded-full text-caption font-medium transition-colors ${
                  active
                    ? "bg-surface-900 text-white"
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
