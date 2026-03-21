"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MediaUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface MediaItem {
  id: string;
  type: "photo" | "video";
  slug: string;
  title: string | null;
  altText: string | null;
  description: string | null;
  width: number;
  height: number;
  thumbnailUrl: string | null;
  status: string;
  isFeatured: boolean;
  isCurated: boolean;
  viewsCount: number;
  downloadsCount: number;
  likesCount: number;
  createdAt: string;
  tags: string[];
  user: MediaUser;
}

interface StatusCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface MediaResponse {
  items: MediaItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  counts: StatusCounts;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STATUSES = ["All", "Pending", "Processed", "Approved", "Rejected", "Removed"] as const;
const TYPES = ["All", "Photos", "Videos"] as const;
const DATE_RANGES = ["All Time", "Today", "This Week", "This Month"] as const;
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Most Views", value: "most_views" },
  { label: "Most Downloads", value: "most_downloads" },
] as const;
const PER_PAGE = 20;

// Date range → API param
function dateRangeParam(dr: string): string | undefined {
  if (dr === "Today") return "today";
  if (dr === "This Week") return "week";
  if (dr === "This Month") return "month";
  return undefined;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Icons (inline SVG helpers)
// ---------------------------------------------------------------------------
const Icons = {
  table: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  grid: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  search: (
    <svg className="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  image: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  imageLg: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  star: (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  starOutline: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  eye: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  download: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  chevronRight: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  filter: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  emptyMedia: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Component: Stat Card
// ---------------------------------------------------------------------------
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    default: "bg-surface-50 text-surface-900",
    pending: "bg-warning-50 text-warning-600",
    approved: "bg-brand-50 text-brand-600",
    rejected: "bg-danger-50 text-danger-600",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${colorClasses[color] || colorClasses.default}`}>
      <p className="text-micro font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-title font-bold mt-0.5">{formatNumber(value)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Thumbnail
// ---------------------------------------------------------------------------
function Thumbnail({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`bg-surface-100 overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-surface-400">
          {Icons.image}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdminMediaPage() {
  // State
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<StatusCounts>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: string;
    count: number;
  }>({ open: false, action: "", count: 0 });
  const [moderatorNote, setModeratorNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

  // Has any active filter?
  const hasFilters =
    debouncedSearch !== "" ||
    statusFilter !== "All" ||
    typeFilter !== "All" ||
    dateRange !== "All Time" ||
    sortBy !== "newest";

  // Fetch media
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (statusFilter !== "All") params.set("status", statusFilter.toLowerCase());
      if (typeFilter === "Photos") params.set("type", "photo");
      else if (typeFilter === "Videos") params.set("type", "video");
      const dr = dateRangeParam(dateRange);
      if (dr) params.set("dateRange", dr);
      params.set("sort", sortBy);
      params.set("page", String(page));
      params.set("per_page", String(PER_PAGE));

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      const data: MediaResponse = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setCounts(data.counts ?? { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, dateRange, sortBy, page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedSearch, statusFilter, typeFilter, dateRange, sortBy]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Escape closes detail panel
      if (e.key === "Escape") {
        if (detailItem) {
          setDetailItem(null);
          e.preventDefault();
        }
      }
      // "/" focuses search
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // "a" to approve, "r" to reject when detail panel open
      if (detailItem && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        if (e.key === "a") {
          handleSingleAction(detailItem.id, "approved");
        } else if (e.key === "r") {
          handleSingleAction(detailItem.id, "rejected");
        } else if (e.key === "f") {
          handleSingleAction(detailItem.id, detailItem.isFeatured ? "unfeatured" : "featured");
        } else if (e.key === "ArrowRight" || e.key === "j") {
          navigateDetail(1);
        } else if (e.key === "ArrowLeft" || e.key === "k") {
          navigateDetail(-1);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailItem, items]);

  // Navigate detail panel
  function navigateDetail(dir: 1 | -1) {
    if (!detailItem) return;
    const idx = items.findIndex((i) => i.id === detailItem.id);
    const next = items[idx + dir];
    if (next) setDetailItem(next);
  }

  // Selection helpers
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  // Clear all filters
  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setDateRange("All Time");
    setSortBy("newest");
  }

  // Single item action
  async function handleSingleAction(id: string, action: string) {
    setActionLoading(true);
    try {
      if (action === "approved" || action === "rejected") {
        const endpoint = action === "approved" ? "approve" : "reject";
        const body: any = {};
        if (action === "rejected" && moderatorNote) body.reason = moderatorNote;
        const res = await fetch(`/api/admin/media/${id}/${endpoint}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/admin/media/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id], action }),
        });
        if (!res.ok) throw new Error();
      }

      // Optimistic update
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          if (action === "approved" || action === "rejected" || action === "removed") {
            return { ...item, status: action };
          }
          if (action === "featured") return { ...item, isFeatured: true };
          if (action === "unfeatured") return { ...item, isFeatured: false };
          return item;
        })
      );
      if (detailItem?.id === id) {
        setDetailItem((prev) => {
          if (!prev) return prev;
          if (action === "approved" || action === "rejected" || action === "removed") {
            return { ...prev, status: action };
          }
          if (action === "featured") return { ...prev, isFeatured: true };
          if (action === "unfeatured") return { ...prev, isFeatured: false };
          return prev;
        });
      }

      toast(`Item ${action}`, "success");
    } catch {
      toast("Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // Bulk actions
  async function handleBulkAction(action: string) {
    if (selected.size === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/media/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) =>
        prev.map((item) => {
          if (!selected.has(item.id)) return item;
          if (action === "approved" || action === "rejected" || action === "removed") {
            return { ...item, status: action };
          }
          if (action === "featured") return { ...item, isFeatured: true };
          if (action === "unfeatured") return { ...item, isFeatured: false };
          return item;
        })
      );
      toast(`${selected.size} item(s) ${action}`, "success");
      setSelected(new Set());
    } catch {
      toast("Bulk action failed", "error");
    } finally {
      setActionLoading(false);
      setConfirmModal({ open: false, action: "", count: 0 });
    }
  }

  // Pagination numbers
  function pageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="relative">
      {/* ---------------------------------------------------------------- */}
      {/* Header */}
      {/* ---------------------------------------------------------------- */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-display text-surface-900">Media Management</h1>
            <p className="text-caption text-surface-500 mt-1">
              Review, moderate, and manage all uploaded media
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => setView("table")}
              className={`btn btn-sm ${view === "table" ? "bg-white shadow-xs text-surface-900" : "btn-ghost text-surface-500"}`}
              title="Table view"
            >
              {Icons.table}
              <span className="ml-1.5 text-micro hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setView("grid")}
              className={`btn btn-sm ${view === "grid" ? "bg-white shadow-xs text-surface-900" : "btn-ghost text-surface-500"}`}
              title="Grid view"
            >
              {Icons.grid}
              <span className="ml-1.5 text-micro hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Media" value={counts.total} color="default" />
          <StatCard label="Pending" value={counts.pending} color="pending" />
          <StatCard label="Approved" value={counts.approved} color="approved" />
          <StatCard label="Rejected" value={counts.rejected} color="rejected" />
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Filter bar */}
      {/* ---------------------------------------------------------------- */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {Icons.search}
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, tag, photographer…"
              className="input pl-10 w-full"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-36"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input w-28"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-36"
          >
            {DATE_RANGES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-40"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-sm btn-ghost text-surface-500">
              {Icons.x}
              <span className="ml-1">Clear</span>
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="mt-3 flex items-center justify-between text-micro text-surface-500">
          <span>
            {loading ? "Loading…" : `${total.toLocaleString()} result${total !== 1 ? "s" : ""}`}
          </span>
          <span className="hidden sm:inline text-micro text-surface-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 font-mono text-[10px]">/</kbd> to search
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Bulk Actions Bar */}
      {/* ---------------------------------------------------------------- */}
      {selected.size > 0 && (
        <div className="card p-3 mb-4 bg-brand-50 border border-brand-200 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption font-medium text-brand-800">
              {selected.size} item{selected.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() =>
                  setConfirmModal({ open: true, action: "approved", count: selected.size })
                }
                className="btn btn-sm btn-primary"
              >
                {Icons.check}
                <span className="ml-1">Approve</span>
              </button>
              <button
                onClick={() =>
                  setConfirmModal({ open: true, action: "rejected", count: selected.size })
                }
                className="btn btn-sm btn-danger"
              >
                {Icons.x}
                <span className="ml-1">Reject</span>
              </button>
              <button
                onClick={() =>
                  setConfirmModal({ open: true, action: "featured", count: selected.size })
                }
                className="btn btn-sm btn-ghost"
              >
                {Icons.star}
                <span className="ml-1">Feature</span>
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="btn btn-sm btn-ghost text-surface-500"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Table View */}
      {/* ---------------------------------------------------------------- */}
      {view === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selected.size === items.length}
                      onChange={toggleSelectAll}
                      className="rounded border-surface-300"
                    />
                  </th>
                  <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Thumbnail</th>
                  <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Title / Alt</th>
                  <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Photographer</th>
                  <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Dimensions</th>
                  <th className="text-right text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Views</th>
                  <th className="text-right text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Downloads</th>
                  <th className="text-center text-micro text-surface-500 uppercase tracking-wider px-4 py-3">★</th>
                  <th className="text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-right text-micro text-surface-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-surface-100">
                      <td className="px-4 py-3"><Skeleton variant="rectangular" className="w-4 h-4 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton variant="rectangular" className="w-14 h-10 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-32" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-20" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-16" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-20" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-12 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-12 ml-auto" /></td>
                      <td className="px-4 py-3"><Skeleton variant="circular" className="w-4 h-4 mx-auto" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-20" /></td>
                      <td className="px-4 py-3"><Skeleton variant="text" className="w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8">
                      <EmptyState
                        icon={Icons.emptyMedia}
                        title="No media found"
                        description={
                          hasFilters
                            ? "Try adjusting your search or filters"
                            : "No media has been uploaded yet"
                        }
                        action={
                          hasFilters ? (
                            <button onClick={clearFilters} className="btn btn-sm btn-primary">
                              Clear Filters
                            </button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-surface-100 hover:bg-surface-50 transition-colors cursor-pointer ${
                        selected.has(item.id) ? "bg-brand-50/40" : ""
                      }`}
                      onClick={() => setDetailItem(item)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-surface-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Thumbnail src={item.thumbnailUrl} alt={item.altText || ""} className="w-14 h-10 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-caption font-medium text-surface-900 truncate max-w-[200px]">
                          {item.title || item.altText || "Untitled"}
                        </p>
                        {item.altText && item.title !== item.altText && (
                          <p className="text-micro text-surface-500 truncate max-w-[200px]">{item.altText}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.user.avatarUrl ? (
                            <img src={item.user.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-surface-200 flex items-center justify-center text-micro text-surface-500">
                              {(item.user.displayName || item.user.username || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-caption text-surface-600 truncate max-w-[120px]">
                            {item.user.displayName || item.user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-caption text-surface-500 whitespace-nowrap">
                        {item.width}×{item.height}
                      </td>
                      <td className="px-4 py-3 text-caption text-surface-500 text-right tabular-nums">
                        {formatNumber(item.viewsCount)}
                      </td>
                      <td className="px-4 py-3 text-caption text-surface-500 text-right tabular-nums">
                        {formatNumber(item.downloadsCount)}
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSingleAction(item.id, item.isFeatured ? "unfeatured" : "featured")}
                          className={`transition-colors ${item.isFeatured ? "text-warning-500" : "text-surface-300 hover:text-warning-400"}`}
                          title={item.isFeatured ? "Remove from featured" : "Add to featured"}
                        >
                          {item.isFeatured ? Icons.star : Icons.starOutline}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-caption text-surface-500 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setDetailItem(item)}
                            className="btn btn-xs btn-ghost"
                            title="View details"
                          >
                            {Icons.eye}
                          </button>
                          {item.status !== "approved" && (
                            <button
                              onClick={() => handleSingleAction(item.id, "approved")}
                              className="btn btn-xs btn-ghost text-brand-600"
                              title="Approve"
                            >
                              {Icons.check}
                            </button>
                          )}
                          {item.status !== "rejected" && (
                            <button
                              onClick={() => handleSingleAction(item.id, "rejected")}
                              className="btn btn-xs btn-ghost text-danger-500"
                              title="Reject"
                            >
                              {Icons.x}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Grid View */}
      {/* ---------------------------------------------------------------- */}
      {view === "grid" && (
        <div>
          {loading ? (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {Array.from({ length: 12 }).map((_, i) => {
                const heights = [160, 200, 240, 180, 220, 260];
                return (
                  <div key={i} className="break-inside-avoid card p-0 overflow-hidden">
                    <Skeleton variant="rectangular" className="w-full" height={heights[i % 6]} />
                    <div className="p-3 space-y-2">
                      <Skeleton variant="text" className="w-3/4" />
                      <Skeleton variant="text" className="w-1/2" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Icons.emptyMedia}
              title="No media found"
              description={
                hasFilters
                  ? "Try adjusting your search or filters"
                  : "No media has been uploaded yet"
              }
              action={
                hasFilters ? (
                  <button onClick={clearFilters} className="btn btn-sm btn-primary">
                    Clear Filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`break-inside-avoid card p-0 overflow-hidden cursor-pointer transition-all hover:shadow-card-hover ${
                    selected.has(item.id) ? "ring-2 ring-brand-500" : ""
                  }`}
                  onClick={() => setDetailItem(item)}
                >
                  <div className="relative group">
                    <div
                      className="w-full bg-surface-100"
                      style={{ aspectRatio: `${item.width} / ${item.height}` }}
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.altText || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-surface-400">
                          {Icons.imageLg}
                        </div>
                      )}
                    </div>

                    {/* Overlays */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <StatusBadge status={item.status} />
                      {item.isFeatured && (
                        <span className="badge badge-warning text-micro">★ Featured</span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-neutral text-micro">{item.type}</span>
                    </div>

                    {/* Selection checkbox */}
                    <div className="absolute bottom-2 left-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-surface-300 w-4 h-4"
                      />
                    </div>

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {item.status !== "approved" && (
                          <button
                            onClick={() => handleSingleAction(item.id, "approved")}
                            className="btn btn-xs bg-white/90 hover:bg-white text-brand-600"
                            title="Approve"
                          >
                            {Icons.check}
                          </button>
                        )}
                        {item.status !== "rejected" && (
                          <button
                            onClick={() => handleSingleAction(item.id, "rejected")}
                            className="btn btn-xs bg-white/90 hover:bg-white text-danger-500"
                            title="Reject"
                          >
                            {Icons.x}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-caption font-medium text-surface-900 truncate">
                      {item.title || item.altText || "Untitled"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {item.user.avatarUrl ? (
                        <img src={item.user.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-surface-200 flex items-center justify-center text-[9px] text-surface-500">
                          {(item.user.displayName || item.user.username || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-micro text-surface-500 truncate">
                        {item.user.displayName || item.user.username}
                      </span>
                      <span className="text-micro text-surface-400">·</span>
                      <span className="text-micro text-surface-400">{formatDate(item.createdAt)}</span>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="chip chip-sm">{tag}</span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-micro text-surface-400">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Pagination */}
      {/* ---------------------------------------------------------------- */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-micro text-surface-500">
            Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-sm btn-ghost disabled:opacity-50"
            >
              Previous
            </button>
            {pageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`e-${i}`} className="px-2 text-surface-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`btn btn-sm min-w-[36px] ${p === page ? "btn-primary" : "btn-ghost"}`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-sm btn-ghost disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Detail / Review Slide-over Panel */}
      {/* ---------------------------------------------------------------- */}
      {detailItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setDetailItem(null)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-modal z-50 flex flex-col animate-slide-in-right overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div className="flex items-center gap-3">
                <h2 className="text-subtitle text-surface-900">Media Details</h2>
                <StatusBadge status={detailItem.status} />
                {detailItem.isFeatured && (
                  <span className="badge badge-warning text-micro">★ Featured</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Navigate prev/next */}
                <button
                  onClick={() => navigateDetail(-1)}
                  disabled={items.findIndex((i) => i.id === detailItem.id) === 0}
                  className="btn btn-sm btn-ghost disabled:opacity-30 rotate-180"
                  title="Previous (←/K)"
                >
                  {Icons.chevronRight}
                </button>
                <button
                  onClick={() => navigateDetail(1)}
                  disabled={items.findIndex((i) => i.id === detailItem.id) === items.length - 1}
                  className="btn btn-sm btn-ghost disabled:opacity-30"
                  title="Next (→/J)"
                >
                  {Icons.chevronRight}
                </button>
                <button onClick={() => setDetailItem(null)} className="btn btn-sm btn-ghost ml-1" title="Close (Esc)">
                  {Icons.close}
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto">
              {/* Image preview */}
              <div className="bg-surface-100">
                {detailItem.thumbnailUrl ? (
                  <img
                    src={detailItem.thumbnailUrl}
                    alt={detailItem.altText || ""}
                    className="w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <div className="w-full h-60 flex items-center justify-center text-surface-400">
                    {Icons.imageLg}
                  </div>
                )}
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Title & Description */}
                <div>
                  <h3 className="text-title text-surface-900">
                    {detailItem.title || detailItem.altText || "Untitled"}
                  </h3>
                  {detailItem.description && (
                    <p className="text-caption text-surface-600 mt-1">{detailItem.description}</p>
                  )}
                </div>

                {/* Photographer */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-50">
                  {detailItem.user.avatarUrl ? (
                    <img src={detailItem.user.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center text-subtitle text-surface-500">
                      {(detailItem.user.displayName || detailItem.user.username || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-caption font-medium text-surface-900">
                      {detailItem.user.displayName || detailItem.user.username}
                    </p>
                    <p className="text-micro text-surface-500">@{detailItem.user.username}</p>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <MetaField label="Type" value={detailItem.type === "photo" ? "Photo" : "Video"} />
                  <MetaField label="Dimensions" value={`${detailItem.width} × ${detailItem.height}`} />
                  <MetaField label="Views" value={formatNumber(detailItem.viewsCount)} />
                  <MetaField label="Downloads" value={formatNumber(detailItem.downloadsCount)} />
                  <MetaField label="Likes" value={formatNumber(detailItem.likesCount)} />
                  <MetaField label="Uploaded" value={formatDateTime(detailItem.createdAt)} />
                  <MetaField label="Slug" value={detailItem.slug} />
                  <MetaField label="ID" value={detailItem.id} />
                </div>

                {/* Tags */}
                {detailItem.tags.length > 0 && (
                  <div>
                    <p className="text-micro font-medium text-surface-500 uppercase tracking-wider mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailItem.tags.map((tag) => (
                        <span key={tag} className="chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderator notes */}
                <div>
                  <p className="text-micro font-medium text-surface-500 uppercase tracking-wider mb-2">Moderator Notes</p>
                  <textarea
                    value={moderatorNote}
                    onChange={(e) => setModeratorNote(e.target.value)}
                    placeholder="Add a note for this media item…"
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="rounded-lg bg-surface-50 p-3">
                  <p className="text-micro font-medium text-surface-500 mb-1.5">Keyboard Shortcuts</p>
                  <div className="grid grid-cols-2 gap-1 text-micro text-surface-500">
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-200 text-[10px] font-mono">A</kbd> Approve</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-200 text-[10px] font-mono">R</kbd> Reject</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-200 text-[10px] font-mono">F</kbd> Feature</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-200 text-[10px] font-mono">Esc</kbd> Close</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-200 text-[10px] font-mono">←</kbd> Previous</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-surface-200 text-[10px] font-mono">→</kbd> Next</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel footer — action buttons */}
            <div className="border-t border-surface-200 px-6 py-4 flex items-center gap-2 bg-white">
              <button
                onClick={() => handleSingleAction(detailItem.id, "approved")}
                disabled={actionLoading || detailItem.status === "approved"}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {Icons.check}
                <span className="ml-1.5">Approve</span>
              </button>
              <button
                onClick={() => handleSingleAction(detailItem.id, "rejected")}
                disabled={actionLoading || detailItem.status === "rejected"}
                className="btn btn-danger flex-1 disabled:opacity-50"
              >
                {Icons.x}
                <span className="ml-1.5">Reject</span>
              </button>
              <button
                onClick={() =>
                  handleSingleAction(detailItem.id, detailItem.isFeatured ? "unfeatured" : "featured")
                }
                disabled={actionLoading}
                className={`btn btn-ghost ${detailItem.isFeatured ? "text-warning-500" : ""}`}
                title={detailItem.isFeatured ? "Remove from featured" : "Feature"}
              >
                {detailItem.isFeatured ? Icons.star : Icons.starOutline}
              </button>
              <button
                onClick={() => handleSingleAction(detailItem.id, "removed")}
                disabled={actionLoading || detailItem.status === "removed"}
                className="btn btn-ghost text-danger-500"
                title="Remove"
              >
                {Icons.x}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Confirmation Modal */}
      {/* ---------------------------------------------------------------- */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: "", count: 0 })}
        title="Confirm Bulk Action"
        size="sm"
      >
        <p className="text-caption text-surface-600 mb-4">
          Are you sure you want to <strong>{confirmModal.action}</strong>{" "}
          {confirmModal.count} item{confirmModal.count > 1 ? "s" : ""}?
          This action will be applied immediately.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setConfirmModal({ open: false, action: "", count: 0 })}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={() => handleBulkAction(confirmModal.action)}
            disabled={actionLoading}
            className={`btn ${
              confirmModal.action === "rejected" || confirmModal.action === "removed"
                ? "btn-danger"
                : "btn-primary"
            } disabled:opacity-50`}
          >
            {actionLoading ? "Processing…" : `Yes, ${confirmModal.action}`}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metadata field helper
// ---------------------------------------------------------------------------
function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-micro text-surface-500">{label}</p>
      <p className="text-caption text-surface-900 truncate" title={value}>{value}</p>
    </div>
  );
}