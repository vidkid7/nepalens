"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";

export interface MediaItem {
  id: string;
  type: "photo" | "video";
  slug: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string | null;
  width: number;
  height: number;
  duration?: number | null;
  isPremium?: boolean;
  photographer: string;
  photographerUrl: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoCard({ item }: { item: MediaItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      setIsHovering(true);
    }, 250);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setIsHovering(false);
    setIsVideoReady(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Auto-play when hovering and video is ready
  useEffect(() => {
    if (isHovering && isVideoReady && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isHovering, isVideoReady]);

  return (
    <Link
      href={`/video/${item.slug}-${item.id}`}
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-200 block shadow-sm hover:shadow-xl transition-shadow duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${
          isHovering && isVideoReady ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
      />

      {/* Video preview — src only loads when hovering */}
      {item.videoUrl && (
        <video
          ref={videoRef}
          src={isHovering ? item.videoUrl : undefined}
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={() => setIsVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovering && isVideoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Top-left badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          VIDEO
        </span>
        {item.isPremium && (
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
            Pro
          </span>
        )}
      </div>

      {/* Duration badge */}
      {item.duration != null && item.duration > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-lg">
            {formatDuration(item.duration)}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Photographer */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <p className="text-sm font-medium text-white truncate drop-shadow-sm">
          {item.photographer}
        </p>
      </div>
    </Link>
  );
}

function PhotoCard({ item }: { item: MediaItem }) {
  return (
    <Link
      href={`/photo/${item.slug}-${item.id}`}
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-200 block shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        loading="lazy"
      />

      {item.isPremium && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
            Pro
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <p className="text-sm font-medium text-white truncate drop-shadow-sm">
          {item.photographer}
        </p>
      </div>
    </Link>
  );
}

interface MediaGridProps {
  items: MediaItem[];
}

export default function MediaGrid({ items }: MediaGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {items.map((item) =>
        item.type === "video" ? (
          <VideoCard key={`v-${item.id}`} item={item} />
        ) : (
          <PhotoCard key={`p-${item.id}`} item={item} />
        )
      )}
    </div>
  );
}
