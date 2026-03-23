"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useSubscription } from "@/hooks/useSubscription";
import Avatar from "@/components/ui/Avatar";
import MasonryGrid from "@/components/media/MasonryGrid";
import DownloadModal from "@/components/media/DownloadModal";
import WatermarkOverlay from "@/components/ui/WatermarkOverlay";
import { triggerFileDownload } from "@/lib/download";

interface PhotoData {
  id: string;
  title: string;
  src: string;
  width: number;
  height: number;
  isPremium: boolean;
  photographer: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
  };
  tags: string[];
  likes: number;
  downloads: number;
  views: number;
  camera: string | null;
  iso: number | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  dominantColor: string | null;
}

export default function PhotoDetailClient({
  photo,
  relatedPhotos,
}: {
  photo: PhotoData;
  relatedPhotos: any[];
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { isPro } = useSubscription();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Track view
  useEffect(() => {
    fetch(`/api/internal/photos/${photo.id}/view`, { method: "POST" }).catch(() => {});
  }, [photo.id]);

  const handleLike = useCallback(async () => {
    if (!session) { window.location.href = "/login"; return; }
    try {
      const res = await fetch(`/api/internal/photos/${photo.id}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      toast(data.liked ? "Added to liked photos" : "Removed from liked", "success");
    } catch { toast("Could not update like", "error"); }
  }, [session, photo.id, toast]);

  const handleDownload = useCallback(async () => {
    // Premium images are Pro-only
    if (photo.isPremium && !isPro) {
      if (!session) {
        router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      } else {
        toast("Premium photos are available only for Pro subscribers", "info");
        router.push("/pricing");
      }
      return;
    }
    setDownloading(true);
    const size = isPro ? "original" : "large";
    try {
      const res = await fetch(`/api/internal/photos/${photo.id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      if (data.upgradeRequired) {
        toast(data.message || "Upgrade to Pro to download this photo", "info");
        router.push("/pricing");
        setDownloading(false);
        return;
      }
      if (!res.ok) {
        toast(data.error || data.message || "Download failed", "error");
        setDownloading(false);
        return;
      }
      if (data.url) {
        await triggerFileDownload(data.url, `pixelstock-${photo.id}.jpg`);
        toast("Download started", "success");
      } else {
        toast(data.error || "Download link unavailable", "error");
      }
    } catch (err: any) { toast(err.message || "Download failed", "error"); }
    setDownloading(false);
  }, [photo.id, photo.isPremium, toast, isPro, router, session]);

  const handleFollow = useCallback(async () => {
    if (!session) { window.location.href = "/login"; return; }
    try {
      const res = await fetch(`/api/internal/users/${photo.photographer.username}/follow`, { method: "POST" });
      const data = await res.json();
      setFollowing(data.following);
      toast(data.following ? `Following ${photo.photographer.displayName}` : "Unfollowed", "success");
    } catch { toast("Could not update follow", "error"); }
  }, [session, photo.photographer, toast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: photo.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard", "success");
    }
  }, [photo.title, toast]);

  const relatedForGrid = relatedPhotos.map((p: any) => ({
    id: p.id,
    slug: p.slug || p.id,
    alt: p.altText || p.description,
    width: p.width,
    height: p.height,
    src: {
      large: p.isPremium
        ? `/api/internal/photos/${p.id}/preview?w=1200`
        : p.cdnKey
          ? `${process.env.NEXT_PUBLIC_CDN_URL || ""}/${p.cdnKey}`
          : p.originalUrl || `https://placehold.co/600x400/264653/fff?text=Photo`,
    },
    photographer: p.user?.displayName || "Photographer",
    photographer_url: `/profile/${p.user?.username || "user"}`,
    avg_color: p.dominantColor || "#264653",
    isPremium: p.isPremium || false,
  }));

  const showWatermark = photo.isPremium && !isPro;

  return (
    <div className="pb-16">
      {/* Premium badge */}
      {photo.isPremium && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-1.5 text-sm font-medium">
          ⭐ Premium Photo {!isPro && "— Upgrade to Pro for watermark-free downloads"}
        </div>
      )}

      {/* Hero image */}
      <div
        className="bg-surface-950 flex items-center justify-center min-h-[50vh] max-h-[85vh] relative"
        onContextMenu={showWatermark ? (e) => e.preventDefault() : undefined}
      >
        <img
          src={photo.src}
          alt={photo.title}
          className="max-w-full max-h-[85vh] object-contain"
          style={{
            backgroundColor: photo.dominantColor || "#1a1a1a",
          }}
          draggable={showWatermark ? false : undefined}
          onDragStart={showWatermark ? (e: React.DragEvent) => e.preventDefault() : undefined}
        />
        {showWatermark && <WatermarkOverlay />}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-surface-200">
          {/* Photographer */}
          <div className="flex items-center gap-3">
            <Link href={`/profile/${photo.photographer.username}`}>
              <Avatar
                src={photo.photographer.avatarUrl}
                name={photo.photographer.displayName}
                size="lg"
              />
            </Link>
            <div>
              <Link
                href={`/profile/${photo.photographer.username}`}
                className="text-subtitle text-surface-900 hover:underline block"
              >
                {photo.photographer.displayName}
              </Link>
              <button
                onClick={handleFollow}
                className={`text-caption transition-colors ${
                  following ? "text-surface-500" : "text-brand hover:text-brand-600"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => toast("Save to collection coming soon", "info")} className="btn btn-sm btn-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Collect
            </button>
            <button onClick={handleLike} className={`btn btn-sm ${liked ? "btn-danger" : "btn-outline"}`}>
              <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {liked ? "Liked" : "Like"}
            </button>
            <button onClick={handleShare} className="btn btn-sm btn-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`btn btn-md ${
                !photo.isPremium || isPro
                  ? "btn-primary"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-lg px-4 py-2 font-semibold text-sm"
              }`}
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {!photo.isPremium ? "Free Download" : isPro ? "Pro Download" : "Download"}
            </button>
            <button
              onClick={() => setShowDownloadModal(true)}
              className="btn btn-sm btn-outline"
              title="Choose download size"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-title text-surface-900 mb-2">{photo.title}</h1>
              {/* Stats */}
              <div className="flex items-center gap-4 text-caption text-surface-500">
                <span>{photo.views.toLocaleString()} views</span>
                <span>{photo.downloads.toLocaleString()} downloads</span>
                <span>{photo.likes.toLocaleString()} likes</span>
              </div>
            </div>

            {/* Tags */}
            {photo.tags.length > 0 && (
              <div>
                <h3 className="text-label text-surface-600 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <Link key={tag} href={`/search/${tag}`} className="chip">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* License */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2 text-emerald-800 font-medium text-caption">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free to use
              </div>
              <p className="text-caption text-emerald-700 mt-1">
                No attribution required.{" "}
                <Link href="/license" className="underline">
                  Learn more about the license
                </Link>
              </p>
            </div>

            {/* Report */}
            <div>
              <button className="text-micro text-surface-400 hover:text-surface-600 transition-colors">
                Report this photo
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-5 space-y-4">
              <h2 className="text-label text-surface-900">Photo details</h2>
              <dl className="space-y-3">
                <MetaRow label="Resolution" value={`${photo.width} × ${photo.height}`} />
                <MetaRow label="Orientation" value={photo.width > photo.height ? "Landscape" : photo.width < photo.height ? "Portrait" : "Square"} />
                {photo.camera && <MetaRow label="Camera" value={photo.camera} />}
                {photo.aperture && <MetaRow label="Aperture" value={`f/${photo.aperture}`} />}
                {photo.shutterSpeed && <MetaRow label="Shutter speed" value={photo.shutterSpeed} />}
                {photo.iso && <MetaRow label="ISO" value={String(photo.iso)} />}
                {photo.focalLength && <MetaRow label="Focal length" value={`${photo.focalLength}mm`} />}
                {photo.dominantColor && (
                  <div className="flex items-center justify-between text-caption">
                    <dt className="text-surface-500">Color</dt>
                    <dd className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-surface-200" style={{ backgroundColor: photo.dominantColor }} />
                      <span className="text-surface-700 font-mono text-micro">{photo.dominantColor}</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Download sizes */}
            <div className="card p-5 space-y-3">
              <h2 className="text-label text-surface-900">Download</h2>
              {[
                { label: "Original", size: `${photo.width} × ${photo.height}`, key: "original" },
                { label: "Large", size: "1920 × 1280", key: "large" },
                { label: "Medium", size: "1280 × 853", key: "medium" },
                { label: "Small", size: "640 × 427", key: "small" },
              ].map((variant) => (
                <button
                  key={variant.label}
                  onClick={() => setShowDownloadModal(true)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-50 transition-colors text-caption"
                >
                  <span className="text-surface-700 font-medium">{variant.label}</span>
                  <span className="text-surface-400">{variant.size}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Related photos */}
        {relatedForGrid.length > 0 && (
          <div className="mt-16 pt-10 border-t border-surface-200">
            <h2 className="text-title text-surface-900 mb-6">More like this</h2>
            <MasonryGrid photos={relatedForGrid} columns={3} />
          </div>
        )}
      </div>

      {/* Download size modal */}
      <DownloadModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        photo={{
          id: photo.id,
          width: photo.width,
          height: photo.height,
          src: photo.src,
          isPremium: photo.isPremium,
        }}
      />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-caption">
      <dt className="text-surface-500">{label}</dt>
      <dd className="text-surface-700">{value}</dd>
    </div>
  );
}
