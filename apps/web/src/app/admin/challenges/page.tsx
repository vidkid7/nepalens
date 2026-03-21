"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";

/* ───────── Types ───────── */

interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  prizeDesc: string | null;
  submissionTag: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  winnerId: string | null;
  createdAt: string;
  submissionCount: number;
}

interface Submission {
  id: string;
  slug: string;
  altText: string | null;
  originalUrl: string;
  width: number;
  height: number;
  status: string;
  likesCount: number;
  viewsCount: string | number;
  downloadsCount: string | number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface ChallengeDetail extends Challenge {
  submissions: Submission[];
}

type StatusFilter = "all" | "draft" | "active" | "upcoming" | "voting" | "completed" | "archived";

/* ───────── Helpers ───────── */

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateInput(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-surface-200 text-surface-700",
  active: "bg-emerald-100 text-emerald-700",
  upcoming: "bg-blue-100 text-blue-700",
  voting: "bg-amber-100 text-amber-700",
  completed: "bg-purple-100 text-purple-700",
  archived: "bg-surface-100 text-surface-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-micro font-medium capitalize ${STATUS_COLORS[status] || "bg-surface-200 text-surface-600"}`}>
      {status}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-surface-200 p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-32 h-20 bg-surface-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-surface-200 rounded w-1/3" />
              <div className="h-4 bg-surface-200 rounded w-2/3" />
              <div className="h-3 bg-surface-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4 text-surface-400">{icon}</div>
      <h3 className="text-subtitle text-surface-700 mb-1">{title}</h3>
      <p className="text-caption text-surface-500 max-w-sm">{description}</p>
    </div>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} size="sm" title={title}>
      <p className="text-caption text-surface-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary btn-sm">Cancel</button>
        <button onClick={onConfirm} className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}>{confirmLabel || "Confirm"}</button>
      </div>
    </Modal>
  );
}

/* ───────── Icons ───────── */

function IconPlus() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>);
}
function IconTrophy() {
  return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14M9 3v2a3 3 0 003 3v0a3 3 0 003-3V3M5 3a2 2 0 00-2 2v1a5 5 0 005 5h0M19 3a2 2 0 012 2v1a5 5 0 01-5 5h0M12 14v4m-3 4h6" /></svg>);
}
function IconEdit() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
}
function IconTrash() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
}
function IconArchive() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>);
}
function IconStar() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>);
}
function IconChevronLeft() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>);
}
function IconChevronRight() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>);
}
function IconCheck() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);
}

/* ───────── Main Page ───────── */

export default function AdminChallengesPage() {
  const { toast } = useToast();

  // Data
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Winner panel
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  /* ───── Fetch challenges ───── */

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/challenges?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChallenges(data.challenges);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setCounts(data.counts || {});
    } catch {
      toast("Failed to load challenges", "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, toast]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  /* ───── CRUD ───── */

  const saveChallenge = useCallback(async () => {
    if (!formData.title?.trim()) {
      toast("Title is required", "error");
      return;
    }
    if (formData.startsAt && formData.endsAt && new Date(formData.endsAt) <= new Date(formData.startsAt)) {
      toast("End date must be after start date", "error");
      return;
    }

    setSaving(true);
    try {
      const url = editingChallenge
        ? `/api/admin/challenges/${editingChallenge.id}`
        : "/api/admin/challenges";
      const method = editingChallenge ? "PATCH" : "POST";

      const payload: any = {
        title: formData.title?.trim(),
        description: formData.description || null,
        coverUrl: formData.coverUrl || null,
        prizeDesc: formData.prizeDesc || null,
        startsAt: formData.startsAt || null,
        endsAt: formData.endsAt || null,
        status: formData.status || "draft",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast(editingChallenge ? "Challenge updated" : "Challenge created", "success");
      setModalOpen(false);
      setEditingChallenge(null);
      setFormData({});
      fetchChallenges();
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }, [formData, editingChallenge, toast, fetchChallenges]);

  const changeStatus = useCallback(async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast(`Challenge status changed to ${newStatus}`, "success");
      fetchChallenges();
    } catch (err: any) {
      toast(err.message, "error");
    }
  }, [toast, fetchChallenges]);

  const deleteChallenge = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast("Challenge deleted", "success");
      fetchChallenges();
    } catch (err: any) {
      toast(err.message, "error");
    }
  }, [toast, fetchChallenges]);

  const requestDelete = (challenge: Challenge) => {
    setConfirmTitle("Delete Challenge");
    setConfirmMessage(`Are you sure you want to delete "${challenge.title}"? This action cannot be undone. Only draft challenges can be deleted.`);
    setConfirmAction(() => () => {
      deleteChallenge(challenge.id);
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  /* ───── Winner selection ───── */

  const openWinnerPanel = useCallback(async (challenge: Challenge) => {
    setLoadingDetail(true);
    setWinnerModalOpen(true);
    try {
      const res = await fetch(`/api/admin/challenges/${challenge.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSelectedChallenge(data.challenge);
    } catch {
      toast("Failed to load challenge details", "error");
      setWinnerModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }, [toast]);

  const selectWinner = useCallback(async (challengeId: string, winnerId: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, status: "completed" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to select winner");
      }
      toast("Winner selected and challenge completed!", "success");
      setWinnerModalOpen(false);
      setSelectedChallenge(null);
      fetchChallenges();
    } catch (err: any) {
      toast(err.message, "error");
    }
  }, [toast, fetchChallenges]);

  /* ───── Modal openers ───── */

  const openCreateModal = () => {
    setEditingChallenge(null);
    setFormData({ status: "draft" });
    setModalOpen(true);
  };

  const openEditModal = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || "",
      coverUrl: challenge.coverUrl || "",
      prizeDesc: challenge.prizeDesc || "",
      startsAt: formatDateInput(challenge.startsAt),
      endsAt: formatDateInput(challenge.endsAt),
      status: challenge.status,
    });
    setModalOpen(true);
  };

  /* ───── Status tabs ───── */

  const tabDefs = [
    { id: "all", label: "All", count: counts.total || total },
    { id: "draft", label: "Draft", count: counts.draft || 0 },
    { id: "active", label: "Active", count: counts.active || 0 },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming || 0 },
    { id: "voting", label: "Voting", count: counts.voting || 0 },
    { id: "completed", label: "Completed", count: counts.completed || 0 },
    { id: "archived", label: "Archived", count: counts.archived || 0 },
  ];

  /* ───────── Render ───────── */

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-h4 font-bold text-surface-900">Challenge Management</h1>
          <p className="text-caption text-surface-500 mt-1">Create and manage photo challenges for the community</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary inline-flex items-center gap-2">
          <IconPlus /> Create Challenge
        </button>
      </div>

      {/* Filter tabs */}
      <Tabs
        tabs={tabDefs}
        active={statusFilter}
        onChange={(id) => setStatusFilter(id as StatusFilter)}
        variant="pill"
        size="sm"
        className="mb-6"
      />

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search challenges..."
          className="input max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Challenge list */}
      {loading ? (
        <TableSkeleton />
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={<IconTrophy />}
          title="No challenges found"
          description={statusFilter !== "all" ? `No ${statusFilter} challenges. Try a different filter.` : "Create your first challenge to get started."}
        />
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-surface-200 hover:border-surface-300 transition-colors overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Banner */}
                <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                  {c.coverUrl ? (
                    <img src={c.coverUrl} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <IconTrophy />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-subtitle font-semibold text-surface-900 truncate">{c.title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.description && (
                        <p className="text-caption text-surface-600 line-clamp-2 mb-2">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-micro text-surface-500">
                        <span>📅 {formatDate(c.startsAt)} — {formatDate(c.endsAt)}</span>
                        <span>📸 {c.submissionCount} submission{c.submissionCount !== 1 ? "s" : ""}</span>
                        {c.prizeDesc && <span>🏆 {c.prizeDesc}</span>}
                        {c.winnerId && <span>⭐ Winner selected</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEditModal(c)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors" title="Edit">
                        <IconEdit />
                      </button>

                      {/* Status quick-change dropdown */}
                      <div className="relative group">
                        <button className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors" title="Change Status">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-surface-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                          {["draft", "upcoming", "active", "voting", "completed", "archived"].filter((s) => s !== c.status).map((s) => (
                            <button key={s} onClick={() => changeStatus(c.id, s)} className="block w-full text-left px-3 py-2 text-caption hover:bg-surface-50 capitalize first:rounded-t-lg last:rounded-b-lg">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(c.status === "voting" || c.status === "completed") && (
                        <button onClick={() => openWinnerPanel(c)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors" title="Select Winner">
                          <IconStar />
                        </button>
                      )}

                      {c.status !== "archived" && (
                        <button onClick={() => changeStatus(c.id, "archived")} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700 transition-colors" title="Archive">
                          <IconArchive />
                        </button>
                      )}

                      {c.status === "draft" && (
                        <button onClick={() => requestDelete(c)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" title="Delete">
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-caption text-surface-500">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm inline-flex items-center gap-1 disabled:opacity-50">
              <IconChevronLeft /> Prev
            </button>
            <span className="text-caption text-surface-600 px-2">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm inline-flex items-center gap-1 disabled:opacity-50">
              Next <IconChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingChallenge(null); setFormData({}); }} size="lg" title={editingChallenge ? "Edit Challenge" : "Create Challenge"}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Title *</label>
            <input className="input" value={formData.title || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, title: e.target.value }))} placeholder="Challenge title" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea className="input min-h-[100px]" rows={4} value={formData.description || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, description: e.target.value }))} placeholder="Describe the challenge..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="input" value={formData.startsAt || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="input" value={formData.endsAt || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Prize Description</label>
            <input className="input" value={formData.prizeDesc || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, prizeDesc: e.target.value }))} placeholder="e.g., $500 gift card + featured profile" />
          </div>
          <div>
            <label className="form-label">Banner Image URL</label>
            <input className="input" value={formData.coverUrl || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, coverUrl: e.target.value }))} placeholder="https://..." />
            {formData.coverUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-surface-200 max-h-40">
                <img src={formData.coverUrl} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="input" value={formData.status || "draft"} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="voting">Voting</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <button onClick={() => { setModalOpen(false); setEditingChallenge(null); setFormData({}); }} className="btn btn-secondary">Cancel</button>
            <button onClick={saveChallenge} disabled={saving} className="btn btn-primary disabled:opacity-50">
              {saving ? "Saving..." : editingChallenge ? "Update Challenge" : "Create Challenge"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Winner Selection Modal */}
      <Modal open={winnerModalOpen} onClose={() => { setWinnerModalOpen(false); setSelectedChallenge(null); }} size="xl" title={selectedChallenge ? `Select Winner — ${selectedChallenge.title}` : "Select Winner"}>
        {loadingDetail ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selectedChallenge ? (
          <div>
            {selectedChallenge.winnerId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-caption text-amber-800">
                <IconStar /> Current winner ID: <span className="font-mono text-micro">{selectedChallenge.winnerId}</span>
              </div>
            )}

            {selectedChallenge.submissions.length === 0 ? (
              <EmptyState
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                title="No submissions yet"
                description="There are no approved submissions for this challenge."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
                {selectedChallenge.submissions.map((s) => (
                  <div key={s.id} className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedChallenge.winnerId === s.id ? "border-amber-400 ring-2 ring-amber-200" : "border-surface-200 hover:border-brand-300"}`}>
                    <img src={s.originalUrl} alt={s.altText || s.slug} className="w-full aspect-square object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <div className="w-full p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-micro text-white font-medium truncate">@{s.user.username}</p>
                        <div className="flex gap-2 text-micro text-white/80">
                          <span>❤️ {s.likesCount}</span>
                          <span>👁️ {Number(s.viewsCount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {selectedChallenge.winnerId === s.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                        <IconCheck />
                      </div>
                    )}
                    <button
                      onClick={() => selectWinner(selectedChallenge.id, s.id)}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-surface-800 text-micro font-medium px-2 py-1 rounded-md shadow"
                    >
                      {selectedChallenge.winnerId === s.id ? "Current Winner" : "Select as Winner"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmAction?.()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
