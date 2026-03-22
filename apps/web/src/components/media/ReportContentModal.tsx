"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const REASONS = [
  { value: "copyright", label: "Copyright Infringement" },
  { value: "abuse", label: "Abuse / Harassment" },
  { value: "nudity", label: "Nudity / Sexual Content" },
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "illegal", label: "Illegal Content" },
  { value: "other", label: "Other" },
];

interface ReportContentModalProps {
  open: boolean;
  onClose: () => void;
  mediaType: "photo" | "video";
  mediaId: string;
}

export default function ReportContentModal({
  open,
  onClose,
  mediaType,
  mediaId,
}: ReportContentModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reason) {
        toast("Please select a reason", "error");
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch("/api/internal/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaType, mediaId, reason, description }),
        });
        const data = await res.json();

        if (res.ok) {
          toast("Report submitted. Thank you for helping keep our community safe.", "success");
          setReason("");
          setDescription("");
          onClose();
        } else {
          toast(data.error || "Failed to submit report", "error");
        }
      } catch {
        toast("Something went wrong", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [reason, description, mediaType, mediaId, toast, onClose]
  );

  if (!session?.user) {
    return (
      <Modal open={open} onClose={onClose} title="Report Content" size="sm">
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-subtitle text-surface-900 mb-1">Sign in required</p>
          <p className="text-caption text-surface-500 mb-4">
            You need to be signed in to report content.
          </p>
          <a href="/login" className="btn btn-sm btn-primary">
            Sign In
          </a>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Report Content" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-caption text-surface-500">
          Help us understand the problem. What&apos;s wrong with this {mediaType}?
        </p>

        <div>
          <label className="text-label text-surface-700 mb-1.5 block">
            Reason <span className="text-danger-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input text-caption w-full"
            required
          >
            <option value="">Select a reason…</option>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-label text-surface-700 mb-1.5 block">
            Description <span className="text-micro text-surface-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input text-caption w-full min-h-[100px] resize-y"
            placeholder="Provide additional details…"
            maxLength={2000}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !reason}
            className="btn btn-sm btn-danger"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Report"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
