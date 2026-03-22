"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

interface Leader {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalViews: number;
  photoCount: number;
  photos: Array<{
    id: string;
    slug: string;
    altText: string | null;
    originalUrl: string;
    dominantColor: string | null;
    width: number;
    height: number;
  }>;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "alltime">("month");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/internal/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setLeaders(data.leaders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const rankBadge = (i: number) => {
    if (i === 0) return "bg-yellow-400 text-yellow-900";
    if (i === 1) return "bg-surface-300 text-surface-700";
    if (i === 2) return "bg-orange-300 text-orange-900";
    return "bg-surface-100 text-surface-500";
  };

  return (
    <div className="container-app py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-hero text-surface-900 mb-3">Community Leaderboard</h1>
          <p className="text-body text-surface-500 max-w-lg mx-auto">
            Celebrating our top contributors with the most views on recently added content.
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-surface-100 rounded-xl p-1">
            <button
              onClick={() => setPeriod("month")}
              className={`px-5 py-2 rounded-lg text-caption font-medium transition-all ${
                period === "month" ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setPeriod("alltime")}
              className={`px-5 py-2 rounded-lg text-caption font-medium transition-all ${
                period === "alltime" ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
              }`}
            >
              All time
            </button>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-surface-50 rounded-xl p-4 mb-8 text-center">
          <p className="text-micro text-surface-500">
            Rankings are based on total views for photos added in the selected period. Updated every 6 hours.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5 flex items-center gap-4">
                <Skeleton variant="circular" className="w-10 h-10" />
                <Skeleton variant="circular" className="w-12 h-12" />
                <div className="flex-1">
                  <Skeleton variant="text" className="w-32 mb-1" />
                  <Skeleton variant="text" className="w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <EmptyState
            title="No contributors yet"
            description="Once creators start uploading content, the leaderboard will populate."
          />
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, i) => (
              <div
                key={leader.id}
                className={`card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:shadow-card-hover ${
                  i < 3 ? "border-l-4" : ""
                } ${i === 0 ? "border-l-yellow-400" : i === 1 ? "border-l-surface-300" : i === 2 ? "border-l-orange-300" : ""}`}
              >
                {/* Rank */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-caption flex-shrink-0 ${rankBadge(i)}`}>
                  {i + 1}
                </div>

                {/* User info */}
                <Link href={`/profile/${leader.username}`} className="flex items-center gap-3 group flex-shrink-0">
                  <Avatar
                    src={leader.avatarUrl}
                    name={leader.displayName || leader.username}
                    size="lg"
                  />
                  <div>
                    <p className="text-subtitle font-semibold text-surface-900 group-hover:text-brand transition-colors">
                      {leader.displayName || leader.username}
                    </p>
                    <p className="text-micro text-surface-500">
                      {leader.totalViews.toLocaleString()} views · {leader.photoCount} photos
                    </p>
                  </div>
                </Link>

                {/* Photo preview strip */}
                <div className="flex-1 flex gap-2 overflow-hidden ml-0 sm:ml-auto">
                  {leader.photos.slice(0, 5).map((photo) => (
                    <Link
                      key={photo.id}
                      href={`/photo/${photo.slug}-${photo.id}`}
                      className="flex-1 h-16 rounded-lg overflow-hidden min-w-0"
                      style={{ backgroundColor: photo.dominantColor || "#e5e7eb" }}
                    >
                      <img
                        src={photo.originalUrl}
                        alt={photo.altText || ""}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
