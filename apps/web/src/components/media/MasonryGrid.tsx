"use client";

import { useMemo } from "react";
import PhotoCard from "./PhotoCard";

interface MasonryGridProps {
  photos: Array<{
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
  }>;
  columns?: number;
  gap?: number;
}

export default function MasonryGrid({ photos, columns = 3, gap = 16 }: MasonryGridProps) {
  const columnItems = useMemo(() => {
    const result: (typeof photos)[] = Array.from({ length: columns }, () => []);
    const heights = new Array(columns).fill(0);

    photos.forEach((photo) => {
      const shortestCol = heights.indexOf(Math.min(...heights));
      result[shortestCol].push(photo);
      heights[shortestCol] += photo.height / photo.width;
    });

    return result;
  }, [photos, columns]);

  return (
    <div className="flex" style={{ gap }}>
      {columnItems.map((col, i) => (
        <div key={i} className="flex-1 flex flex-col" style={{ gap }}>
          {col.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      ))}
    </div>
  );
}
