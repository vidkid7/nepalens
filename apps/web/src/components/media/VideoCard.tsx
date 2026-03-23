"use client";

import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useSubscription } from "@/hooks/useSubscription";
import SaveToCollectionModal from "@/components/collections/SaveToCollectionModal";
import { triggerFileDownload } from "@/lib/download";

interface VideoCardProps {
  video: {
    id: string;
    slug: string;
    alt: string | null;
    width: number;
    height: number;
    src: { large: string };
    photographer: string;
    photographer_url: string;
    avg_color: string | null;
    isPremium?: boolean;
    videoUrl?: string | null;
    duration?: number | null;
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoCard({ video }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [liked, setLiked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: session } = useSession();
  const { toast } = useToast();
  const { isPro } = useSubscription();
  const router = useRouter();

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setIsHovered(false);
    setIsVideoReady(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Trigger load when hover starts so the browser fetches the video
  useEffect(() => {
    if (isHovered && videoRef.current && video.videoUrl) {
      videoRef.current.load();
    }
  }, [isHovered, video.videoUrl]);

  // Play video when it's loaded and we're still hovering
  useEffect(() => {
    if (isHovered && isVideoReady && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isHovered, isVideoReady]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { window.location.href = "/login"; return; }
    try {
      const res = await fetch(`/api/internal/videos/${video.id}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      toast(data.liked ? "Added to liked videos" : "Removed from liked videos", "success");
    } catch { toast("Could not update like", "error"); }
  }, [session, video.id, toast]);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (video.isPremium && !isPro) {
      if (!session) { window.location.href = "/login"; }
      else { toast("Premium videos require a Pro subscription", "info"); router.push("/pricing"); }
      return;
    }
    setDownloading(true);
    try {
      const quality = isPro ? "original" : "sd";
      const res = await fetch(`/api/internal/videos/${video.id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      if (data.upgradeRequired) {
        toast(data.message || "Upgrade to Pro", "info");
        router.push("/pricing");
      } else if (!res.ok) {
        toast(data.error || "Download failed", "error");
      } else if (data.url) {
        await triggerFileDownload(data.url, `pixelstock-${video.slug}.mp4`);
        toast("Download started", "success");
      }
    } catch (err: any) { toast(err.message || "Download failed", "error"); }
    setDownloading(false);
  }, [video.id, video.slug, video.isPremium, toast, isPro, router, session]);

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { window.location.href = "/login"; return; }
    setCollectionModalOpen(true);
  }, [session]);

  const aspectRatio = video.width && video.height ? video.width / video.height : 16 / 9;

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/video/${video.slug}-${video.id}`} className="block">
        <div style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }} className="relative bg-surface-900">
          {/* Thumbnail */}
          <img
            src={video.src.large}
            alt={video.alt || "Video"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isHovered && isVideoReady ? "opacity-0" : "opacity-100"
            }`}
            loading="lazy"
          />
          {/* Video preview on hover */}
          {video.videoUrl && (
            <video
              ref={videoRef}
              src={isHovered ? video.videoUrl : undefined}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isHovered && isVideoReady ? "opacity-100" : "opacity-0"
              }`}
              muted
              loop
              playsInline
              preload="none"
              onCanPlay={() => setIsVideoReady(true)}
            />
          )}
        </div>
      </Link>

      {/* Video indicator (always visible) */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
        {video.isPremium && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
            ⭐ Pro
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold shadow-lg">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          VIDEO
        </span>
      </div>

      {/* Duration badge */}
      {video.duration != null && video.duration > 0 && (
        <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] rounded-md font-semibold z-30">
          {formatDuration(video.duration)}
        </span>
      )}

      {/* Play button center - shows when not playing */}
      {!(isHovered && isVideoReady) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-6 h-6 ml-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

      {/* Top-right actions on hover */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-30"
        style={{ right: video.duration ? "auto" : undefined, left: video.duration ? undefined : undefined }}
      >
        {/* Actions go to the right side, below duration if present */}
      </div>

      {/* Bottom actions on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-30">
        <Link
          href={video.photographer_url}
          className="text-caption font-medium text-white hover:underline z-10 truncate max-w-[60%]"
          onClick={(e) => e.stopPropagation()}
        >
          {video.photographer}
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBookmark}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-surface-700 hover:bg-white hover:text-surface-900 transition-all shadow-sm"
            title="Save to collection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={handleLike}
            className={`p-2 backdrop-blur-sm rounded-lg transition-all shadow-sm ${
              liked ? "bg-danger-500 text-white" : "bg-white/90 text-surface-700 hover:bg-white hover:text-danger-500"
            }`}
            title={liked ? "Unlike" : "Like"}
          >
            <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn-xs btn-white shadow-sm disabled:opacity-50"
            title="Download"
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
      </div>

      <SaveToCollectionModal
        open={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        mediaType="video"
        mediaId={video.id}
      />
    </div>
  );
}
