"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/Toast";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";

/* ───────── Types ───────── */

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  position: number;
  isActive: boolean;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  photosCount: number;
  videosCount: number;
}

interface FeaturedTopic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
}

interface SearchSynonym {
  id: string;
  term: string;
  synonym: string;
  isActive: boolean;
}

interface BlockedKeyword {
  id: string;
  keyword: string;
  reason: string | null;
  createdAt: string;
}

type TaxonomyType =
  | "category"
  | "tag"
  | "featured-topic"
  | "synonym"
  | "blocked-keyword";

type TabId =
  | "categories"
  | "tags"
  | "featured-topics"
  | "synonyms"
  | "blocked-keywords";

/* ───────── Helpers ───────── */

const TH = "px-4 py-3 text-left text-micro font-semibold text-surface-500 uppercase tracking-wider";
const TD = "px-4 py-3 text-caption text-surface-700";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-surface-100 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-surface-200 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-4 text-surface-400">
        {icon}
      </div>
      <h3 className="text-subtitle text-surface-700 mb-1">{title}</h3>
      <p className="text-caption text-surface-500 max-w-sm">{description}</p>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} size="sm" title={title}>
      <p className="text-caption text-surface-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary btn-sm">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
        >
          {confirmLabel || "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

/* ───────── Icons (inline SVGs) ───────── */

function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconChevronUp() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

/* ───────── Main Page ───────── */

export default function AdminTaxonomyPage() {
  const { toast } = useToast();

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [featuredTopics, setFeaturedTopics] = useState<FeaturedTopic[]>([]);
  const [synonyms, setSynonyms] = useState<SearchSynonym[]>([]);
  const [blockedKeywords, setBlockedKeywords] = useState<BlockedKeyword[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<TabId>("categories");

  // Modal / form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  // Tag search
  const [tagSearch, setTagSearch] = useState("");
  const [tagSort, setTagSort] = useState<"name" | "count">("count");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  /* ───── Fetch all data ───── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/taxonomy");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(data.categories);
      setTags(data.tags);
      setFeaturedTopics(data.featuredTopics);
      setSynonyms(data.searchSynonyms);
      setBlockedKeywords(data.blockedKeywords);
    } catch {
      toast("Failed to load taxonomy data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───── CRUD helpers ───── */

  const createItem = useCallback(
    async (type: TaxonomyType, data: Record<string, any>) => {
      setSaving(true);
      try {
        const res = await fetch("/api/admin/taxonomy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
        toast("Item created successfully", "success");
        setModalOpen(false);
        setFormData({});
        fetchData();
      } catch (err: any) {
        toast(err.message, "error");
      } finally {
        setSaving(false);
      }
    },
    [toast, fetchData]
  );

  const updateItem = useCallback(
    async (id: string, type: TaxonomyType, data: Record<string, any>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/taxonomy/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update");
        }
        toast("Item updated successfully", "success");
        setModalOpen(false);
        setEditingItem(null);
        setFormData({});
        fetchData();
      } catch (err: any) {
        toast(err.message, "error");
      } finally {
        setSaving(false);
      }
    },
    [toast, fetchData]
  );

  const deleteItem = useCallback(
    async (id: string, type: TaxonomyType) => {
      try {
        const res = await fetch(`/api/admin/taxonomy/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to delete");
        }
        toast("Item deleted", "success");
        fetchData();
      } catch (err: any) {
        toast(err.message, "error");
      }
    },
    [toast, fetchData]
  );

  const requestDelete = (id: string, type: TaxonomyType, label: string) => {
    setConfirmTitle("Delete Item");
    setConfirmMessage(
      `Are you sure you want to delete "${label}"? This action cannot be undone.`
    );
    setConfirmAction(() => () => {
      deleteItem(id, type);
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  /* ───── Reorder helpers ───── */

  const moveItem = useCallback(
    async (
      type: TaxonomyType,
      items: { id: string; position: number }[],
      id: string,
      direction: "up" | "down"
    ) => {
      const idx = items.findIndex((i) => i.id === id);
      if (
        (direction === "up" && idx <= 0) ||
        (direction === "down" && idx >= items.length - 1)
      )
        return;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const currentPos = items[idx].position;
      const swapPos = items[swapIdx].position;

      try {
        await Promise.all([
          fetch(`/api/admin/taxonomy/${items[idx].id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, data: { position: swapPos } }),
          }),
          fetch(`/api/admin/taxonomy/${items[swapIdx].id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, data: { position: currentPos } }),
          }),
        ]);
        fetchData();
      } catch {
        toast("Failed to reorder", "error");
      }
    },
    [fetchData, toast]
  );

  /* ───── Modal openers ───── */

  const openCreateModal = (type: TaxonomyType) => {
    setEditingItem(null);
    setFormData(type === "featured-topic" ? { isActive: true } : {});
    setModalOpen(true);
  };

  const openEditModal = (type: TaxonomyType, item: any) => {
    setEditingItem({ ...item, _type: type });
    setFormData({ ...item });
    setModalOpen(true);
  };

  /* ───── Form submission ───── */

  const handleSubmit = () => {
    const typeMap: Record<TabId, TaxonomyType> = {
      categories: "category",
      tags: "tag",
      "featured-topics": "featured-topic",
      synonyms: "synonym",
      "blocked-keywords": "blocked-keyword",
    };
    const type = editingItem?._type || typeMap[activeTab];

    if (editingItem) {
      updateItem(editingItem.id, type, formData);
    } else {
      createItem(type, formData);
    }
  };

  /* ───── Bulk tag delete ───── */

  const bulkDeleteTags = useCallback(async () => {
    if (selectedTags.size === 0) return;
    try {
      await Promise.all(
        Array.from(selectedTags).map((id) =>
          fetch(`/api/admin/taxonomy/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "tag" }),
          })
        )
      );
      toast(`Deleted ${selectedTags.size} tag(s)`, "success");
      setSelectedTags(new Set());
      fetchData();
    } catch {
      toast("Failed to delete some tags", "error");
    }
  }, [selectedTags, toast, fetchData]);

  /* ───── Filtered/sorted tags ───── */

  const filteredTags = tags
    .filter(
      (t) =>
        !tagSearch ||
        t.name.toLowerCase().includes(tagSearch.toLowerCase()) ||
        t.slug.toLowerCase().includes(tagSearch.toLowerCase())
    )
    .sort((a, b) =>
      tagSort === "count"
        ? b.photosCount - a.photosCount
        : a.name.localeCompare(b.name)
    );

  /* ───── Tab config ───── */

  const tabDefs = [
    { id: "categories" as TabId, label: "Categories", count: categories.length },
    { id: "tags" as TabId, label: "Tags", count: tags.length },
    { id: "featured-topics" as TabId, label: "Featured Topics", count: featuredTopics.length },
    { id: "synonyms" as TabId, label: "Synonyms", count: synonyms.length },
    { id: "blocked-keywords" as TabId, label: "Blocked Keywords", count: blockedKeywords.length },
  ];

  /* ───── Render modal form fields ───── */

  const renderFormFields = () => {
    const typeMap: Record<TabId, TaxonomyType> = {
      categories: "category",
      tags: "tag",
      "featured-topics": "featured-topic",
      synonyms: "synonym",
      "blocked-keywords": "blocked-keyword",
    };
    const type = editingItem?._type || typeMap[activeTab];

    switch (type) {
      case "category":
        return (
          <div className="space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input
                className="input"
                value={formData.name || ""}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    name,
                    ...(!editingItem ? { slug: slugify(name) } : {}),
                  }));
                }}
                placeholder="e.g. Nature"
              />
            </div>
            <div>
              <label className="form-label">Slug *</label>
              <input
                className="input"
                value={formData.slug || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({ ...f, slug: e.target.value }))
                }
                placeholder="e.g. nature"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea
                className="textarea"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Brief description of the category"
              />
            </div>
            <div>
              <label className="form-label">Icon URL</label>
              <input
                className="input"
                value={formData.iconUrl || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    iconUrl: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="form-label">Position</label>
              <input
                type="number"
                className="input"
                value={formData.position ?? 0}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    position: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        );

      case "tag":
        return (
          <div className="space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input
                className="input"
                value={formData.name || ""}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    name,
                    ...(!editingItem ? { slug: slugify(name) } : {}),
                  }));
                }}
                placeholder="e.g. sunset"
              />
            </div>
            <div>
              <label className="form-label">Slug *</label>
              <input
                className="input"
                value={formData.slug || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({ ...f, slug: e.target.value }))
                }
                placeholder="e.g. sunset"
              />
            </div>
          </div>
        );

      case "featured-topic":
        return (
          <div className="space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input
                className="input"
                value={formData.name || ""}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    name,
                    ...(!editingItem ? { slug: slugify(name) } : {}),
                  }));
                }}
                placeholder="e.g. Minimalism"
              />
            </div>
            <div>
              <label className="form-label">Slug *</label>
              <input
                className="input"
                value={formData.slug || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({ ...f, slug: e.target.value }))
                }
                placeholder="e.g. minimalism"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea
                className="textarea"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
            <div>
              <label className="form-label">Position</label>
              <input
                type="number"
                className="input"
                value={formData.position ?? 0}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    position: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    isActive: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded border-surface-300 text-brand focus:ring-brand"
              />
              <span className="text-caption text-surface-700">Active</span>
            </label>
          </div>
        );

      case "synonym":
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-info-50 border border-info-200">
              <p className="text-micro text-info-700">
                Search synonyms expand queries. When a user searches for the
                &quot;term&quot;, results for the &quot;synonym&quot; will also be
                included.
              </p>
            </div>
            <div>
              <label className="form-label">Term *</label>
              <input
                className="input"
                value={formData.term || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    term: e.target.value,
                  }))
                }
                placeholder="e.g. car"
              />
            </div>
            <div>
              <label className="form-label">Synonym *</label>
              <input
                className="input"
                value={formData.synonym || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    synonym: e.target.value,
                  }))
                }
                placeholder="e.g. automobile"
              />
            </div>
          </div>
        );

      case "blocked-keyword":
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-warning-50 border border-warning-200">
              <p className="text-micro text-warning-700">
                Blocked keywords will be filtered from search and prevented from
                being used as tags.
              </p>
            </div>
            <div>
              <label className="form-label">Keyword *</label>
              <input
                className="input"
                value={formData.keyword || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    keyword: e.target.value,
                  }))
                }
                placeholder="Enter blocked keyword"
              />
            </div>
            <div>
              <label className="form-label">Reason</label>
              <input
                className="input"
                value={formData.reason || ""}
                onChange={(e) =>
                  setFormData((f: Record<string, any>) => ({
                    ...f,
                    reason: e.target.value,
                  }))
                }
                placeholder="Why this keyword is blocked"
              />
            </div>
          </div>
        );
    }
  };

  const modalTitle = () => {
    const typeMap: Record<TabId, string> = {
      categories: "Category",
      tags: "Tag",
      "featured-topics": "Featured Topic",
      synonyms: "Synonym Pair",
      "blocked-keywords": "Blocked Keyword",
    };
    const label = editingItem
      ? typeMap[
          Object.entries({
            categories: "category",
            tags: "tag",
            "featured-topics": "featured-topic",
            synonyms: "synonym",
            "blocked-keywords": "blocked-keyword",
          } as Record<string, string>).find(
            ([, v]) => v === editingItem._type
          )?.[0] as TabId
        ] || typeMap[activeTab]
      : typeMap[activeTab];
    return editingItem ? `Edit ${label}` : `Add ${label}`;
  };

  /* ═══════════════════ RENDER ═══════════════════ */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-surface-900">
            Taxonomy Management
          </h1>
          <p className="text-caption text-surface-500 mt-1">
            Manage categories, tags, featured topics, search synonyms, and
            blocked keywords.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabDefs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        className="mb-6"
      />

      {/* ────── Categories Tab ────── */}
      {activeTab === "categories" && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-surface-200">
            <h2 className="text-subtitle text-surface-800">Categories</h2>
            <button
              onClick={() => openCreateModal("category")}
              className="btn btn-primary btn-sm"
            >
              <IconPlus /> Add Category
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className={TH} style={{ width: 70 }}>Pos</th>
                  <th className={TH}>Name</th>
                  <th className={TH}>Slug</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={6} />
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<IconFolder />}
                        title="No categories yet"
                        description="Add your first category to start organizing content."
                      />
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => (
                    <tr
                      key={cat.id}
                      className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <td className={TD}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              moveItem(
                                "category",
                                categories,
                                cat.id,
                                "up"
                              )
                            }
                            disabled={idx === 0}
                            className="btn btn-ghost btn-icon p-0.5 disabled:opacity-30"
                            title="Move up"
                          >
                            <IconChevronUp />
                          </button>
                          <button
                            onClick={() =>
                              moveItem(
                                "category",
                                categories,
                                cat.id,
                                "down"
                              )
                            }
                            disabled={idx === categories.length - 1}
                            className="btn btn-ghost btn-icon p-0.5 disabled:opacity-30"
                            title="Move down"
                          >
                            <IconChevronDown />
                          </button>
                          <span className="text-micro text-surface-400 ml-1">
                            {cat.position}
                          </span>
                        </div>
                      </td>
                      <td className={`${TD} font-medium text-surface-900`}>
                        {cat.name}
                      </td>
                      <td className={TD}>
                        <code className="text-micro bg-surface-100 px-1.5 py-0.5 rounded">
                          {cat.slug}
                        </code>
                      </td>
                      <td className={TD}>
                        <span className="line-clamp-1">
                          {cat.description || (
                            <span className="text-surface-400 italic">
                              No description
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={TD}>
                        <span
                          className={`badge ${
                            cat.isActive ? "badge-success" : "badge-neutral"
                          }`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`${TD} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal("category", cat)}
                            className="btn btn-ghost btn-icon p-1.5"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() =>
                              requestDelete(cat.id, "category", cat.name)
                            }
                            className="btn btn-ghost btn-icon p-1.5 text-danger-500 hover:text-danger-700"
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
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

      {/* ────── Tags Tab ────── */}
      {activeTab === "tags" && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-surface-200">
            <div className="flex items-center gap-3 flex-1">
              <h2 className="text-subtitle text-surface-800">Tags</h2>
              <div className="relative flex-1 max-w-xs">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags…"
                  className="input pl-9 py-1.5 text-micro"
                />
              </div>
              <select
                value={tagSort}
                onChange={(e) => setTagSort(e.target.value as "name" | "count")}
                className="input py-1.5 text-micro w-auto"
              >
                <option value="count">Sort by count</option>
                <option value="name">Sort by name</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              {selectedTags.size > 0 && (
                <button
                  onClick={() => {
                    setConfirmTitle("Bulk Delete Tags");
                    setConfirmMessage(
                      `Are you sure you want to delete ${selectedTags.size} selected tag(s)? This cannot be undone.`
                    );
                    setConfirmAction(() => () => {
                      bulkDeleteTags();
                      setConfirmOpen(false);
                    });
                    setConfirmOpen(true);
                  }}
                  className="btn btn-danger btn-sm"
                >
                  <IconTrash /> Delete ({selectedTags.size})
                </button>
              )}
              <button
                onClick={() => openCreateModal("tag")}
                className="btn btn-primary btn-sm"
              >
                <IconPlus /> Add Tag
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className={TH} style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredTags.length > 0 &&
                        selectedTags.size === filteredTags.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags(
                            new Set(filteredTags.map((t) => t.id))
                          );
                        } else {
                          setSelectedTags(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-surface-300 text-brand focus:ring-brand"
                    />
                  </th>
                  <th className={TH}>Name</th>
                  <th className={TH}>Slug</th>
                  <th className={TH}>Photo Count</th>
                  <th className={TH}>Video Count</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={6} />
                ) : filteredTags.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<IconTag />}
                        title={
                          tagSearch
                            ? "No matching tags"
                            : "No tags yet"
                        }
                        description={
                          tagSearch
                            ? "Try a different search term."
                            : "Add tags to help users discover content."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTags.map((tag) => (
                    <tr
                      key={tag.id}
                      className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <td className={TD}>
                        <input
                          type="checkbox"
                          checked={selectedTags.has(tag.id)}
                          onChange={(e) => {
                            setSelectedTags((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(tag.id);
                              else next.delete(tag.id);
                              return next;
                            });
                          }}
                          className="w-4 h-4 rounded border-surface-300 text-brand focus:ring-brand"
                        />
                      </td>
                      <td className={`${TD} font-medium text-surface-900`}>
                        {tag.name}
                      </td>
                      <td className={TD}>
                        <code className="text-micro bg-surface-100 px-1.5 py-0.5 rounded">
                          {tag.slug}
                        </code>
                      </td>
                      <td className={TD}>
                        {tag.photosCount.toLocaleString()}
                      </td>
                      <td className={TD}>
                        {tag.videosCount.toLocaleString()}
                      </td>
                      <td className={`${TD} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal("tag", tag)}
                            className="btn btn-ghost btn-icon p-1.5"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() =>
                              requestDelete(tag.id, "tag", tag.name)
                            }
                            className="btn btn-ghost btn-icon p-1.5 text-danger-500 hover:text-danger-700"
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
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

      {/* ────── Featured Topics Tab ────── */}
      {activeTab === "featured-topics" && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-surface-200">
            <h2 className="text-subtitle text-surface-800">
              Featured Topics
            </h2>
            <button
              onClick={() => openCreateModal("featured-topic")}
              className="btn btn-primary btn-sm"
            >
              <IconPlus /> Add Topic
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className={TH} style={{ width: 70 }}>Pos</th>
                  <th className={TH}>Name</th>
                  <th className={TH}>Slug</th>
                  <th className={TH}>Description</th>
                  <th className={TH}>Active</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={6} />
                ) : featuredTopics.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<IconStar />}
                        title="No featured topics"
                        description="Create featured topics to highlight curated collections on the homepage."
                      />
                    </td>
                  </tr>
                ) : (
                  featuredTopics.map((topic, idx) => (
                    <tr
                      key={topic.id}
                      className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <td className={TD}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              moveItem(
                                "featured-topic",
                                featuredTopics,
                                topic.id,
                                "up"
                              )
                            }
                            disabled={idx === 0}
                            className="btn btn-ghost btn-icon p-0.5 disabled:opacity-30"
                          >
                            <IconChevronUp />
                          </button>
                          <button
                            onClick={() =>
                              moveItem(
                                "featured-topic",
                                featuredTopics,
                                topic.id,
                                "down"
                              )
                            }
                            disabled={idx === featuredTopics.length - 1}
                            className="btn btn-ghost btn-icon p-0.5 disabled:opacity-30"
                          >
                            <IconChevronDown />
                          </button>
                          <span className="text-micro text-surface-400 ml-1">
                            {topic.position}
                          </span>
                        </div>
                      </td>
                      <td className={`${TD} font-medium text-surface-900`}>
                        {topic.name}
                      </td>
                      <td className={TD}>
                        <code className="text-micro bg-surface-100 px-1.5 py-0.5 rounded">
                          {topic.slug}
                        </code>
                      </td>
                      <td className={TD}>
                        <span className="line-clamp-1">
                          {topic.description || (
                            <span className="text-surface-400 italic">
                              No description
                            </span>
                          )}
                        </span>
                      </td>
                      <td className={TD}>
                        <button
                          onClick={() =>
                            updateItem(topic.id, "featured-topic", {
                              isActive: !topic.isActive,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            topic.isActive
                              ? "bg-brand"
                              : "bg-surface-300"
                          }`}
                          role="switch"
                          aria-checked={topic.isActive}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${
                              topic.isActive
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </td>
                      <td className={`${TD} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              openEditModal("featured-topic", topic)
                            }
                            className="btn btn-ghost btn-icon p-1.5"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() =>
                              requestDelete(
                                topic.id,
                                "featured-topic",
                                topic.name
                              )
                            }
                            className="btn btn-ghost btn-icon p-1.5 text-danger-500 hover:text-danger-700"
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
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

      {/* ────── Synonyms Tab ────── */}
      {activeTab === "synonyms" && (
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-surface-200">
            <div>
              <h2 className="text-subtitle text-surface-800">
                Search Synonyms
              </h2>
              <p className="text-micro text-surface-500 mt-0.5">
                Define synonym pairs so searching for one term also returns
                results for its synonym.
              </p>
            </div>
            <button
              onClick={() => openCreateModal("synonym")}
              className="btn btn-primary btn-sm"
            >
              <IconPlus /> Add Synonym Pair
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className={TH}>Term</th>
                  <th className={TH}>
                    <div className="flex items-center gap-1">
                      <IconLink />
                      Synonym
                    </div>
                  </th>
                  <th className={TH}>Status</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={4} />
                ) : synonyms.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<IconLink />}
                        title="No synonyms defined"
                        description='Add synonym pairs like "car → automobile" to improve search results.'
                      />
                    </td>
                  </tr>
                ) : (
                  synonyms.map((syn) => (
                    <tr
                      key={syn.id}
                      className="border-b border-surface-100 hover:bg-surface-50 transition-colors"
                    >
                      <td className={`${TD} font-medium text-surface-900`}>
                        {syn.term}
                      </td>
                      <td className={TD}>
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-surface-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                          <span className="font-medium">{syn.synonym}</span>
                        </div>
                      </td>
                      <td className={TD}>
                        <span
                          className={`badge ${
                            syn.isActive ? "badge-success" : "badge-neutral"
                          }`}
                        >
                          {syn.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={`${TD} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal("synonym", syn)}
                            className="btn btn-ghost btn-icon p-1.5"
                            title="Edit"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() =>
                              requestDelete(
                                syn.id,
                                "synonym",
                                `${syn.term} → ${syn.synonym}`
                              )
                            }
                            className="btn btn-ghost btn-icon p-1.5 text-danger-500 hover:text-danger-700"
                            title="Delete"
                          >
                            <IconTrash />
                          </button>
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

      {/* ────── Blocked Keywords Tab ────── */}
      {activeTab === "blocked-keywords" && (
        <div className="card border-danger-200">
          <div className="flex items-center justify-between p-4 border-b border-danger-200 bg-danger-50/50">
            <div>
              <h2 className="text-subtitle text-surface-800 flex items-center gap-2">
                <IconShield />
                Blocked Keywords
              </h2>
              <p className="text-micro text-surface-500 mt-0.5">
                These keywords are blocked from search and tagging. Handle with
                care.
              </p>
            </div>
            <button
              onClick={() => openCreateModal("blocked-keyword")}
              className="btn btn-danger btn-sm"
            >
              <IconPlus /> Add Blocked Keyword
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className={TH}>Keyword</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Added</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton cols={4} />
                ) : blockedKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<IconShield />}
                        title="No blocked keywords"
                        description="Add keywords that should be blocked from search and tagging."
                      />
                    </td>
                  </tr>
                ) : (
                  blockedKeywords.map((kw) => (
                    <tr
                      key={kw.id}
                      className="border-b border-surface-100 hover:bg-danger-50/30 transition-colors"
                    >
                      <td className={`${TD} font-medium text-danger-700`}>
                        <code className="bg-danger-50 px-2 py-0.5 rounded text-micro">
                          {kw.keyword}
                        </code>
                      </td>
                      <td className={TD}>
                        {kw.reason || (
                          <span className="text-surface-400 italic">
                            No reason provided
                          </span>
                        )}
                      </td>
                      <td className={TD}>
                        {new Date(kw.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className={`${TD} text-right`}>
                        <button
                          onClick={() =>
                            requestDelete(
                              kw.id,
                              "blocked-keyword",
                              kw.keyword
                            )
                          }
                          className="btn btn-ghost btn-icon p-1.5 text-danger-500 hover:text-danger-700"
                          title="Delete"
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────── Create / Edit Modal ────── */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
          setFormData({});
        }}
        size="md"
        title={modalTitle()}
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-200">
          <button
            onClick={() => {
              setModalOpen(false);
              setEditingItem(null);
              setFormData({});
            }}
            className="btn btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? "Saving…" : editingItem ? "Update" : "Create"}
          </button>
        </div>
      </Modal>

      {/* ────── Confirm Dialog ────── */}
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
