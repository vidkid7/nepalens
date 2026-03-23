"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import PhotoCard from "./PhotoCard";
import VideoCard from "./VideoCard";

interface MediaItem {
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
  // Video-specific fields
  mediaType?: "photo" | "video";
  videoUrl?: string | null;
  duration?: number | null;
}

interface MasonryGridProps {
  photos: MediaItem[];
  columns?: number;
  gap?: number;
}

function AnimatedCard({ item, index }: { item: MediaItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="masonry-item"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.5s ease ${(index % 4) * 0.06}s, transform 0.5s ease ${(index % 4) * 0.06}s`,
      }}
    >
      {item.mediaType === "video" ? (
        <VideoCard video={item} />
      ) : (
        <PhotoCard photo={item} />
      )}
    </div>
  );
}

export default function MasonryGrid({ photos, columns = 3, gap = 16 }: MasonryGridProps) {
  const columnItems = useMemo(() => {
    const result: { item: MediaItem; globalIndex: number }[][] = Array.from(
      { length: columns },
      () => []
    );
    const heights = new Array(columns).fill(0);

    photos.forEach((item, i) => {
      const shortestCol = heights.indexOf(Math.min(...heights));
      if (shortestCol < 0 || shortestCol >= columns) return;
      result[shortestCol].push({ item, globalIndex: i });
      const w = item.width || 1;
      const h = item.height || 1;
      heights[shortestCol] += h / w;
    });

    return result;
  }, [photos, columns]);

  return (
    <div className="flex" style={{ gap }}>
      {columnItems.map((col, i) => (
        <div key={i} className="flex-1 flex flex-col" style={{ gap }}>
          {col.map(({ item, globalIndex }) => (
            <AnimatedCard key={item.id} item={item} index={globalIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}
