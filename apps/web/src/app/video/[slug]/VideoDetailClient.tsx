"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Avatar from "@/components/ui/Avatar";
import SaveToCollectionModal from "@/components/collections/SaveToCollectionModal";
import ReportContentModal from "@/components/media/ReportContentModal";

interface VideoFile {
  id: string;
  quality: string;
  width: number;
  height: number;
  fps: number | null;
  fileSize: string;
  fileSizeRaw: number;
  url: string;
}

interface VideoData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  width: number;
  height: number;
  duration: number | null;
  durationFormatted: string;
  fps: number | null;
  isPremium: boolean;
  thumbnailUrl: string;
  photographerId?: string;
  photographer: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    followersCount: number;
  };
  files: VideoFile[];
  tags: string[];
  likes: number;
  downloads: number;
  views: number;
}

interface RelatedVideo {
  id: string;
  slug: string;
  title: string;
  width: number;
  height: number;
  duration: number | null;
  thumbnailUrl: string;
  photographer: string;
  photographerUrl: string;
  previewUrl: string | null;
}

const QUALITY_LABELS: Record<string, string> = {
  sd: "SD",
  hd: "HD",
  fhd: "Full HD",
  "4k": "4K",
  uhd: "UHD",
  original: "Original",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoDetailClient({
  video,
  relatedVideos,
}: {
  video: VideoData;
  relatedVideos: RelatedVideo[];
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [liked, setLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Check if current user has Pro subscription
  useEffect(() => {
    if (session?.user) {
      fetch("/api/internal/subscription/status")
        .then((r) => r.ok ? r.json() : { isPro: false })
        .then((data) => setIsPro(data.isPro === true || data.active === true))
        .catch(() => setIsPro(false));
    }
  }, [session]);

  // Track view
  useEffect(() => {
    fetch(`/api/internal/videos/${video.id}/view`, { method: "POST" }).catch(() => {});
  }, [video.id]);

  const handlePlayPause = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleLike = useCallback(async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch(`/api/internal/videos/${video.id}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      toast(data.liked ? "Added to liked videos" : "Removed from liked", "success");
    } catch {
      toast("Could not update like", "error");
    }
  }, [session, video.id, toast]);

  // Qualities that require Pro subscription
  const PRO_ONLY_QUALITIES = ["original", "fhd", "4k", "uhd"];

  const isQualityLocked = useCallback(
    (quality: string) => {
      if (isPro) return false;
      if (video.isPremium) return true;
      return PRO_ONLY_QUALITIES.includes(quality);
    },
    [isPro, video.isPremium]
  );

  const handleDownload = useCallback(
    async (quality: string) => {
      // Client-side guard: premium videos need Pro
      if (video.isPremium && !isPro) {
        toast("Premium videos require a Pro subscription", "error");
        window.location.href = "/pricing";
        return;
      }
      // Client-side guard: high-quality needs Pro
      if (PRO_ONLY_QUALITIES.includes(quality) && !isPro) {
        toast(`${quality.toUpperCase()} quality requires a Pro subscription`, "error");
        window.location.href = "/pricing";
        return;
      }

      setDownloading(quality);
      try {
        const res = await fetch(`/api/internal/videos/${video.id}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quality }),
        });
        const data = await res.json();

        if (res.status === 401 && data.requiresLogin) {
          toast("Please sign in to download", "error");
          window.location.href = "/login";
          return;
        }
        if (res.status === 403 && data.upgradeRequired) {
          toast(data.message || "Pro subscription required", "error");
          window.location.href = "/pricing";
          return;
        }

        if (data.url) {
          // Use file proxy endpoint for proper download with Content-Disposition
          const fileUrl = `/api/internal/videos/${video.id}/file?quality=${encodeURIComponent(quality)}`;
          const response = await fetch(fileUrl);
          if (!response.ok) {
            // Fallback: try direct URL blob download
            const directRes = await fetch(data.url);
            if (!directRes.ok) throw new Error("Download failed");
            const blob = await directRes.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `pixelstock-${video.slug}-${quality}.mp4`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 200);
          } else {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `pixelstock-${video.slug}-${quality}.mp4`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 200);
          }
          toast("Download started", "success");
        } else {
          toast("Download link not available", "error");
        }
      } catch {
        toast("Download failed", "error");
      }
      setDownloading(null);
    },
    [video.id, video.slug, video.isPremium, isPro, toast]
  );

  const handleFollow = useCallback(async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch(
        `/api/internal/users/${video.photographer.username}/follow`,
        { method: "POST" }
      );
      const data = await res.json();
      setFollowing(data.following);
      toast(
        data.following
          ? `Following ${video.photographer.displayName}`
          : "Unfollowed",
        "success"
      );
    } catch {
      toast("Could not update follow", "error");
    }
  }, [session, video.photographer, toast]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: video.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast("Link copied to clipboard", "success");
    }
  }, [video.title, toast]);

  const isOwner = session && (
    (session.user as any)?.id === video.photographerId ||
    (session.user as any)?.isAdmin === true
  );

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/internal/videos/${video.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "Failed to delete video", "error");
        return;
      }
      toast("Video deleted successfully", "success");
      router.push("/");
    } catch {
      toast("Failed to delete video", "error");
    }
  }, [video.id, toast, router]);

  const handleCollect = useCallback(() => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setCollectionModalOpen(true);
  }, [session]);

  // Best quality file for the player
  const bestFile = video.files.length > 0 ? video.files[video.files.length - 1] : null;

  return (
    <div className="pb-16">
      {/* Video Player */}
      <div className="bg-surface-950 flex items-center justify-center min-h-[50vh] max-h-[85vh]">
        <div className="relative w-full max-w-5xl mx-auto aspect-video">
          {bestFile?.url ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                poster={video.thumbnailUrl}
                controls={isPlaying}
                playsInline
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              >
                <source src={bestFile.url} type="video/mp4" />
              </video>
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center group/play"
                  aria-label="Play video"
                >
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover/play:bg-white/30 transition-colors">
                    <svg className="w-10 h-10 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
              <div className="text-center text-white/40">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-caption text-white/60">{video.title}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-surface-200">
          {/* Photographer */}
          <div className="flex items-center gap-3">
            <Link href={`/profile/${video.photographer.username}`}>
              <Avatar
                src={video.photographer.avatarUrl}
                name={video.photographer.displayName}
                size="lg"
              />
            </Link>
            <div>
              <Link
                href={`/profile/${video.photographer.username}`}
                className="text-subtitle text-surface-900 hover:underline block"
              >
                {video.photographer.displayName}
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
            <button onClick={handleCollect} className="btn btn-sm btn-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Collect
            </button>
            <button
              onClick={handleLike}
              className={`btn btn-sm ${liked ? "btn-danger" : "btn-outline"}`}
            >
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
            {isOwner && (
              <button
                onClick={handleDelete}
                className="btn btn-sm border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
            <button
              onClick={() => {
                if (video.isPremium && !isPro) {
                  toast("Premium videos require a Pro subscription", "error");
                  window.location.href = "/pricing";
                  return;
                }
                // Find best free quality for non-Pro
                const freeQualities = ["sd", "hd"];
                const bestFreeFile = video.files.filter(f => freeQualities.includes(f.quality)).pop();
                const defaultQuality = isPro ? (bestFile?.quality || "hd") : (bestFreeFile?.quality || "sd");
                handleDownload(defaultQuality);
              }}
              disabled={downloading !== null}
              className="btn btn-md btn-primary"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {video.isPremium && !isPro ? "⭐ Pro Download" : "Free Download"}
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-title text-surface-900 mb-2">{video.title}</h1>
              {video.description && (
                <p className="text-body text-surface-600 mb-3">{video.description}</p>
              )}
              {/* Stats */}
              <div className="flex items-center gap-4 text-caption text-surface-500">
                <span>{video.views.toLocaleString()} views</span>
                <span>{video.downloads.toLocaleString()} downloads</span>
                <span>{video.likes.toLocaleString()} likes</span>
              </div>
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div>
                <h3 className="text-label text-surface-600 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag) => (
                    <Link key={tag} href={`/search/${tag}`} className="chip">
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* License */}
            {video.isPremium ? (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-800 font-medium text-caption">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Premium Content
                </div>
                <p className="text-caption text-amber-700 mt-1">
                  Pro subscription required.{" "}
                  <Link href="/pricing" className="underline font-medium">
                    View plans
                  </Link>
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800 font-medium text-caption">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Free to use
                </div>
                <p className="text-caption text-emerald-700 mt-1">
                  No attribution required. SD & HD free for all.{" "}
                  <Link href="/license" className="underline">
                    Learn more about the license
                  </Link>
                </p>
              </div>
            )}

            {/* Report */}
            <div>
              <button
                onClick={() => setReportModalOpen(true)}
                className="text-micro text-surface-400 hover:text-surface-600 transition-colors"
              >
                Report this video
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video details */}
            <div className="card p-5 space-y-4">
              <h2 className="text-label text-surface-900">Video details</h2>
              <dl className="space-y-3">
                <MetaRow label="Duration" value={video.durationFormatted} />
                <MetaRow label="Resolution" value={`${video.width} × ${video.height}`} />
                {video.fps && <MetaRow label="Frame rate" value={`${video.fps} fps`} />}
                <MetaRow
                  label="Orientation"
                  value={
                    video.width > video.height
                      ? "Landscape"
                      : video.width < video.height
                        ? "Portrait"
                        : "Square"
                  }
                />
                <MetaRow label="Format" value="MP4" />
              </dl>
            </div>

            {/* Download options */}
            <div className="card p-5 space-y-3">
              <h2 className="text-label text-surface-900">Download</h2>
              {video.isPremium && !isPro && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-2">
                  <p className="text-micro text-amber-800 font-medium">⭐ Premium Video</p>
                  <p className="text-micro text-amber-700 mt-0.5">
                    This video requires a Pro subscription.{" "}
                    <a href="/pricing" className="underline font-medium">Upgrade</a>
                  </p>
                </div>
              )}
              {video.files.length > 0 ? (
                video.files.map((file) => {
                  const locked = isQualityLocked(file.quality);
                  return (
                    <button
                      key={file.id}
                      onClick={() => locked ? (window.location.href = "/pricing") : handleDownload(file.quality)}
                      disabled={downloading === file.quality}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-caption border ${
                        locked
                          ? "border-surface-200 bg-surface-50 opacity-75 hover:bg-surface-100"
                          : "border-surface-100 hover:bg-surface-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {downloading === file.quality ? (
                          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : locked ? (
                          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        <span className={`font-medium ${locked ? "text-surface-500" : "text-surface-700"}`}>
                          {QUALITY_LABELS[file.quality] || file.quality.toUpperCase()}
                        </span>
                        {locked && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-surface-500">
                          {file.width}×{file.height}
                        </span>
                        {file.fileSize !== "—" && (
                          <span className="text-surface-400 ml-2">{file.fileSize}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-caption text-surface-400">No download files available</p>
              )}
              <p className="text-micro text-surface-400 mt-2">
                {video.isPremium
                  ? "Premium content — Pro subscription required."
                  : "SD & HD free for all. FHD+ requires Pro."}
              </p>
            </div>
          </div>
        </div>

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <div className="mt-16 pt-10 border-t border-surface-200">
            <h2 className="text-title text-surface-900 mb-6">More like this</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedVideos.map((rv) => (
                <Link
                  key={rv.id}
                  href={`/video/${rv.slug}-${rv.id}`}
                  className="group relative rounded-xl overflow-hidden bg-surface-100 aspect-video"
                >
                  <img
                    src={rv.thumbnailUrl}
                    alt={rv.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {rv.duration && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 text-white text-micro rounded font-medium">
                      {formatDuration(rv.duration)}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-caption text-white font-medium truncate">{rv.title}</p>
                    <p className="text-micro text-white/70">{rv.photographer}</p>
                  </div>
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-5 h-5 ml-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SaveToCollectionModal
        open={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        mediaType="video"
        mediaId={video.id}
      />
      <ReportContentModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        mediaType="video"
        mediaId={video.id}
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
