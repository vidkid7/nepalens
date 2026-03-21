"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Skeleton from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import Dropdown, { DropdownItem, DropdownDivider } from "@/components/ui/Dropdown";
import { useToast } from "@/components/ui/Toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserCounts {
  photos: number;
  videos: number;
  downloads: number;
  reports: number;
  collections?: number;
}

interface User {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  coverUrl?: string | null;
  isAdmin: boolean;
  isContributor: boolean;
  isVerified: boolean;
  isBanned: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  _count: UserCounts;
  totalViews?: number;
  totalDownloads?: number;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

type RoleFilter = "all" | "admin" | "contributor" | "regular";
type StatusFilter = "all" | "active" | "banned" | "verified";
type SortOption = "newest" | "oldest" | "most-uploads" | "most-downloads";
type UserAction =
  | "ban"
  | "unban"
  | "verify"
  | "unverify"
  | "make-admin"
  | "remove-admin"
  | "make-contributor"
  | "remove-contributor";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "contributor", label: "Contributor" },
  { value: "regular", label: "Regular" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
  { value: "verified", label: "Verified" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "most-uploads", label: "Most Uploads" },
  { value: "most-downloads", label: "Most Downloads" },
];

const ACTION_LABELS: Record<UserAction, string> = {
  ban: "Ban User",
  unban: "Unban User",
  verify: "Verify User",
  unverify: "Remove Verification",
  "make-admin": "Grant Admin Role",
  "remove-admin": "Remove Admin Role",
  "make-contributor": "Grant Contributor Role",
  "remove-contributor": "Remove Contributor Role",
};

const DESTRUCTIVE_ACTIONS: UserAction[] = [
  "ban",
  "make-admin",
  "remove-admin",
  "unverify",
];

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG to avoid external deps)                          */
/* ------------------------------------------------------------------ */

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function EllipsisIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ExportIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CameraIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function VideoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function LinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function roleBadges(user: User) {
  const badges: { label: string; className: string }[] = [];
  if (user.isAdmin) badges.push({ label: "Admin", className: "badge-brand" });
  if (user.isVerified) badges.push({ label: "Verified", className: "badge-info" });
  if (user.isContributor) badges.push({ label: "Contributor", className: "badge-success" });
  if (user.isBanned) badges.push({ label: "Banned", className: "badge-danger" });
  return badges;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FilterSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="input text-caption py-2"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ---- Confirmation Dialog ---- */

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} size="sm" title={title}>
      <p className="text-caption text-surface-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ---- User Detail Slide-Over ---- */

function UserSlideOver({
  user,
  open,
  onClose,
  onAction,
  actionLoading,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onAction: (userId: string, action: UserAction) => void;
  actionLoading: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !user) return null;

  const stats = [
    { label: "Photos", value: user._count.photos, icon: <CameraIcon className="w-4 h-4" /> },
    { label: "Videos", value: user._count.videos, icon: <VideoIcon className="w-4 h-4" /> },
    { label: "Followers", value: user.followersCount },
    { label: "Following", value: user.followingCount },
    { label: "Downloads", value: user.totalDownloads ?? 0 },
    { label: "Views", value: user.totalViews ?? 0 },
  ];

  return (
    <div className="fixed inset-0 z-modal flex">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="ml-auto relative w-full max-w-lg bg-white shadow-modal h-full flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <h2 className="text-subtitle text-surface-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <Avatar src={user.avatarUrl} name={user.displayName || user.username} size="xl" />
              <div className="flex-1 min-w-0">
                <h3 className="text-title text-surface-900 truncate">
                  {user.displayName || user.username}
                </h3>
                <p className="text-caption text-surface-500">@{user.username}</p>
                <p className="text-caption text-surface-500 mt-0.5">{user.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {roleBadges(user).map((b) => (
                    <span key={b.label} className={`badge ${b.className}`}>
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {user.bio && (
              <p className="text-caption text-surface-600 mt-4 leading-relaxed">{user.bio}</p>
            )}
            {(user.location || user.websiteUrl) && (
              <div className="flex flex-wrap gap-4 mt-3 text-micro text-surface-500">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {user.location}
                  </span>
                )}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Stats grid */}
          <div className="px-6 py-4">
            <h4 className="text-label text-surface-500 uppercase tracking-wider mb-3">Statistics</h4>
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-surface-50 rounded-xl p-3 text-center">
                  <p className="text-title text-surface-900">{formatNumber(s.value)}</p>
                  <p className="text-micro text-surface-500 mt-0.5 flex items-center justify-center gap-1">
                    {s.icon}
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />

          {/* Account timeline */}
          <div className="px-6 py-4">
            <h4 className="text-label text-surface-500 uppercase tracking-wider mb-3">Account Timeline</h4>
            <div className="space-y-2.5">
              <div className="flex justify-between text-caption">
                <span className="text-surface-500">Joined</span>
                <span className="text-surface-700 font-medium">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span className="text-surface-500">Last Active</span>
                <span className="text-surface-700 font-medium">{formatDateTime(user.lastLoginAt)}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span className="text-surface-500">Last Updated</span>
                <span className="text-surface-700 font-medium">{formatDateTime(user.updatedAt)}</span>
              </div>
              <div className="flex justify-between text-caption">
                <span className="text-surface-500">Status</span>
                <StatusBadge status={user.isBanned ? "banned" : "active"} />
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Quick links */}
          <div className="px-6 py-4">
            <h4 className="text-label text-surface-500 uppercase tracking-wider mb-3">Quick Links</h4>
            <div className="space-y-2">
              <a
                href={`/@${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-caption text-brand-600 hover:text-brand-700 hover:underline"
              >
                <LinkIcon /> View Public Profile
              </a>
              <a
                href={`/@${user.username}?tab=photos`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-caption text-brand-600 hover:text-brand-700 hover:underline"
              >
                <LinkIcon /> View Uploads
              </a>
              <a
                href={`/admin/reports?user=${user.username}`}
                className="flex items-center gap-2 text-caption text-brand-600 hover:text-brand-700 hover:underline"
              >
                <LinkIcon /> View Reports Against User ({user._count.reports})
              </a>
            </div>
          </div>

          <div className="divider" />

          {/* Actions */}
          <div className="px-6 py-4">
            <h4 className="text-label text-surface-500 uppercase tracking-wider mb-3">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {user.isBanned ? (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onAction(user.id, "unban")}
                  disabled={actionLoading}
                >
                  Unban User
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onAction(user.id, "ban")}
                  disabled={actionLoading}
                >
                  Ban User
                </button>
              )}
              {user.isVerified ? (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onAction(user.id, "unverify")}
                  disabled={actionLoading}
                >
                  Remove Verification
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onAction(user.id, "verify")}
                  disabled={actionLoading}
                >
                  Verify User
                </button>
              )}
              {user.isContributor ? (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onAction(user.id, "remove-contributor")}
                  disabled={actionLoading}
                >
                  Remove Contributor
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => onAction(user.id, "make-contributor")}
                  disabled={actionLoading}
                >
                  Make Contributor
                </button>
              )}
              {user.isAdmin ? (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => onAction(user.id, "remove-admin")}
                  disabled={actionLoading}
                >
                  Remove Admin
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => onAction(user.id, "make-admin")}
                  disabled={actionLoading}
                >
                  Make Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Table Skeleton ---- */

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-surface-100">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton variant="circular" className="w-8 h-8" />
              <div className="space-y-1.5">
                <Skeleton variant="text" className="w-28" />
                <Skeleton variant="text" className="w-20" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><Skeleton variant="text" className="w-36" /></td>
          <td className="px-4 py-3"><Skeleton variant="text" className="w-20" /></td>
          <td className="px-4 py-3"><Skeleton variant="text" className="w-16" /></td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <Skeleton variant="text" className="w-8" />
              <Skeleton variant="text" className="w-8" />
            </div>
          </td>
          <td className="px-4 py-3"><Skeleton variant="text" className="w-12" /></td>
          <td className="px-4 py-3"><Skeleton variant="text" className="w-20" /></td>
          <td className="px-4 py-3"><Skeleton variant="text" className="w-8" /></td>
        </tr>
      ))}
    </>
  );
}

/* ---- Pagination ---- */

function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Build page buttons: show first, last, current ±2, and ellipses
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-caption text-surface-500">
        Showing <span className="font-medium text-surface-700">{start}</span> to{" "}
        <span className="font-medium text-surface-700">{end}</span> of{" "}
        <span className="font-medium text-surface-700">{total}</span> users
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-ghost btn-sm p-1.5 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-2 text-caption text-surface-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`btn btn-sm min-w-[32px] ${
                p === page ? "btn-primary" : "btn-ghost"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-ghost btn-sm p-1.5 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const { toast } = useToast();

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Slide-over
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    userId: string;
    action: UserAction;
    userName: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [role, status, sort]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (role !== "all") params.set("role", role);
      if (status !== "all") params.set("status", status);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("per_page", String(perPage));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: UsersResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast("Failed to load users", "error");
      setUsers([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, status, sort, page, perPage, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open user detail slide-over
  const openUserDetail = useCallback(async (user: User) => {
    setSlideOverOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedUser(data.user);
    } catch {
      // Fall back to list data if detail fetch fails
      setSelectedUser(user);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeSlideOver = useCallback(() => {
    setSlideOverOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  }, []);

  // Action handling with confirmation for destructive actions
  const requestAction = useCallback(
    (userId: string, action: UserAction) => {
      const user = users.find((u) => u.id === userId) || selectedUser;
      const name = user?.displayName || user?.username || "this user";

      if (DESTRUCTIVE_ACTIONS.includes(action)) {
        setPendingAction({ userId, action, userName: name });
        setConfirmOpen(true);
      } else {
        executeAction(userId, action);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, selectedUser]
  );

  const executeAction = useCallback(
    async (userId: string, action: UserAction) => {
      setActionLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Action failed");
        }
        const data = await res.json();
        const updated = data.user;

        // Update list
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
        );

        // Update slide-over if same user
        setSelectedUser((prev) =>
          prev?.id === userId ? { ...prev, ...updated } : prev
        );

        toast(`${ACTION_LABELS[action]} — done`, "success");
      } catch (err: any) {
        toast(err.message || "Action failed", "error");
      } finally {
        setActionLoading(false);
        setConfirmOpen(false);
        setPendingAction(null);
      }
    },
    [toast]
  );

  const confirmAction = useCallback(() => {
    if (pendingAction) {
      executeAction(pendingAction.userId, pendingAction.action);
    }
  }, [pendingAction, executeAction]);

  const confirmMessage = pendingAction
    ? `Are you sure you want to ${ACTION_LABELS[pendingAction.action].toLowerCase()} for "${pendingAction.userName}"? This action will be logged.`
    : "";

  const TH = "text-left text-micro text-surface-500 uppercase tracking-wider px-4 py-3 font-medium";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-surface-900">User Management</h1>
          <p className="text-caption text-surface-500 mt-1">
            {loading ? "Loading…" : `${total.toLocaleString()} total users`}
          </p>
        </div>
        <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={() => toast("Export coming soon", "info")}>
          <ExportIcon className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or username…"
              className="input pl-9 w-full"
            />
          </div>

          {/* Selects */}
          <FilterSelect value={role} options={ROLE_OPTIONS} onChange={setRole} />
          <FilterSelect value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <FilterSelect value={sort} options={SORT_OPTIONS} onChange={setSort} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className={TH}>User</th>
                <th className={TH}>Email</th>
                <th className={TH}>Role</th>
                <th className={TH}>Status</th>
                <th className={TH}>Uploads</th>
                <th className={TH}>Followers</th>
                <th className={TH}>Joined</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      title="No users found"
                      description={
                        debouncedSearch || role !== "all" || status !== "all"
                          ? "Try adjusting your search or filters"
                          : "No users have signed up yet"
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-surface-100 hover:bg-surface-50 transition-colors cursor-pointer"
                    onClick={() => openUserDetail(user)}
                  >
                    {/* Avatar + Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatarUrl}
                          name={user.displayName || user.username}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="text-caption font-medium text-surface-900 truncate">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-micro text-surface-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-caption text-surface-600">{user.email}</td>

                    {/* Role Badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {roleBadges(user).length > 0 ? (
                          roleBadges(user).map((b) => (
                            <span key={b.label} className={`badge ${b.className}`}>
                              {b.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-micro text-surface-400">User</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={user.isBanned ? "banned" : "active"} />
                    </td>

                    {/* Uploads */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-caption text-surface-600">
                        <span className="flex items-center gap-1" title="Photos">
                          <CameraIcon className="w-3.5 h-3.5 text-surface-400" />
                          {user._count.photos}
                        </span>
                        <span className="flex items-center gap-1" title="Videos">
                          <VideoIcon className="w-3.5 h-3.5 text-surface-400" />
                          {user._count.videos}
                        </span>
                      </div>
                    </td>

                    {/* Followers */}
                    <td className="px-4 py-3 text-caption text-surface-600">
                      {formatNumber(user.followersCount)}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-caption text-surface-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions dropdown */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <button className="btn btn-ghost btn-sm p-1.5" aria-label="Actions">
                            <EllipsisIcon className="w-5 h-5" />
                          </button>
                        }
                        align="right"
                      >
                        <DropdownItem
                          onClick={() => openUserDetail(user)}
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          }
                        >
                          View Profile
                        </DropdownItem>

                        <DropdownDivider />

                        {user.isBanned ? (
                          <DropdownItem onClick={() => requestAction(user.id, "unban")}>
                            Unban User
                          </DropdownItem>
                        ) : (
                          <DropdownItem danger onClick={() => requestAction(user.id, "ban")}>
                            Ban User
                          </DropdownItem>
                        )}

                        {user.isVerified ? (
                          <DropdownItem onClick={() => requestAction(user.id, "unverify")}>
                            Remove Verification
                          </DropdownItem>
                        ) : (
                          <DropdownItem onClick={() => requestAction(user.id, "verify")}>
                            Verify User
                          </DropdownItem>
                        )}

                        <DropdownDivider />

                        {user.isContributor ? (
                          <DropdownItem onClick={() => requestAction(user.id, "remove-contributor")}>
                            Remove Contributor
                          </DropdownItem>
                        ) : (
                          <DropdownItem onClick={() => requestAction(user.id, "make-contributor")}>
                            Make Contributor
                          </DropdownItem>
                        )}

                        {user.isAdmin ? (
                          <DropdownItem danger onClick={() => requestAction(user.id, "remove-admin")}>
                            Remove Admin
                          </DropdownItem>
                        ) : (
                          <DropdownItem onClick={() => requestAction(user.id, "make-admin")}>
                            Make Admin
                          </DropdownItem>
                        )}
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-surface-100">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={perPage}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* User Detail Slide-Over */}
      <UserSlideOver
        user={selectedUser}
        open={slideOverOpen}
        onClose={closeSlideOver}
        onAction={requestAction}
        actionLoading={actionLoading}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Action"
        message={confirmMessage}
        confirmLabel={pendingAction ? ACTION_LABELS[pendingAction.action] : "Confirm"}
        danger={pendingAction ? ["ban", "remove-admin"].includes(pendingAction.action) : false}
        loading={actionLoading}
        onConfirm={confirmAction}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
