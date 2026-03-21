"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MediaOwner {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isBanned: boolean;
}

interface ReportMedia {
  id: string;
  type: "photo" | "video";
  title: string | null;
  thumbnailUrl: string | null;
  slug: string;
  status: string;
  user: MediaOwner;
}

interface Reporter {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Report {
  id: string;
  reporterId: string | null;
  mediaType: string;
  mediaId: string;
  reason: string;
  description: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reporter: Reporter | null;
  media: ReportMedia | null;
}

interface Counts {
  total: number;
  pending: number;
  reviewed: number;
  dismissed: number;
  escalated: number;
}

type StatusFilter = "all" | "pending" | "reviewed" | "dismissed" | "escalated";
type ReasonFilter = string;
type SortOption = "newest" | "oldest";
type ReportAction = "review" | "dismiss" | "escalate";
type MediaAction = "none" | "hide" | "remove";
type UserAction = "none" | "warn" | "ban";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REASONS = [
  "copyright",
  "abuse",
  "nudity",
  "spam",
  "impersonation",
  "illegal",
  "other",
] as const;

const REASON_COLORS: Record<string, string> = {
  copyright: "bg-purple-100 text-purple-800 border-purple-200",
  abuse: "bg-red-100 text-red-800 border-red-200",
  nudity: "bg-orange-100 text-orange-800 border-orange-200",
  spam: "bg-yellow-100 text-yellow-800 border-yellow-200",
  impersonation: "bg-blue-100 text-blue-800 border-blue-200",
  illegal: "bg-rose-100 text-rose-900 border-rose-200",
  other: "bg-surface-100 text-surface-700 border-surface-200",
};

const STATUS_ICONS: Record<string, string> = {
  all: "📋",
  pending: "⏳",
  reviewed: "✅",
  dismissed: "🚫",
  escalated: "🔺",
};

/* ------------------------------------------------------------------ */
/*  Reason Badge                                                       */
/* ------------------------------------------------------------------ */

function ReasonBadge({ reason }: { reason: string }) {
  const colors = REASON_COLORS[reason] || REASON_COLORS.other;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-micro font-medium border ${colors}`}
    >
      {reason}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Media Type Icon                                                    */
/* ------------------------------------------------------------------ */

function MediaTypeIcon({ type }: { type: string }) {
  if (type === "video") {
    return (
      <span title="Video" className="inline-flex items-center text-blue-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </span>
    );
  }
  return (
    <span title="Photo" className="inline-flex items-center text-emerald-600">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide-over Detail Panel                                            */
/* ------------------------------------------------------------------ */

function ReportDetailPanel({
  report,
  onClose,
  onAction,
  submitting,
}: {
  report: Report;
  onClose: () => void;
  onAction: (
    reportId: string,
    action: ReportAction,
    mediaAction: MediaAction,
    userAction: UserAction,
    notes: string
  ) => Promise<void>;
  submitting: boolean;
}) {
  const [action, setAction] = useState<ReportAction>("review");
  const [mediaAction, setMediaAction] = useState<MediaAction>("none");
  const [userAction, setUserAction] = useState<UserAction>("none");
  const [notes, setNotes] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAction(report.id, action, mediaAction, userAction, notes);
  };

  const isPending = report.status === "pending";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-xl bg-white shadow-2xl animate-slide-in-right flex flex-col h-full"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div>
            <h2 className="text-title text-surface-900">Report Details</h2>
            <p className="text-micro text-surface-500 mt-0.5">
              ID: {report.id.slice(0, 12)}…
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Reporter Info */}
          <section>
            <h3 className="text-micro font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Reporter
            </h3>
            <div className="flex items-center gap-3">
              <Avatar
                src={report.reporter?.avatarUrl}
                name={report.reporter?.displayName || report.reporter?.username}
                size="md"
              />
              <div>
                <p className="text-caption font-medium text-surface-900">
                  {report.reporter?.displayName || report.reporter?.username || "Anonymous"}
                </p>
                {report.reporter?.username && (
                  <p className="text-micro text-surface-500">
                    @{report.reporter.username}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Content Preview */}
          <section>
            <h3 className="text-micro font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Reported Content
            </h3>
            {report.media ? (
              <div className="space-y-3">
                {report.media.thumbnailUrl ? (
                  <div className="rounded-xl overflow-hidden border border-surface-200 bg-surface-50">
                    {report.media.type === "video" ? (
                      <div className="relative">
                        <img
                          src={report.media.thumbnailUrl}
                          alt={report.media.title || "Video thumbnail"}
                          className="w-full h-56 object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={report.media.thumbnailUrl}
                        alt={report.media.title || "Photo preview"}
                        className="w-full h-56 object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400">
                    No preview available
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MediaTypeIcon type={report.media.type} />
                    <span className="text-caption text-surface-700">
                      {report.media.title || "Untitled"}
                    </span>
                  </div>
                  <StatusBadge status={report.media.status} />
                </div>
              </div>
            ) : (
              <p className="text-caption text-surface-400 italic">
                Content not found or has been deleted
              </p>
            )}
          </section>

          {/* Report Reason & Description */}
          <section>
            <h3 className="text-micro font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Reason &amp; Description
            </h3>
            <div className="space-y-2">
              <ReasonBadge reason={report.reason} />
              {report.description ? (
                <p className="text-caption text-surface-700 whitespace-pre-wrap leading-relaxed">
                  {report.description}
                </p>
              ) : (
                <p className="text-caption text-surface-400 italic">
                  No description provided
                </p>
              )}
            </div>
          </section>

          {/* Content Owner Info */}
          {report.media?.user && (
            <section>
              <h3 className="text-micro font-semibold text-surface-500 uppercase tracking-wider mb-3">
                Content Owner
              </h3>
              <div className="flex items-center gap-3">
                <Avatar
                  src={report.media.user.avatarUrl}
                  name={report.media.user.displayName || report.media.user.username}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-caption font-medium text-surface-900 truncate">
                    {report.media.user.displayName || report.media.user.username}
                  </p>
                  <p className="text-micro text-surface-500">
                    @{report.media.user.username}
                  </p>
                </div>
                {report.media.user.isBanned && (
                  <span className="badge badge-danger">Banned</span>
                )}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section>
            <h3 className="text-micro font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Details
            </h3>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-micro text-surface-500">Status</dt>
                <dd className="mt-0.5">
                  <StatusBadge status={report.status} />
                </dd>
              </div>
              <div>
                <dt className="text-micro text-surface-500">Reported</dt>
                <dd className="text-caption text-surface-800 mt-0.5">
                  {new Date(report.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              {report.reviewedAt && (
                <div>
                  <dt className="text-micro text-surface-500">Reviewed</dt>
                  <dd className="text-caption text-surface-800 mt-0.5">
                    {new Date(report.reviewedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Action Form */}
          {isPending && (
            <section className="border-t border-surface-200 pt-5">
              <h3 className="text-micro font-semibold text-surface-500 uppercase tracking-wider mb-4">
                Take Action
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Report Decision */}
                <fieldset>
                  <legend className="text-caption font-medium text-surface-800 mb-2">
                    Report Decision
                  </legend>
                  <div className="flex gap-2">
                    {(
                      [
                        ["review", "Review", "Mark as reviewed", "bg-emerald-50 border-emerald-300 text-emerald-800"],
                        ["dismiss", "Dismiss", "Not actionable", "bg-surface-50 border-surface-300 text-surface-700"],
                        ["escalate", "Escalate", "Needs escalation", "bg-amber-50 border-amber-300 text-amber-800"],
                      ] as const
                    ).map(([value, label, description, activeColor]) => (
                      <label
                        key={value}
                        className={`flex-1 cursor-pointer rounded-lg border p-3 transition-all ${
                          action === value
                            ? activeColor
                            : "border-surface-200 hover:border-surface-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="action"
                          value={value}
                          checked={action === value}
                          onChange={() => setAction(value)}
                          className="sr-only"
                        />
                        <p className="text-caption font-medium">{label}</p>
                        <p className="text-micro opacity-70">{description}</p>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Media Action */}
                <fieldset>
                  <legend className="text-caption font-medium text-surface-800 mb-2">
                    Media Action
                  </legend>
                  <div className="flex gap-2">
                    {(
                      [
                        ["none", "None"],
                        ["hide", "Hide Content"],
                        ["remove", "Remove Content"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center transition-all text-caption ${
                          mediaAction === value
                            ? value === "remove"
                              ? "bg-red-50 border-red-300 text-red-800 font-medium"
                              : value === "hide"
                                ? "bg-orange-50 border-orange-300 text-orange-800 font-medium"
                                : "bg-surface-50 border-surface-400 text-surface-800 font-medium"
                            : "border-surface-200 text-surface-600 hover:border-surface-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mediaAction"
                          value={value}
                          checked={mediaAction === value}
                          onChange={() => setMediaAction(value)}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* User Action */}
                <fieldset>
                  <legend className="text-caption font-medium text-surface-800 mb-2">
                    User Action
                  </legend>
                  <div className="flex gap-2">
                    {(
                      [
                        ["none", "None"],
                        ["warn", "Warn User"],
                        ["ban", "Ban User"],
                      ] as const
                    ).map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center transition-all text-caption ${
                          userAction === value
                            ? value === "ban"
                              ? "bg-red-50 border-red-300 text-red-800 font-medium"
                              : value === "warn"
                                ? "bg-amber-50 border-amber-300 text-amber-800 font-medium"
                                : "bg-surface-50 border-surface-400 text-surface-800 font-medium"
                            : "border-surface-200 text-surface-600 hover:border-surface-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="userAction"
                          value={value}
                          checked={userAction === value}
                          onChange={() => setUserAction(value)}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  {userAction === "ban" && (
                    <p className="text-micro text-red-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This will immediately ban the content uploader
                    </p>
                  )}
                </fieldset>

                {/* Moderator Notes */}
                <div>
                  <label
                    htmlFor="notes"
                    className="text-caption font-medium text-surface-800 block mb-2"
                  >
                    Moderator Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes about this decision…"
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-caption text-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-lg font-medium text-caption transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing…
                    </span>
                  ) : (
                    "Submit Decision"
                  )}
                </button>
              </form>
            </section>
          )}

          {/* Already Resolved */}
          {!isPending && (
            <section className="border-t border-surface-200 pt-5">
              <div className="rounded-lg bg-surface-50 border border-surface-200 px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-caption text-surface-600">
                  This report has already been <strong>{report.status}</strong>.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    pending: 0,
    reviewed: 0,
    dismissed: 0,
    escalated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  /* Fetch reports -------------------------------------------------- */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (reasonFilter) params.set("reason", reasonFilter);
      params.set("sort", sortOption);
      params.set("page", String(page));
      params.set("per_page", "20");

      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reports");

      const data = await res.json();
      setReports(data.reports || []);
      setCounts(data.counts || { total: 0, pending: 0, reviewed: 0, dismissed: 0, escalated: 0 });
      setTotalPages(data.totalPages || 1);
    } catch {
      toast("Failed to load reports", "error");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reasonFilter, sortOption, page, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, reasonFilter, sortOption]);

  /* Handle report action ------------------------------------------- */
  const handleAction = async (
    reportId: string,
    action: ReportAction,
    mediaAction: MediaAction,
    userAction: UserAction,
    notes: string
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, mediaAction, userAction, notes }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Action failed");
      }

      const data = await res.json();
      const updatedReport = data.report;

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, ...updatedReport }
            : r
        )
      );

      fetchReports();

      toast(`Report ${action === "review" ? "reviewed" : action === "dismiss" ? "dismissed" : "escalated"} successfully`, "success");
      setSelectedReport(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-display text-surface-900">
          Reports &amp; Trust Safety
        </h1>
        <p className="text-caption text-surface-500 mt-1">
          Review content reports, take moderation actions, and protect the community
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {(
          [
            ["all", "Total", counts.total, "bg-surface-100 text-surface-700"],
            ["pending", "Pending", counts.pending, "bg-amber-50 text-amber-700"],
            ["reviewed", "Reviewed", counts.reviewed, "bg-emerald-50 text-emerald-700"],
            ["dismissed", "Dismissed", counts.dismissed, "bg-surface-50 text-surface-600"],
            ["escalated", "Escalated", counts.escalated, "bg-red-50 text-red-700"],
          ] as const
        ).map(([key, label, count, color]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as StatusFilter)}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              statusFilter === key
                ? `${color} border-current ring-1 ring-current/20 shadow-sm`
                : "bg-white border-surface-200 hover:border-surface-300 hover:shadow-sm"
            }`}
          >
            <p className="text-micro text-surface-500">{STATUS_ICONS[key]} {label}</p>
            <p className="text-title font-bold mt-0.5">
              {loading && counts.total === 0 ? "—" : count}
            </p>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Reason Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="reason-filter" className="text-micro text-surface-500">
            Reason:
          </label>
          <select
            id="reason-filter"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-caption text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            <option value="">All reasons</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-option" className="text-micro text-surface-500">
            Sort:
          </label>
          <select
            id="sort-option"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-caption text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        {/* Active filter clear */}
        {(statusFilter !== "all" || reasonFilter) && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setReasonFilter("");
            }}
            className="text-micro text-brand hover:text-brand-dark transition-colors ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Reporter
                </th>
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Type
                </th>
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Preview
                </th>
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Reason
                </th>
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Description
                </th>
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Date
                </th>
                <th className="text-right text-micro text-surface-500 uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton variant="circular" width={28} height={28} />
                        <Skeleton variant="text" className="w-20" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><Skeleton variant="text" className="w-8" /></td>
                    <td className="px-4 py-3"><Skeleton variant="rectangular" width={48} height={36} /></td>
                    <td className="px-4 py-3"><Skeleton variant="text" className="w-16" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton variant="text" className="w-32" /></td>
                    <td className="px-4 py-3"><Skeleton variant="text" className="w-16" /></td>
                    <td className="px-4 py-3"><Skeleton variant="text" className="w-20" /></td>
                    <td className="px-4 py-3"><Skeleton variant="text" className="w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12">
                    <EmptyState
                      icon={
                        <svg className="w-12 h-12 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      }
                      title={
                        statusFilter !== "all" || reasonFilter
                          ? "No matching reports"
                          : "No reports yet"
                      }
                      description={
                        statusFilter !== "all" || reasonFilter
                          ? "Try adjusting your filters to see more reports"
                          : "Content reports from users will appear here"
                      }
                    />
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-surface-100 hover:bg-surface-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    {/* Reporter */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={report.reporter?.avatarUrl}
                          name={report.reporter?.displayName || report.reporter?.username}
                          size="xs"
                        />
                        <span className="text-caption text-surface-700 truncate max-w-[120px]">
                          {report.reporter?.displayName || report.reporter?.username || "Anonymous"}
                        </span>
                      </div>
                    </td>

                    {/* Media Type */}
                    <td className="px-4 py-3">
                      <MediaTypeIcon type={report.mediaType} />
                    </td>

                    {/* Content Preview */}
                    <td className="px-4 py-3">
                      {report.media?.thumbnailUrl ? (
                        <img
                          src={report.media.thumbnailUrl}
                          alt=""
                          className="w-12 h-9 rounded object-cover border border-surface-200"
                        />
                      ) : (
                        <div className="w-12 h-9 rounded bg-surface-100 border border-surface-200 flex items-center justify-center">
                          <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3">
                      <ReasonBadge reason={report.reason} />
                    </td>

                    {/* Description (hidden on small) */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-micro text-surface-500 truncate max-w-[200px]">
                        {report.description || "—"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-caption text-surface-500 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="btn btn-xs btn-ghost text-brand hover:text-brand-dark"
                      >
                        {report.status === "pending" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <p className="text-micro text-surface-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-xs btn-ghost disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-xs btn-ghost disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Panel */}
      {selectedReport && (
        <ReportDetailPanel
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={handleAction}
          submitting={submitting}
        />
      )}
    </div>
  );
}
