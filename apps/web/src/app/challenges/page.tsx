"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Tabs from "@/components/ui/Tabs";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  prizeDesc: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "active": return "badge badge-success";
    case "upcoming": return "badge badge-info";
    case "ended": return "badge badge-neutral";
    default: return "badge badge-neutral";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active": return "Active";
    case "upcoming": return "Upcoming";
    case "ended": return "Ended";
    default: return status;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    fetch("/api/internal/challenges?status=all")
      .then((r) => r.json())
      .then((data) => { setChallenges(data.challenges || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tabs = [
    { id: "active", label: "Active", count: challenges.filter((c) => c.status === "active").length },
    { id: "upcoming", label: "Upcoming", count: challenges.filter((c) => c.status === "upcoming").length },
    { id: "ended", label: "Past", count: challenges.filter((c) => c.status === "ended").length },
  ];

  const filtered = challenges.filter((c) => c.status === activeTab);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand via-brand-600 to-brand-800 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-300 rounded-full blur-3xl" />
        </div>
        <div className="container-app relative z-10 text-center">
          <h1 className="text-hero text-white mb-4">Community Challenges</h1>
          <p className="text-subtitle text-white/80 max-w-2xl mx-auto">
            Compete with fellow photographers, push your creative limits, and win amazing prizes.
          </p>
        </div>
      </section>

      <div className="container-app py-12">
        <div className="max-w-5xl mx-auto">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} variant="pill" className="mb-8" />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <Skeleton variant="rectangular" className="h-48 w-full" />
                  <div className="p-5">
                    <Skeleton variant="text" className="w-20 mb-3" />
                    <Skeleton variant="text" className="w-full mb-2" />
                    <Skeleton variant="text" className="w-3/4 mb-4" />
                    <Skeleton variant="text" className="w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={`No ${activeTab} challenges`}
              description={activeTab === "active" ? "There are no active challenges right now. Check back soon!" : activeTab === "upcoming" ? "No upcoming challenges announced yet." : "No past challenges to display."}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((challenge) => (
                <Link key={challenge.id} href={`/challenges/${challenge.slug}`} className="card overflow-hidden group hover:shadow-card-hover transition-all">
                  <div className="h-48 relative overflow-hidden">
                    {challenge.coverUrl ? (
                      <img src={challenge.coverUrl} alt={challenge.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-100 via-brand-200 to-brand-300 flex items-center justify-center">
                        <svg className="w-12 h-12 text-brand/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={statusBadge(challenge.status)}>{statusLabel(challenge.status)}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-subtitle font-semibold text-surface-900 group-hover:text-brand transition-colors mb-2 line-clamp-1">{challenge.title}</h3>
                    {challenge.description && <p className="text-caption text-surface-500 mb-3 line-clamp-2">{challenge.description}</p>}
                    <div className="flex items-center gap-3 text-micro text-surface-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {formatDate(challenge.startsAt)} \u2013 {formatDate(challenge.endsAt)}
                      </span>
                    </div>
                    {challenge.prizeDesc && (
                      <div className="mt-3 pt-3 border-t border-surface-100">
                        <p className="text-micro text-brand font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          {challenge.prizeDesc}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
