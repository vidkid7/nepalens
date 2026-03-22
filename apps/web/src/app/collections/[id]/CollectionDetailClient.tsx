"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface Props {
  collectionId: string;
  isOwner: boolean;
}

export default function CollectionDetailClient({ collectionId, isOwner }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard", "success");
    } catch {
      toast("Failed to copy link", "error");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/internal/collections/${collectionId}`, { method: "DELETE" });
      if (res.ok) {
        toast("Collection deleted", "success");
        router.push("/collections");
      } else {
        toast("Failed to delete collection", "error");
        setDeleting(false);
      }
    } catch {
      toast("Something went wrong", "error");
      setDeleting(false);
    }
  };

  return (
    <>
      <button onClick={handleShare} className="btn btn-sm btn-ghost" title="Share">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>

      {isOwner && (
        <>
          <button onClick={() => setShowDelete(true)} className="btn btn-sm btn-ghost text-danger-500 hover:bg-danger-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>

          <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Collection" size="sm">
            <div className="space-y-4">
              <p className="text-body text-surface-600">Are you sure you want to delete this collection? This action cannot be undone. The media inside will not be deleted.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDelete(false)} className="btn btn-sm btn-ghost">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="btn btn-sm btn-danger">{deleting ? "Deleting\u2026" : "Delete Collection"}</button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  );
}
