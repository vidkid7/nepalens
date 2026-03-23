"use client";

import { useRef, useState, useCallback } from "react";
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
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      setIsHovering(true);
      if (videoRef.current && item.videoUrl) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }, 300);
  }, [item.videoUrl]);

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

  return (
    <Link
      href={`/video/${item.slug}-${item.id}`}
      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100 block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
          isHovering && isVideoReady ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
      />

      {/* Video preview on hover — only loads src when hovering */}
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

      {/* Video indicator badge */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-md">
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          VIDEO
        </span>
        {item.isPremium && (
          <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
            Pro
          </span>
        )}
      </div>

      {/* Duration badge */}
      {item.duration != null && item.duration > 0 && (
        <div className="absolute top-2.5 right-2.5">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-md">
            {formatDuration(item.duration)}
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Photographer name */}
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-caption font-medium text-white truncate">
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
      className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100 block"
    >
      <img
        src={item.thumbnailUrl}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {item.isPremium && (
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
            Pro
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-caption font-medium text-white truncate">
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
