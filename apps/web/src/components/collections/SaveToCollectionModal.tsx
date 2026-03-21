"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface Collection {
  id: string;
  title: string;
  isPrivate: boolean;
  isSystem: boolean;
  itemsCount: number;
}

interface SaveToCollectionModalProps {
  open: boolean;
  onClose: () => void;
  mediaType: "photo" | "video";
  mediaId: string;
}

export default function SaveToCollectionModal({
  open,
  onClose,
  mediaType,
  mediaId,
}: SaveToCollectionModalProps) {
  const { toast } = useToast();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedIn, setSavedIn] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Create new collection inline
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internal/collections");
      const data = await res.json();
      const colls: Collection[] = (data.collections || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        isPrivate: c.isPrivate,
        isSystem: c.isSystem,
        itemsCount: c.itemsCount,
      }));
      setCollections(colls);

      // Determine which collections already contain this item
      const contained = new Set<string>();
      for (const c of data.collections || []) {
        const items: any[] = c.items || [];
        if (items.some((item: any) => item.mediaType === mediaType && item.mediaId === mediaId)) {
          contained.add(c.id);
        }
      }
      setSavedIn(contained);
    } catch {
      toast("Failed to load collections", "error");
    } finally {
      setLoading(false);
    }
  }, [mediaType, mediaId, toast]);

  useEffect(() => {
    if (open) {
      fetchCollections();
      setSearch("");
      setShowCreate(false);
      setNewTitle("");
      setNewPrivate(false);
    }
  }, [open, fetchCollections]);

  useEffect(() => {
    if (showCreate && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showCreate]);

  const toggleCollection = useCallback(
    async (collectionId: string) => {
      const isCurrentlySaved = savedIn.has(collectionId);
      setToggling((prev) => new Set(prev).add(collectionId));

      try {
        const method = isCurrentlySaved ? "DELETE" : "POST";
        const res = await fetch(`/api/internal/collections/${collectionId}/items`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaType, mediaId }),
        });

        if (res.ok) {
          setSavedIn((prev) => {
            const next = new Set(prev);
            if (isCurrentlySaved) {
              next.delete(collectionId);
            } else {
              next.add(collectionId);
            }
            return next;
          });

          // Update local item count
          setCollections((prev) =>
            prev.map((c) =>
              c.id === collectionId
                ? { ...c, itemsCount: c.itemsCount + (isCurrentlySaved ? -1 : 1) }
                : c
            )
          );

          toast(
            isCurrentlySaved ? "Removed from collection" : "Added to collection",
            "success"
          );
        } else {
          const data = await res.json();
          toast(data.error || "Failed to update collection", "error");
        }
      } catch {
        toast("Something went wrong", "error");
      } finally {
        setToggling((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      }
    },
    [savedIn, mediaType, mediaId, toast]
  );

  const handleCreateCollection = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;

      setCreating(true);
      try {
        const res = await fetch("/api/internal/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim(), isPrivate: newPrivate }),
        });

        if (res.ok) {
          const data = await res.json();
          const created: Collection = {
            id: data.collection.id,
            title: data.collection.title,
            isPrivate: data.collection.isPrivate,
            isSystem: false,
            itemsCount: 0,
          };
          setCollections((prev) => [created, ...prev]);
          setNewTitle("");
          setNewPrivate(false);
          setShowCreate(false);
          toast("Collection created", "success");
        } else {
          const data = await res.json();
          toast(data.error || "Failed to create collection", "error");
        }
      } catch {
        toast("Something went wrong", "error");
      } finally {
        setCreating(false);
      }
    },
    [newTitle, newPrivate, toast]
  );

  const filtered = collections.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} title="Save to Collection" size="sm">
      <div className="space-y-3">
        {/* Create new collection */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 w-full p-3 rounded-lg border-2 border-dashed border-surface-300 text-surface-600 hover:border-brand hover:text-brand transition-colors text-caption font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Collection
          </button>
        ) : (
          <form onSubmit={handleCreateCollection} className="p-3 rounded-lg border border-surface-200 bg-surface-50 space-y-3">
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="input text-caption"
              placeholder="Collection name"
              maxLength={100}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-caption text-surface-600">
                <button
                  type="button"
                  role="switch"
                  aria-checked={newPrivate}
                  onClick={() => setNewPrivate(!newPrivate)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${newPrivate ? "bg-brand" : "bg-surface-300"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${newPrivate ? "left-[18px]" : "left-0.5"}`} />
                </button>
                Private
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewTitle(""); setNewPrivate(false); }}
                  className="btn btn-xs btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="btn btn-xs btn-primary"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search */}
        {collections.length > 5 && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-caption"
              placeholder="Search collections…"
            />
          </div>
        )}

        {/* Collection list */}
        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-50 animate-pulse">
                <div className="w-5 h-5 rounded bg-surface-200" />
                <div className="flex-1">
                  <div className="h-3.5 w-24 rounded bg-surface-200 mb-1" />
                  <div className="h-2.5 w-16 rounded bg-surface-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-caption text-surface-400 py-6">
            {search ? "No collections match your search" : "No collections yet"}
          </p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto -mx-1 px-1">
            {filtered.map((collection) => {
              const isSaved = savedIn.has(collection.id);
              const isLoading = toggling.has(collection.id);

              return (
                <button
                  key={collection.id}
                  onClick={() => toggleCollection(collection.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-left ${
                    isSaved
                      ? "bg-brand/5 hover:bg-brand/10"
                      : "hover:bg-surface-50"
                  } ${isLoading ? "opacity-60" : ""}`}
                  aria-label={`${isSaved ? "Remove from" : "Add to"} ${collection.title}`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      isSaved
                        ? "bg-brand border-brand"
                        : "border-surface-300"
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isSaved ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-medium text-surface-900 truncate">
                      {collection.title}
                    </p>
                    <p className="text-micro text-surface-400">
                      {collection.itemsCount} {collection.itemsCount === 1 ? "item" : "items"}
                      {collection.isPrivate && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Private
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
