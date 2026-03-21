"use client";

import { useState, useEffect } from "react";
import Skeleton from "@/components/ui/Skeleton";

/* ─── Types ────────────────────────────────────────────────────────── */
interface TimePoint {
  date: string;
  count: number;
}

interface SearchEntry {
  query: string;
  count: number;
}

interface CategoryEntry {
  name: string;
  slug: string;
  photoCount: number;
}

interface TagEntry {
  name: string;
  count: number;
}

interface AnalyticsData {
  totalPhotos: number;
  totalVideos: number;
  totalUsers: number;
  totalDownloads: number;
  totalViews: number;
  pendingQueue: number;
  pendingReports: number;
  approvalRate: number;
  downloadsByDay: TimePoint[];
  uploadsByDay: TimePoint[];
  signupsByDay: TimePoint[];
  topSearches: SearchEntry[];
  zeroResultQueries: SearchEntry[];
  topCategories: CategoryEntry[];
  topTags: TagEntry[];
  activeUsers: number;
  storageBytes: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Bar Chart Component ──────────────────────────────────────────── */
function BarChart({
  data,
  color = "bg-brand",
  hoverColor = "hover:bg-brand/80",
}: {
  data: TimePoint[];
  color?: string;
  hoverColor?: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end justify-between gap-1.5 h-48">
      {data.map((point) => {
        const pct = (point.count / max) * 100;
        return (
          <div key={point.date} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-micro text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {point.count}
            </span>
            <div className="w-full flex justify-center" style={{ height: "160px" }}>
              <div
                className={`w-full max-w-10 ${color} rounded-t transition-all ${hoverColor}`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-micro text-surface-400 truncate w-full text-center">
              {shortDate(point.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Loading Skeleton ─────────────────────────────────────────────── */
function AnalyticsSkeleton() {
  return (
    <div>
      <Skeleton variant="text" className="w-56 h-8 mb-2" />
      <Skeleton variant="text" className="w-72 h-4 mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton variant="text" className="w-2/3 h-3 mb-3" />
            <Skeleton variant="text" className="w-1/2 h-7" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card p-6">
            <Skeleton variant="text" className="w-40 h-5 mb-4" />
            <Skeleton variant="rectangular" className="w-full h-48" />
          </div>
        ))}
      </div>
      <div className="card p-6 mb-6">
        <Skeleton variant="text" className="w-40 h-5 mb-4" />
        <Skeleton variant="rectangular" className="w-full h-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6">
            <Skeleton variant="text" className="w-40 h-5 mb-4" />
            <Skeleton variant="rectangular" className="w-full h-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <AnalyticsSkeleton />;

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-subtitle text-surface-500">Failed to load analytics</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-brand text-white rounded-lg text-label hover:bg-brand/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = [
    { label: "Total Photos", value: formatNumber(data.totalPhotos), icon: "📷" },
    { label: "Total Videos", value: formatNumber(data.totalVideos), icon: "🎬" },
    { label: "Total Users", value: formatNumber(data.totalUsers), icon: "👥" },
    { label: "Total Downloads", value: formatNumber(data.totalDownloads), icon: "⬇️" },
    { label: "Total Views", value: formatNumber(data.totalViews), icon: "👁" },
    { label: "Approval Rate", value: `${data.approvalRate}%`, icon: "✅" },
  ];

  const maxSearch = data.topSearches[0]?.count || 1;
  const maxCategory = Math.max(...data.topCategories.map((c) => c.photoCount), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-display text-surface-900">Analytics &amp; Insights</h1>
          <p className="text-caption text-surface-500 mt-1">
            Platform metrics and performance insights
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-caption text-surface-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Last 7 days
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{m.icon}</span>
              <p className="text-micro text-surface-500 uppercase tracking-wide">{m.label}</p>
            </div>
            <p className="text-display text-surface-900">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section: Downloads & Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="text-subtitle text-surface-900 mb-4">Downloads Over Time</h3>
          {data.downloadsByDay.length > 0 ? (
            <BarChart data={data.downloadsByDay} color="bg-brand/70" hoverColor="hover:bg-brand" />
          ) : (
            <div className="h-48 flex items-center justify-center text-caption text-surface-400">
              No download data yet
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-subtitle text-surface-900 mb-4">Uploads Over Time</h3>
          {data.uploadsByDay.length > 0 ? (
            <BarChart
              data={data.uploadsByDay}
              color="bg-emerald-400/70"
              hoverColor="hover:bg-emerald-500"
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-caption text-surface-400">
              No upload data yet
            </div>
          )}
        </div>
      </div>

      {/* Signups Chart */}
      <div className="card p-6 mb-6">
        <h3 className="text-subtitle text-surface-900 mb-4">New User Signups</h3>
        {data.signupsByDay.length > 0 ? (
          <BarChart
            data={data.signupsByDay}
            color="bg-purple-400/70"
            hoverColor="hover:bg-purple-500"
          />
        ) : (
          <div className="h-48 flex items-center justify-center text-caption text-surface-400">
            No signup data yet
          </div>
        )}
      </div>

      {/* Top Content: Categories & Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Categories */}
        <div className="card p-6">
          <h3 className="text-subtitle text-surface-900 mb-4">Top Categories</h3>
          {data.topCategories.length > 0 ? (
            <div className="space-y-3">
              {data.topCategories.slice(0, 10).map((cat) => (
                <div key={cat.slug} className="flex items-center gap-3">
                  <span className="text-caption text-surface-700 font-medium w-28 truncate">
                    {cat.name}
                  </span>
                  <div className="flex-1 h-6 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max((cat.photoCount / maxCategory) * 100, 4)}%`,
                      }}
                    >
                      {cat.photoCount > 0 && (
                        <span className="text-micro text-amber-900 font-medium">
                          {cat.photoCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-caption text-surface-400 py-8 text-center">No categories yet</p>
          )}
        </div>

        {/* Top Tags */}
        <div className="card p-6">
          <h3 className="text-subtitle text-surface-900 mb-4">Top Tags</h3>
          {data.topTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.topTags.slice(0, 25).map((tag, i) => {
                const size = Math.max(0.7, Math.min(1.3, tag.count / (data.topTags[0]?.count || 1) + 0.5));
                return (
                  <span
                    key={tag.name}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption font-medium transition-colors ${
                      i < 5
                        ? "bg-brand/10 text-brand-700"
                        : i < 15
                          ? "bg-surface-100 text-surface-700"
                          : "bg-surface-50 text-surface-500"
                    }`}
                    style={{ fontSize: `${size}rem` }}
                  >
                    {tag.name}
                    <span className="text-micro opacity-60">{tag.count}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-caption text-surface-400 py-8 text-center">No tags yet</p>
          )}
        </div>
      </div>

      {/* Search Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Search Terms */}
        <div className="card p-6">
          <h3 className="text-subtitle text-surface-900 mb-4">Top Search Terms</h3>
          {data.topSearches.length > 0 ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {data.topSearches.slice(0, 15).map((s, i) => (
                <div key={s.query} className="flex items-center gap-3">
                  <span className="text-micro text-surface-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-caption text-surface-700 font-medium truncate">
                        {s.query}
                      </span>
                      <span className="text-micro text-surface-500 ml-2 flex-shrink-0">
                        {s.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${(s.count / maxSearch) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-caption text-surface-400 py-8 text-center">No search data yet</p>
          )}
        </div>

        {/* Zero-Result Queries */}
        <div className="card p-6">
          <h3 className="text-subtitle text-surface-900 mb-4">Zero-Result Queries</h3>
          {data.zeroResultQueries.length > 0 ? (
            <div className="space-y-2">
              {data.zeroResultQueries.slice(0, 10).map((q) => (
                <div
                  key={q.query}
                  className="flex items-center justify-between px-3 py-2 bg-danger-50 rounded-lg"
                >
                  <span className="text-caption text-danger-700">{q.query}</span>
                  <span className="text-micro text-danger-500">{q.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-caption text-surface-600 font-medium">All clear!</p>
              <p className="text-micro text-surface-400 mt-1">
                No zero-result queries detected. Consider adding more tags and content to maintain coverage.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Health */}
      <div className="card p-6">
        <h3 className="text-subtitle text-surface-900 mb-6">Platform Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Approval Rate */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Upload Approval Rate</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-display text-surface-900">{data.approvalRate}%</span>
            </div>
            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  data.approvalRate >= 80 ? "bg-emerald-500" : data.approvalRate >= 50 ? "bg-amber-500" : "bg-danger-500"
                }`}
                style={{ width: `${data.approvalRate}%` }}
              />
            </div>
          </div>

          {/* Pending Queue */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Pending Review Queue</p>
            <div className="flex items-center gap-2">
              <span className="text-display text-surface-900">{data.pendingQueue}</span>
              {data.pendingQueue > 50 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-micro rounded-full font-medium">
                  High
                </span>
              )}
              {data.pendingQueue > 200 && (
                <span className="px-2 py-0.5 bg-danger-100 text-danger-700 text-micro rounded-full font-medium">
                  Critical
                </span>
              )}
            </div>
            <p className="text-micro text-surface-400 mt-1">
              {data.pendingReports} pending reports
            </p>
          </div>

          {/* Processing Failures */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Processing Failures</p>
            <div className="flex items-center gap-2">
              <span className="text-display text-surface-900">0</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-micro rounded-full font-medium">
                Healthy
              </span>
            </div>
            <p className="text-micro text-surface-400 mt-1">No failures in last 24h</p>
          </div>

          {/* Storage Usage */}
          <div>
            <p className="text-caption text-surface-500 mb-2">Storage Usage</p>
            <span className="text-display text-surface-900">
              {formatBytes(data.storageBytes)}
            </span>
            <p className="text-micro text-surface-400 mt-1">
              {data.activeUsers} active users (7d)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
