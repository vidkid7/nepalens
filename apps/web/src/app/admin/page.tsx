"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RecentPhoto {
  id: string;
  slug: string;
  originalUrl: string;
  altText: string | null;
  status: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface RecentUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  isContributor: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface DashboardData {
  totalPhotos: number;
  totalVideos: number;
  totalUsers: number;
  pendingQueue: number;
  pendingPhotos: number;
  pendingVideos: number;
  totalDownloads: number;
  pendingReports: number;
  recentUsers: number;
  recentPhotosList: RecentPhoto[];
  recentUsersList: RecentUser[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(ms / 86_400_000);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    approved: "badge-success",
    pending: "badge-warning",
    rejected: "badge-danger",
  };
  return `badge ${map[status] ?? "badge-neutral"}`;
}

function userInitials(name: string | null, username: string): string {
  const src = name || username;
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (Heroicons Outline, 24×24 matching AdminSidebar)  */
/* ------------------------------------------------------------------ */

const svg = { fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5 } as const;
const d = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function CameraIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path {...d} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  );
}

function VideoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function DownloadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function ClockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function FlagIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

function ExclamationIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function GridIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  );
}

function UserIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function SparkleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function ChartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function ArrowTrendUpIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

function ChevronRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} {...svg}>
      <path {...d} d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loaders                                                   */
/* ------------------------------------------------------------------ */

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton variant="circular" width={44} height={44} />
            <Skeleton variant="text" width={48} height={12} />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-1/3 h-8" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <Skeleton variant="text" className="w-2/3" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-1/3 h-8" />
        </div>
      ))}
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-full" />
        </div>
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, col) => (
        <div key={col} className="card">
          <div className="p-5 border-b border-surface-100">
            <Skeleton variant="text" className="w-1/3 h-5" />
          </div>
          <div className="divide-y divide-surface-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton variant="rectangular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" className="w-2/3" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  /* ---- Error state ------------------------------------------------ */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-danger-50 flex items-center justify-center mb-4">
          <ExclamationIcon className="w-7 h-7 text-danger-600" />
        </div>
        <h2 className="text-title text-surface-900 mb-1">Failed to load dashboard</h2>
        <p className="text-caption text-surface-500 mb-6">
          Could not fetch analytics data. Please try again.
        </p>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setError(false);
            setLoading(true);
            fetch("/api/admin/analytics")
              .then((r) => r.json())
              .then((json) => { setData(json); setLoading(false); })
              .catch(() => { setError(true); setLoading(false); });
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  /* ---- Stat card definitions -------------------------------------- */
  const statCards = data
    ? [
        {
          label: "Total Photos",
          value: fmt(data.totalPhotos),
          icon: <CameraIcon />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
          trend: null as string | null,
        },
        {
          label: "Total Videos",
          value: fmt(data.totalVideos),
          icon: <VideoIcon />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
          trend: null,
        },
        {
          label: "Total Users",
          value: fmt(data.totalUsers),
          icon: <UsersIcon />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
          trend: data.recentUsers > 0 ? `+${data.recentUsers} this week` : null,
        },
        {
          label: "Total Downloads",
          value: fmt(data.totalDownloads),
          icon: <DownloadIcon />,
          iconBg: "bg-cyan-50",
          iconColor: "text-cyan-600",
          trend: null,
        },
      ]
    : [];

  /* ---- Alert definitions ------------------------------------------ */
  const alerts = data
    ? [
        {
          label: "Pending Review",
          count: data.pendingQueue,
          description: "New uploads need moderation before they go live.",
          href: "/admin/queue",
          icon: <ClockIcon className="w-5 h-5" />,
          badgeClass: data.pendingQueue > 0 ? "badge-warning" : "badge-success",
          borderClass: data.pendingQueue > 0 ? "border-l-warning-500" : "border-l-surface-200",
        },
        {
          label: "Pending Reports",
          count: data.pendingReports,
          description: "User reports require review and action.",
          href: "/admin/reports",
          icon: <FlagIcon className="w-5 h-5" />,
          badgeClass: data.pendingReports > 0 ? "badge-danger" : "badge-success",
          borderClass: data.pendingReports > 0 ? "border-l-danger-500" : "border-l-surface-200",
        },
        {
          label: "Processing Failures",
          count: 0,
          description: "Media that failed during upload processing.",
          href: "/admin/queue",
          icon: <ExclamationIcon className="w-5 h-5" />,
          badgeClass: "badge-success",
          borderClass: "border-l-surface-200",
        },
      ]
    : [];

  /* ---- Quick action definitions ----------------------------------- */
  const quickActions = [
    {
      label: "Review Queue",
      description: "Moderate pending uploads",
      href: "/admin/queue",
      icon: <ClockIcon />,
      iconBg: "bg-warning-50",
      iconColor: "text-warning-600",
    },
    {
      label: "Manage Media",
      description: "Browse and edit all content",
      href: "/admin/media",
      icon: <GridIcon />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Manage Users",
      description: "View accounts and permissions",
      href: "/admin/users",
      icon: <UserIcon />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "View Reports",
      description: "Handle flagged content",
      href: "/admin/reports",
      icon: <FlagIcon />,
      iconBg: "bg-danger-50",
      iconColor: "text-danger-600",
    },
    {
      label: "Manage Challenges",
      description: "Create and edit photo challenges",
      href: "/admin/challenges",
      icon: <SparkleIcon />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "View Analytics",
      description: "Platform metrics and trends",
      href: "/admin/analytics",
      icon: <ChartIcon />,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
    },
  ];

  /* ---- Render ----------------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* ─── 1. Page Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-display text-surface-900">Dashboard</h1>
        <p className="text-body text-surface-500 mt-1">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* ─── 2. Stats Grid ─────────────────────────────────────── */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card p-6 group">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}
                >
                  {card.icon}
                </div>
                {card.trend ? (
                  <span className="flex items-center gap-1 text-micro text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ArrowTrendUpIcon className="w-3.5 h-3.5" />
                    {card.trend}
                  </span>
                ) : (
                  <span className="text-micro text-surface-400 bg-surface-50 px-2 py-0.5 rounded-full">
                    All time
                  </span>
                )}
              </div>
              <p className="text-display text-surface-900 leading-none">{card.value}</p>
              <p className="text-caption text-surface-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── 3. Alert Cards Row ────────────────────────────────── */}
      {loading ? (
        <AlertsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Link
              key={alert.label}
              href={alert.href}
              className={`card p-5 border-l-4 ${alert.borderClass} hover:shadow-md transition-shadow group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-label text-surface-700 font-medium">
                  {alert.label}
                </span>
                <span className={`badge ${alert.badgeClass}`}>
                  {alert.count}
                </span>
              </div>
              <p className="text-caption text-surface-500 mb-3">
                {alert.description}
              </p>
              <span className="inline-flex items-center gap-1 text-micro text-brand font-medium group-hover:gap-2 transition-all">
                View details
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ─── 4. Quick Actions Grid ─────────────────────────────── */}
      <div>
        <h2 className="text-title text-surface-900 mb-4">Quick Actions</h2>
        {loading ? (
          <QuickActionsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="card-interactive p-5 group flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${action.iconBg} ${action.iconColor} flex items-center justify-center flex-shrink-0`}
                >
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label text-surface-900 font-medium group-hover:text-brand transition-colors">
                    {action.label}
                  </p>
                  <p className="text-caption text-surface-500 mt-0.5">
                    {action.description}
                  </p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-surface-300 group-hover:text-brand flex-shrink-0 mt-0.5 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. Recent Activity ────────────────────────────────── */}
      <div>
        <h2 className="text-title text-surface-900 mb-4">Recent Activity</h2>
        {loading ? (
          <RecentActivitySkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Recent Photos ── */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                <h3 className="text-subtitle text-surface-900">Recent Photos</h3>
                <Link
                  href="/admin/media"
                  className="text-micro text-brand font-medium hover:underline"
                >
                  View all
                </Link>
              </div>

              {data?.recentPhotosList?.length ? (
                <ul className="divide-y divide-surface-100">
                  {data.recentPhotosList.map((photo) => (
                    <li key={photo.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.originalUrl}
                        alt={photo.altText || photo.slug}
                        className="w-12 h-12 rounded-lg object-cover bg-surface-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-label text-surface-900 truncate">
                          {photo.altText || photo.slug}
                        </p>
                        <p className="text-micro text-surface-500 mt-0.5">
                          by{" "}
                          <span className="text-surface-700">
                            {photo.user.displayName || photo.user.username}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={statusBadgeClass(photo.status)}>
                          {photo.status}
                        </span>
                        <span className="text-micro text-surface-400">
                          {timeAgo(photo.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center">
                  <CameraIcon className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                  <p className="text-caption text-surface-500">No photos yet</p>
                </div>
              )}
            </div>

            {/* ── Recent Users ── */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                <h3 className="text-subtitle text-surface-900">Recent Users</h3>
                <Link
                  href="/admin/users"
                  className="text-micro text-brand font-medium hover:underline"
                >
                  View all
                </Link>
              </div>

              {data?.recentUsersList?.length ? (
                <ul className="divide-y divide-surface-100">
                  {data.recentUsersList.map((user) => (
                    <li key={user.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-50 transition-colors">
                      {user.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover bg-surface-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-label font-semibold flex-shrink-0">
                          {userInitials(user.displayName, user.username)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-label text-surface-900 truncate">
                            {user.displayName || user.username}
                          </p>
                          {user.isContributor && (
                            <span className="badge badge-brand">Contributor</span>
                          )}
                          {user.isVerified && (
                            <span className="badge badge-success">Verified</span>
                          )}
                        </div>
                        <p className="text-micro text-surface-500 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <span className="text-micro text-surface-400 flex-shrink-0">
                        {timeAgo(user.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center">
                  <UsersIcon className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                  <p className="text-caption text-surface-500">No users yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
