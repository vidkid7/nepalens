"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

interface QueueItem {
  id: string;
  slug: string;
  altText: string | null;
  originalUrl: string;
  width: number;
  height: number;
  status: string;
  createdAt: string;
  user?: { username: string; displayName: string | null };
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/queue?type=photo")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = useCallback(
    async (id: string, action: "approve" | "reject", options?: { feature?: boolean; curate?: boolean; reason?: string }) => {
      const url = `/api/admin/media/${id}/${action}`;
      const body: any = {};
      if (action === "approve") {
        body.feature = options?.feature || false;
        body.curate = options?.curate || false;
      }
      if (action === "reject") {
        body.reason = options?.reason || "Does not meet quality guidelines";
      }

      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          setItems((prev) => prev.filter((item) => item.id !== id));
          setTotal((prev) => prev - 1);
          toast(
            action === "approve"
              ? `Photo ${options?.feature ? "featured" : options?.curate ? "curated" : "approved"}`
              : "Photo rejected",
            action === "approve" ? "success" : "info"
          );
        } else {
          toast("Action failed", "error");
        }
      } catch {
        toast("Action failed", "error");
      }
    },
    [toast]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showRejectModal || !selectedId) return;
      const item = items.find((i) => i.id === selectedId);
      if (!item) return;

      switch (e.key.toLowerCase()) {
        case "a": handleAction(item.id, "approve"); break;
        case "f": handleAction(item.id, "approve", { feature: true }); break;
        case "c": handleAction(item.id, "approve", { curate: true }); break;
        case "r": setShowRejectModal(true); break;
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectedId, items, handleAction, showRejectModal]);

  if (loading) {
    return (
      <div>
        <Skeleton variant="text" className="w-48 h-8 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <Skeleton variant="rectangular" className="w-44 h-28" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="w-1/2" />
                <Skeleton variant="text" className="w-1/3" />
                <Skeleton variant="text" className="w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-surface-900">Review Queue</h1>
          <p className="text-caption text-surface-500 mt-1">{total} items pending review</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 text-micro text-surface-400">
          <span className="px-1.5 py-0.5 bg-surface-100 rounded text-surface-600 font-mono">A</span> Approve
          <span className="px-1.5 py-0.5 bg-surface-100 rounded text-surface-600 font-mono">F</span> Feature
          <span className="px-1.5 py-0.5 bg-surface-100 rounded text-surface-600 font-mono">C</span> Curate
          <span className="px-1.5 py-0.5 bg-surface-100 rounded text-surface-600 font-mono">R</span> Reject
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Queue is empty"
          description="All uploads have been reviewed. Great job!"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`card p-4 flex gap-4 transition-all cursor-pointer ${
                selectedId === item.id ? "ring-2 ring-brand" : "hover:border-surface-300"
              }`}
              onClick={() => setSelectedId(item.id)}
            >
              {/* Preview */}
              <div className="w-44 h-28 bg-surface-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.originalUrl}
                  alt={item.altText || ""}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/176x112/e5e7eb/9ca3af?text=No+Preview"; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-subtitle text-surface-900 truncate">
                    {item.altText || item.slug || "Untitled"}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-caption text-surface-500 mb-3">
                  by <span className="text-surface-700 font-medium">{item.user?.displayName || item.user?.username || "Unknown"}</span> · {item.width}×{item.height} · {new Date(item.createdAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, "approve"); }}
                    className="btn btn-xs bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, "approve", { feature: true }); }}
                    className="btn btn-xs bg-blue-500 text-white hover:bg-blue-600"
                  >
                    ★ Feature
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, "approve", { curate: true }); }}
                    className="btn btn-xs bg-purple-500 text-white hover:bg-purple-600"
                  >
                    ◆ Curate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                      setShowRejectModal(true);
                    }}
                    className="btn btn-xs btn-danger"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && selectedId && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-title text-surface-900 mb-4">Reject Photo</h3>
            <label className="form-label">Reason for rejection</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input mb-3"
            >
              <option value="">Select a reason...</option>
              <option value="quality">Does not meet quality guidelines</option>
              <option value="duplicate">Duplicate content</option>
              <option value="copyright">Copyright concern</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="metadata">Missing or incorrect metadata</option>
              <option value="other">Other</option>
            </select>
            <textarea
              placeholder="Additional notes for the contributor..."
              className="textarea mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRejectModal(false)} className="btn btn-sm btn-ghost">
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAction(selectedId, "reject", { reason: rejectReason || "Does not meet guidelines" });
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="btn btn-sm btn-danger"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
