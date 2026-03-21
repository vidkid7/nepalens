"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

/* ───────── Types ───────── */

interface AuditUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
  user: AuditUser;
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/* ───────── Constants ───────── */

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "user", label: "User Management" },
  { value: "taxonomy", label: "Taxonomy" },
  { value: "moderation", label: "Moderation" },
  { value: "settings", label: "Settings" },
  { value: "content", label: "Content Update" },
  { value: "media", label: "Media" },
  { value: "report", label: "Reports" },
];

const TARGET_OPTIONS = [
  { value: "", label: "All Targets" },
  { value: "photo", label: "Photo" },
  { value: "video", label: "Video" },
  { value: "user", label: "User" },
  { value: "collection", label: "Collection" },
  { value: "challenge", label: "Challenge" },
  { value: "category", label: "Category" },
  { value: "tag", label: "Tag" },
  { value: "system", label: "System" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const ACTION_BADGE_MAP: Record<string, { class: string; label: string }> = {
  login: { class: "badge-info", label: "Login" },
  "login.success": { class: "badge-info", label: "Login" },
  "login.failed": { class: "badge-warning", label: "Login Failed" },
  "user.ban": { class: "badge-danger", label: "Ban User" },
  "user.unban": { class: "badge-success", label: "Unban User" },
  "user.verify": { class: "badge-success", label: "Verify User" },
  "user.unverify": { class: "badge-warning", label: "Unverify" },
  "user.make-admin": { class: "badge-brand", label: "Grant Admin" },
  "user.remove-admin": { class: "badge-danger", label: "Revoke Admin" },
  "user.make-contributor": { class: "badge-success", label: "Grant Contributor" },
  "user.remove-contributor": { class: "badge-warning", label: "Revoke Contributor" },
  "taxonomy.create": { class: "badge-success", label: "Create" },
  "taxonomy.update": { class: "badge-info", label: "Update" },
  "taxonomy.delete": { class: "badge-danger", label: "Delete" },
  "moderation.approve": { class: "badge-success", label: "Approve" },
  "moderation.reject": { class: "badge-danger", label: "Reject" },
  "moderation.flag": { class: "badge-warning", label: "Flag" },
  "content.update": { class: "badge-info", label: "Content Update" },
  "settings.update": { class: "badge-neutral", label: "Settings" },
  "media.delete": { class: "badge-danger", label: "Delete Media" },
  "report.resolve": { class: "badge-success", label: "Resolve Report" },
};

const TH =
  "px-4 py-3 text-left text-micro font-semibold text-surface-500 uppercase tracking-wider";
const TD = "px-4 py-3 text-caption text-surface-700";
const PER_PAGE = 25;

/* ───────── Helpers ───────── */

function getActionBadge(action: string) {
  const exact = ACTION_BADGE_MAP[action];
  if (exact) return exact;

  const prefix = action.split(".")[0];
  const prefixMatch = ACTION_BADGE_MAP[prefix];
  if (prefixMatch)
    return { ...prefixMatch, label: action.replace(/\./g, " › ") };

  return { class: "badge-neutral", label: action };
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-surface-100 animate-pulse">
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-surface-200 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ───────── Icons ───────── */

function IconSearch() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/* ───────── Main Page ───────── */

export default function AdminAuditPage() {
  const { toast } = useToast();

  // Data
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (actionFilter) params.set("action", actionFilter);
      if (targetFilter) params.set("targetType", targetFilter);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("per_page", String(PER_PAGE));

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: AuditResponse = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, actionFilter, targetFilter, sort, page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Toggle row expand
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reset filters
  const hasActiveFilters =
    debouncedSearch || actionFilter || targetFilter || sort !== "newest";

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setActionFilter("");
    setTargetFilter("");
    setSort("newest");
    setPage(1);
  };

  /* ═══════════════════ RENDER ═══════════════════ */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-surface-900">Audit Logs</h1>
          <p className="text-caption text-surface-500 mt-1">
            Track all administrative actions across the platform.
            {total > 0 && (
              <span className="ml-2 text-surface-400">
                {total.toLocaleString()} total entries
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => toast("Export functionality coming soon", "info")}
        >
          <IconDownload /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              <IconSearch />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, user, target ID or IP…"
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto min-w-[160px]"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={targetFilter}
            onChange={(e) => {
              setTargetFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto min-w-[150px]"
          >
            {TARGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="input w-auto min-w-[140px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn btn-ghost btn-sm">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className={TH} style={{ width: 30 }} />
                <th className={TH}>Timestamp</th>
                <th className={TH}>User</th>
                <th className={TH}>Action</th>
                <th className={TH}>Target</th>
                <th className={TH}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4 text-surface-400">
                        <IconClock />
                      </div>
                      <h3 className="text-subtitle text-surface-700 mb-1">
                        {hasActiveFilters
                          ? "No logs match your filters"
                          : "No audit logs yet"}
                      </h3>
                      <p className="text-caption text-surface-500 max-w-sm">
                        {hasActiveFilters
                          ? "Try adjusting your search or filters."
                          : "Audit logs will appear here as administrative actions are performed."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={resetFilters}
                          className="btn btn-secondary btn-sm mt-4"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const isExpanded = expandedRows.has(log.id);
                  const hasDetails =
                    log.details && Object.keys(log.details).length > 0;

                  return (
                    <tr key={log.id} className="group">
                      {/* Main row */}
                      <td className={`${TD} border-b border-surface-100`}>
                        {hasDetails && (
                          <button
                            onClick={() => toggleRow(log.id)}
                            className="btn btn-ghost btn-icon p-0.5 transition-transform"
                            style={{
                              transform: isExpanded
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                            }}
                            title="View details"
                          >
                            <IconChevronRight />
                          </button>
                        )}
                      </td>
                      <td
                        className={`${TD} border-b border-surface-100 whitespace-nowrap`}
                      >
                        <span className="text-micro text-surface-600">
                          {formatTimestamp(log.createdAt)}
                        </span>
                      </td>
                      <td className={`${TD} border-b border-surface-100`}>
                        <div className="flex items-center gap-2">
                          {log.user.avatarUrl ? (
                            <img
                              src={log.user.avatarUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-micro font-semibold">
                              {(
                                log.user.displayName ||
                                log.user.username ||
                                "?"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-micro font-medium text-surface-900 truncate">
                              {log.user.displayName || log.user.username}
                            </p>
                            {log.user.displayName && (
                              <p className="text-micro text-surface-400 truncate">
                                @{log.user.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`${TD} border-b border-surface-100`}>
                        <span className={`badge ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className={`${TD} border-b border-surface-100`}>
                        {log.targetType && (
                          <div className="flex items-center gap-1.5">
                            <span className="badge badge-neutral">
                              {log.targetType}
                            </span>
                            {log.targetId && (
                              <code className="text-micro text-surface-500 bg-surface-100 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                                {log.targetId}
                              </code>
                            )}
                          </div>
                        )}
                        {!log.targetType && (
                          <span className="text-surface-400 text-micro italic">
                            —
                          </span>
                        )}
                      </td>
                      <td
                        className={`${TD} border-b border-surface-100 whitespace-nowrap`}
                      >
                        {log.ipAddress ? (
                          <code className="text-micro text-surface-500">
                            {log.ipAddress}
                          </code>
                        ) : (
                          <span className="text-surface-400 text-micro italic">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded detail rows rendered below the table for simplicity */}
        {logs.some((log) => expandedRows.has(log.id)) && (
          <div className="border-t border-surface-200">
            {logs
              .filter((log) => expandedRows.has(log.id))
              .map((log) => (
                <div
                  key={`detail-${log.id}`}
                  className="p-4 bg-surface-50 border-b border-surface-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-micro font-semibold text-surface-600 uppercase tracking-wider">
                      Details — {log.action}
                    </h4>
                    <button
                      onClick={() => toggleRow(log.id)}
                      className="text-micro text-surface-400 hover:text-surface-600"
                    >
                      Close
                    </button>
                  </div>
                  <pre className="text-micro text-surface-700 bg-white border border-surface-200 rounded-lg p-3 overflow-x-auto max-h-64">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50">
            <p className="text-micro text-surface-500">
              Showing {(page - 1) * PER_PAGE + 1}–
              {Math.min(page * PER_PAGE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-ghost btn-sm disabled:opacity-40"
              >
                Previous
              </button>
              {generatePageNumbers(page, totalPages).map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-surface-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`btn btn-sm min-w-[36px] ${
                      p === page
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-ghost btn-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Pagination helper ───────── */

function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
