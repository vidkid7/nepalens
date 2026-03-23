"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useSubscription } from "@/hooks/useSubscription";
import BlurHashImage from "@/components/ui/BlurHashImage";
import SaveToCollectionModal from "@/components/collections/SaveToCollectionModal";
import WatermarkOverlay from "@/components/ui/WatermarkOverlay";
import { triggerFileDownload } from "@/lib/download";

interface PhotoCardProps {
  photo: {
    id: string;
    slug: string;
    alt: string | null;
    width: number;
    height: number;
    src: { large: string };
    photographer: string;
    photographer_url: string;
    avg_color: string | null;
    blur_hash?: string | null;
    isPremium?: boolean;
  };
}

export default function PhotoCard({ photo }: PhotoCardProps) {
  const [liked, setLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();
  const { isPro } = useSubscription();
  const router = useRouter();

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      try {
        const res = await fetch(`/api/internal/photos/${photo.id}/like`, { method: "POST" });
        const data = await res.json();
        setLiked(data.liked);
        toast(data.liked ? "Added to liked photos" : "Removed from liked photos", "success");
      } catch {
        toast("Could not update like", "error");
      }
    },
    [session, photo.id, toast]
  );

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Premium images are Pro-only
      if (photo.isPremium && !isPro) {
        if (!session) {
          window.location.href = "/login";
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
          await triggerFileDownload(data.url, `pixelstock-${photo.slug}.jpg`);
          toast("Download started", "success");
        } else {
          toast(data.error || "Download link unavailable", "error");
        }
      } catch (err: any) {
        toast(err.message || "Download failed", "error");
      }
      setDownloading(false);
    },
    [photo.id, photo.slug, photo.isPremium, toast, isPro, router, session]
  );

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setCollectionModalOpen(true);
    },
    [session]
  );

  const showWatermark = !!photo.isPremium && !isPro;

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      onContextMenu={showWatermark ? (e) => e.preventDefault() : undefined}
    >
      <Link href={`/photo/${photo.slug}-${photo.id}`} className="block">
        <BlurHashImage
          src={photo.src?.large || ""}
          alt={photo.alt || "Photo"}
          width={photo.width}
          height={photo.height}
          blurHash={photo.blur_hash}
          bgColor={photo.avg_color}
          className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
      </Link>

      {/* Premium badge */}
      {photo.isPremium && (
        <div className="absolute top-3 left-3 z-30">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
            ⭐ Pro
          </span>
        </div>
      )}

      {/* Watermark overlay for premium images + non-Pro users */}
      {showWatermark && <WatermarkOverlay />}

      {/* Gradient overlay — always subtle, stronger on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

      {/* Top-right actions — visible on hover */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-30">
        <button
          onClick={handleBookmark}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-surface-700 hover:bg-white hover:text-surface-900 transition-all shadow-sm"
          title="Save to collection"
          aria-label="Save to collection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button
          onClick={handleLike}
          className={`p-2 backdrop-blur-sm rounded-lg transition-all shadow-sm ${
            liked
              ? "bg-danger-500 text-white hover:bg-danger-600"
              : "bg-white/90 text-surface-700 hover:bg-white hover:text-danger-500"
          }`}
          title={liked ? "Unlike" : "Like"}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Bottom bar — photographer + download */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-30">
        <Link
          href={photo.photographer_url}
          className="text-caption font-medium text-white hover:underline z-10 truncate max-w-[60%]"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.photographer}
        </Link>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-xs btn-white shadow-sm disabled:opacity-50"
          title="Download"
          aria-label="Download"
        >
          {downloading ? (
            <div className="w-3.5 h-3.5 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Download
        </button>
      </div>

      <SaveToCollectionModal
        open={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        mediaType="photo"
        mediaId={photo.id}
      />
    </div>
  );
}
