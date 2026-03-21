"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";

/* ───────── Types ───────── */

interface HeroImage {
  id: string;
  photoId: string;
  userId: string | null;
  displayDate: string;
  isActive: boolean;
  createdAt: string;
  photo: {
    id: string;
    slug: string;
    altText: string | null;
    originalUrl: string;
    width: number;
    height: number;
    user: {
      id: string;
      username: string;
      displayName: string | null;
    };
  };
}

interface SponsorPlacement {
  id: string;
  name: string;
  slot: string;
  imageUrl: string | null;
  linkUrl: string | null;
  impressions: number;
  clicks: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

type CmsType = "hero-image" | "sponsor-placement";
type TabId = "hero-images" | "sponsors" | "announcements" | "seo";

/* ───────── Helpers ───────── */

const TH = "px-4 py-3 text-left text-micro font-semibold text-surface-500 uppercase tracking-wider";
const TD = "px-4 py-3 text-caption text-surface-700";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateInput(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

function ctr(impressions: number, clicks: number): string {
  if (!impressions) return "0.00%";
  return ((clicks / impressions) * 100).toFixed(2) + "%";
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
function IconEdit() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>);
}
function IconTrash() {
  return (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
}
function IconImage() {
  return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
}
function IconSponsor() {
  return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>);
}
function IconMegaphone() {
  return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>);
}
function IconGlobe() {
  return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>);
}

/* ───────── Main Page ───────── */

export default function AdminCmsPage() {
  const { toast } = useToast();

  // Data
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [sponsors, setSponsors] = useState<SponsorPlacement[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<TabId>("hero-images");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<CmsType>("hero-image");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  /* ───── Fetch data ───── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setHeroImages(data.heroImages);
      setSponsors(data.sponsorPlacements);
    } catch {
      toast("Failed to load CMS data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ───── CRUD helpers ───── */

  const createItem = useCallback(async (type: CmsType, data: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
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
  }, [toast, fetchData]);

  const updateItem = useCallback(async (id: string, type: CmsType, data: Record<string, any>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cms/${id}`, {
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
  }, [toast, fetchData]);

  const deleteItem = useCallback(async (id: string, type: CmsType) => {
    try {
      const res = await fetch(`/api/admin/cms/${id}`, {
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
  }, [toast, fetchData]);

  const toggleActive = useCallback(async (id: string, type: CmsType, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/cms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: { isActive: !currentActive } }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      toast(`Item ${!currentActive ? "activated" : "deactivated"}`, "success");
      fetchData();
    } catch {
      toast("Failed to toggle active state", "error");
    }
  }, [toast, fetchData]);

  const requestDelete = (id: string, type: CmsType, label: string) => {
    setConfirmTitle("Delete Item");
    setConfirmMessage(`Are you sure you want to delete "${label}"? This action cannot be undone.`);
    setConfirmAction(() => () => {
      deleteItem(id, type);
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  };

  /* ───── Modal openers ───── */

  const openCreateModal = (type: CmsType) => {
    setEditingItem(null);
    setEditingType(type);
    setFormData(type === "hero-image" ? { isActive: true } : { isActive: true });
    setModalOpen(true);
  };

  const openEditModal = (type: CmsType, item: any) => {
    setEditingItem(item);
    setEditingType(type);
    if (type === "hero-image") {
      setFormData({
        photoId: item.photoId,
        displayDate: formatDateInput(item.displayDate),
        isActive: item.isActive,
      });
    } else {
      setFormData({
        name: item.name,
        slot: item.slot,
        imageUrl: item.imageUrl || "",
        linkUrl: item.linkUrl || "",
        isActive: item.isActive,
        startsAt: formatDateInput(item.startsAt),
        endsAt: formatDateInput(item.endsAt),
      });
    }
    setModalOpen(true);
  };

  /* ───── Form submission ───── */

  const handleSubmit = () => {
    if (editingType === "hero-image") {
      if (!formData.photoId || !formData.displayDate) {
        toast("Photo ID and display date are required", "error");
        return;
      }
    } else {
      if (!formData.name?.trim() || !formData.slot?.trim()) {
        toast("Name and slot are required", "error");
        return;
      }
    }

    if (editingItem) {
      updateItem(editingItem.id, editingType, formData);
    } else {
      createItem(editingType, formData);
    }
  };

  /* ───── Tabs ───── */

  const tabDefs = [
    { id: "hero-images" as TabId, label: "Hero Images", count: heroImages.length, icon: <IconImage /> },
    { id: "sponsors" as TabId, label: "Sponsor Placements", count: sponsors.length, icon: <IconSponsor /> },
    { id: "announcements" as TabId, label: "Announcements", icon: <IconMegaphone /> },
    { id: "seo" as TabId, label: "SEO Defaults", icon: <IconGlobe /> },
  ];

  /* ───── Render form fields ───── */

  const renderFormFields = () => {
    if (editingType === "hero-image") {
      return (
        <div className="space-y-4">
          <div>
            <label className="form-label">Photo ID *</label>
            <input
              className="input"
              value={formData.photoId || ""}
              onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, photoId: e.target.value }))}
              placeholder="Enter photo ID (e.g., clu1abc...)"
            />
            <p className="text-micro text-surface-400 mt-1">The ID of the photo to display as hero image</p>
          </div>
          <div>
            <label className="form-label">Display Date *</label>
            <input
              type="date"
              className="input"
              value={formData.displayDate || ""}
              onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, displayDate: e.target.value }))}
            />
            <p className="text-micro text-surface-400 mt-1">Each display date must be unique</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
            </label>
            <span className="text-caption text-surface-700">Active</span>
          </div>
        </div>
      );
    }

    // sponsor-placement
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Name *</label>
            <input className="input" value={formData.name || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, name: e.target.value }))} placeholder="Sponsor name" />
          </div>
          <div>
            <label className="form-label">Slot *</label>
            <select className="input" value={formData.slot || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, slot: e.target.value }))}>
              <option value="">Select slot...</option>
              <option value="hero-banner">Hero Banner</option>
              <option value="sidebar">Sidebar</option>
              <option value="feed-inline">Feed Inline</option>
              <option value="search-results">Search Results</option>
              <option value="footer">Footer</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Image URL</label>
          <input className="input" value={formData.imageUrl || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
          {formData.imageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border border-surface-200 max-h-32">
              <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-contain bg-surface-50" />
            </div>
          )}
        </div>
        <div>
          <label className="form-label">Link URL</label>
          <input className="input" value={formData.linkUrl || ""} onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." />
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
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData((f: Record<string, any>) => ({ ...f, isActive: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
          </label>
          <span className="text-caption text-surface-700">Active</span>
        </div>
      </div>
    );
  };

  /* ───────── Render ───────── */

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-h4 font-bold text-surface-900">Content Management</h1>
        <p className="text-caption text-surface-500 mt-1">Manage hero images, sponsor placements, and site content</p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabDefs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        variant="underline"
        size="md"
        className="mb-6"
      />

      {/* ─── Hero Images Tab ─── */}
      {activeTab === "hero-images" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body font-semibold text-surface-800">Hero Images</h2>
            <button onClick={() => openCreateModal("hero-image")} className="btn btn-primary btn-sm inline-flex items-center gap-2">
              <IconPlus /> Add Hero Image
            </button>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className={TH}>Preview</th>
                    <th className={TH}>Photo Info</th>
                    <th className={TH}>Display Date</th>
                    <th className={TH}>Active</th>
                    <th className={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton cols={5} />
                  ) : heroImages.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <EmptyState icon={<IconImage />} title="No hero images" description="Add hero images to display on the homepage." />
                      </td>
                    </tr>
                  ) : (
                    heroImages.map((hi) => (
                      <tr key={hi.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                        <td className={TD}>
                          <div className="w-24 h-16 rounded-lg overflow-hidden bg-surface-100">
                            <img src={hi.photo.originalUrl} alt={hi.photo.altText || hi.photo.slug} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className={TD}>
                          <p className="font-medium text-surface-800 truncate max-w-[200px]">{hi.photo.altText || hi.photo.slug}</p>
                          <p className="text-micro text-surface-500">by @{hi.photo.user.username} • {hi.photo.width}×{hi.photo.height}</p>
                        </td>
                        <td className={TD}>{formatDate(hi.displayDate)}</td>
                        <td className={TD}>
                          <button
                            onClick={() => toggleActive(hi.id, "hero-image", hi.isActive)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-micro font-medium transition-colors cursor-pointer ${hi.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-surface-200 text-surface-500 hover:bg-surface-300"}`}
                          >
                            {hi.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditModal("hero-image", hi)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700" title="Edit"><IconEdit /></button>
                            <button onClick={() => requestDelete(hi.id, "hero-image", `Hero image for ${formatDate(hi.displayDate)}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" title="Delete"><IconTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sponsors Tab ─── */}
      {activeTab === "sponsors" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body font-semibold text-surface-800">Sponsor Placements</h2>
            <button onClick={() => openCreateModal("sponsor-placement")} className="btn btn-primary btn-sm inline-flex items-center gap-2">
              <IconPlus /> Add Placement
            </button>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className={TH}>Name</th>
                    <th className={TH}>Slot</th>
                    <th className={TH}>Preview</th>
                    <th className={TH}>Link</th>
                    <th className={TH}>Impressions</th>
                    <th className={TH}>Clicks</th>
                    <th className={TH}>CTR</th>
                    <th className={TH}>Active</th>
                    <th className={TH}>Date Range</th>
                    <th className={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton cols={10} />
                  ) : sponsors.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <EmptyState icon={<IconSponsor />} title="No sponsor placements" description="Add sponsor placements to monetize ad slots." />
                      </td>
                    </tr>
                  ) : (
                    sponsors.map((sp) => (
                      <tr key={sp.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                        <td className={TD}>
                          <span className="font-medium text-surface-800">{sp.name}</span>
                        </td>
                        <td className={TD}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-micro font-medium bg-blue-50 text-blue-700">{sp.slot}</span>
                        </td>
                        <td className={TD}>
                          {sp.imageUrl ? (
                            <div className="w-16 h-10 rounded overflow-hidden bg-surface-100">
                              <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <span className="text-micro text-surface-400">No image</span>
                          )}
                        </td>
                        <td className={TD}>
                          {sp.linkUrl ? (
                            <a href={sp.linkUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 text-micro truncate block max-w-[120px]" title={sp.linkUrl}>
                              {new URL(sp.linkUrl).hostname}
                            </a>
                          ) : (
                            <span className="text-micro text-surface-400">—</span>
                          )}
                        </td>
                        <td className={TD}>{sp.impressions.toLocaleString()}</td>
                        <td className={TD}>{sp.clicks.toLocaleString()}</td>
                        <td className={TD}>
                          <span className="font-medium">{ctr(sp.impressions, sp.clicks)}</span>
                        </td>
                        <td className={TD}>
                          <button
                            onClick={() => toggleActive(sp.id, "sponsor-placement", sp.isActive)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-micro font-medium transition-colors cursor-pointer ${sp.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-surface-200 text-surface-500 hover:bg-surface-300"}`}
                          >
                            {sp.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className={TD}>
                          <span className="text-micro">{formatDate(sp.startsAt)} — {formatDate(sp.endsAt)}</span>
                        </td>
                        <td className={TD}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditModal("sponsor-placement", sp)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-surface-700" title="Edit"><IconEdit /></button>
                            <button onClick={() => requestDelete(sp.id, "sponsor-placement", sp.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" title="Delete"><IconTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Announcements Tab (Future) ─── */}
      {activeTab === "announcements" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body font-semibold text-surface-800">Announcement Banner</h2>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="form-label">Announcement Text</label>
                <textarea
                  className="input min-h-[80px]"
                  rows={3}
                  placeholder="Enter site-wide announcement text..."
                  disabled
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer opacity-50">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-9 h-5 bg-surface-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
                </label>
                <span className="text-caption text-surface-500">Show announcement banner</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-caption text-amber-800 flex items-center gap-2">
                <IconMegaphone />
                <span>Announcement banners are coming soon. This feature is under development.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SEO Defaults Tab (Future) ─── */}
      {activeTab === "seo" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body font-semibold text-surface-800">SEO Defaults</h2>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="form-label">Default Meta Title Template</label>
                <input
                  className="input"
                  placeholder="{{page_title}} | PixelStock — Free Stock Photos"
                  disabled
                />
                <p className="text-micro text-surface-400 mt-1">Use {"{{page_title}}"} as a placeholder for dynamic page titles</p>
              </div>
              <div>
                <label className="form-label">Default Meta Description Template</label>
                <textarea
                  className="input min-h-[80px]"
                  rows={3}
                  placeholder="Browse millions of free stock photos on PixelStock. {{page_description}}"
                  disabled
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-caption text-blue-800 flex items-center gap-2">
                <IconGlobe />
                <span>SEO default management is coming soon. This feature is under development.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal ─── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); setFormData({}); }}
        size="lg"
        title={editingItem ? `Edit ${editingType === "hero-image" ? "Hero Image" : "Sponsor Placement"}` : `Add ${editingType === "hero-image" ? "Hero Image" : "Sponsor Placement"}`}
      >
        {renderFormFields()}
        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-surface-100">
          <button onClick={() => { setModalOpen(false); setEditingItem(null); setFormData({}); }} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn btn-primary disabled:opacity-50">
            {saving ? "Saving..." : editingItem ? "Update" : "Create"}
          </button>
        </div>
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
