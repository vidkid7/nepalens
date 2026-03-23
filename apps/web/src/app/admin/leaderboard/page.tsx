"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Skeleton from "@/components/ui/Skeleton";

/* ─── Types ────────────────────────────────────────────────────────── */
interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalViews: number;
  totalDownloads: number;
  photoCount: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  period: string;
  sort: string;
  lastRefreshed: string;
}

type Period = "30d" | "90d" | "all-time";
type SortField = "views" | "downloads";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

/* ─── Rank Badge ───────────────────────────────────────────────────── */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-label">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-200 text-surface-600 font-bold text-label">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold text-label">
        🥉
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-50 text-surface-500 font-medium text-caption">
      {rank}
    </span>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────────────── */
function LeaderboardSkeleton() {
  return (
    <div>
      <Skeleton variant="text" className="w-64 h-8 mb-2" />
      <Skeleton variant="text" className="w-48 h-4 mb-8" />
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200">
          <Skeleton variant="text" className="w-40 h-5" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-surface-100">
            <Skeleton variant="circular" className="w-8 h-8" />
            <Skeleton variant="circular" className="w-10 h-10" />
            <div className="flex-1">
              <Skeleton variant="text" className="w-32 h-4 mb-1" />
              <Skeleton variant="text" className="w-24 h-3" />
            </div>
            <Skeleton variant="text" className="w-16 h-4" />
            <Skeleton variant="text" className="w-16 h-4" />
            <Skeleton variant="text" className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function AdminLeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all-time");
  const [sort, setSort] = useState<SortField>("views");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/admin/leaderboard?period=${period}&sort=${sort}`
      );
      if (!res.ok) throw new Error("Failed to load leaderboard");
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [period, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/admin/leaderboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleExclude(userId: string, username: string) {
    if (!confirm(`Exclude @${username} from the leaderboard?`)) return;
    await fetch("/api/admin/leaderboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "exclude", userId }),
    });
    await fetchData();
  }

  if (loading && !data) return <LeaderboardSkeleton />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-subtitle text-surface-500">Failed to load leaderboard</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-label hover:bg-brand/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-display text-surface-900">Leaderboard Management</h1>
          <p className="text-caption text-surface-500 mt-1">
            Top contributors ranked by engagement
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg text-label font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
        >
          {refreshing ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Refreshing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Refresh Leaderboard
            </>
          )}
        </button>
      </div>

      {/* Period & Sort Toggles */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
          {(["all-time", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-caption font-medium transition-colors ${
                period === p
                  ? "bg-white text-surface-900 shadow-sm"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              {p === "all-time" ? "All Time" : "30 Days"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
          {(["views", "downloads"] as SortField[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-md text-caption font-medium transition-colors ${
                sort === s
                  ? "bg-white text-surface-900 shadow-sm"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              Sort by {s === "views" ? "Views" : "Downloads"}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden mb-8">
        {!data || data.leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-subtitle text-surface-600">No leaderboard data</p>
            <p className="text-caption text-surface-400 mt-1">
              Contributors will appear here once they have approved photos
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-left text-micro text-surface-500 uppercase tracking-wider w-14">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-micro text-surface-500 uppercase tracking-wider">
                    Contributor
                  </th>
                  <th className="px-4 py-3 text-right text-micro text-surface-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-4 py-3 text-right text-micro text-surface-500 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-4 py-3 text-right text-micro text-surface-500 uppercase tracking-wider">
                    Photos
                  </th>
                  <th className="px-4 py-3 text-center text-micro text-surface-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-micro text-surface-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.leaderboard.map((user, i) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName || user.username}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-label font-medium">
                            {(user.displayName || user.username || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-label text-surface-900 font-medium truncate">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-micro text-surface-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-label text-surface-900 font-medium">
                        {formatNumber(user.totalViews)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-label text-surface-700">
                        {formatNumber(user.totalDownloads)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-label text-surface-700">
                        {user.photoCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-micro rounded-full font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/@${user.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 text-micro text-surface-600 hover:text-brand bg-surface-50 hover:bg-brand/5 rounded-md transition-colors font-medium"
                        >
                          View Profile
                        </a>
                        <button
                          onClick={() => handleExclude(user.id, user.username)}
                          className="px-2.5 py-1.5 text-micro text-surface-500 hover:text-danger-600 bg-surface-50 hover:bg-danger-50 rounded-md transition-colors font-medium"
                        >
                          Exclude
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div className="card p-6">
        <h3 className="text-subtitle text-surface-900 mb-4">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Ranking Window */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Ranking Window</p>
            <div className="space-y-2">
              {[
                { label: "30 Days", value: "30d" },
                { label: "90 Days", value: "90d" },
                { label: "All Time", value: "all-time" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 text-caption text-surface-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rankWindow"
                    value={opt.value}
                    checked={period === opt.value}
                    onChange={() => setPeriod(opt.value as Period)}
                    className="w-4 h-4 text-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Refresh Frequency */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Refresh Frequency</p>
            <p className="text-caption text-surface-700">
              Leaderboard data is computed on demand when this page loads or when manually refreshed.
            </p>
            <p className="text-micro text-surface-400 mt-2">
              For high-traffic sites, consider setting up a scheduled refresh via cron.
            </p>
          </div>

          {/* Last Refresh */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Last Refreshed</p>
            <p className="text-caption text-surface-700">
              {data?.lastRefreshed
                ? new Date(data.lastRefreshed).toLocaleString()
                : "Never"}
            </p>
            <p className="text-micro text-surface-400 mt-2">
              {data?.leaderboard.length || 0} contributors ranked
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
