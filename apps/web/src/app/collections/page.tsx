"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  isPrivate: boolean;
  isSystem: boolean;
  itemsCount: number;
  updatedAt: string;
}

export default function CollectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/collections");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/internal/collections")
        .then((r) => r.json())
        .then((data) => { setCollections(data.collections || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const createCollection = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/internal/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, isPrivate }),
      });
      if (res.ok) {
        const { collection } = await res.json();
        setCollections((prev) => [collection, ...prev]);
        setNewTitle("");
        setNewDesc("");
        setIsPrivate(false);
        setShowCreate(false);
        toast("Collection created", "success");
      }
    } catch {
      toast("Failed to create collection", "error");
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="container-app py-16">
        <div className="max-w-5xl mx-auto">
          <Skeleton variant="text" className="w-48 h-8 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <Skeleton variant="rectangular" className="h-40 w-full" />
                <div className="p-4">
                  <Skeleton variant="text" className="w-2/3 mb-2" />
                  <Skeleton variant="text" className="w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display text-surface-900">Your Collections</h1>
            <p className="text-caption text-surface-500 mt-1">Organize your favorite photos and videos</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-md btn-primary">
            + New Collection
          </button>
        </div>

        {collections.length === 0 ? (
          <EmptyState
            title="No collections yet"
            description="Create your first collection to start organizing your favorite content."
            action={{ label: "Create Collection", onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.id}`}
                className="card overflow-hidden group hover:shadow-card-hover transition-all"
              >
                <div className="h-40 bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-surface-300 group-hover:text-brand/30 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className="text-subtitle font-semibold text-surface-900 group-hover:text-brand transition-colors">
                    {c.title}
                    {c.isPrivate && (
                      <span className="ml-2 badge badge-neutral">Private</span>
                    )}
                  </h3>
                  <p className="text-micro text-surface-500 mt-1">
                    {c.itemsCount} {c.itemsCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Collection" size="md">
          <div className="space-y-4">
            <div>
              <label className="form-label">Name</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input"
                placeholder="My favorite photos"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createCollection()}
              />
            </div>
            <div>
              <label className="form-label">Description (optional)</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="textarea"
                rows={2}
                placeholder="Describe this collection..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isPrivate ? "bg-brand" : "bg-surface-300"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPrivate ? "left-[22px]" : "left-0.5"}`} />
              </button>
              <span className="text-caption text-surface-600">Private collection</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="btn btn-sm btn-ghost">Cancel</button>
              <button onClick={createCollection} disabled={!newTitle.trim()} className="btn btn-sm btn-primary">Create</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
