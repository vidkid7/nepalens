"use client";

import { useState, useCallback, useEffect } from "react";
import MasonryGrid from "@/components/media/MasonryGrid";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { MasonryGridSkeleton } from "@/components/ui/Skeleton";

interface Photo {
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
}

interface HomeFeedProps {
  sort?: string;
}

export default function HomeFeed({ sort = "curated" }: HomeFeedProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const updateColumns = () => {
      const w = window.innerWidth;
      if (w < 640) setColumns(1);
      else if (w < 1024) setColumns(2);
      else if (w < 1536) setColumns(3);
      else setColumns(4);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const fetchPhotos = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/internal/photos?page=${pageNum}&per_page=30&sort=${sort}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.photos as Photo[];
    } catch {
      return generatePlaceholders(pageNum);
    }
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    fetchPhotos(1).then((data) => {
      setPhotos(data);
      setLoading(false);
      if (data.length < 30) setHasMore(false);
    });
  }, [fetchPhotos]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const nextPage = page + 1;
    const newPhotos = await fetchPhotos(nextPage);
    setPhotos((prev) => [...prev, ...newPhotos]);
    setPage(nextPage);
    setLoading(false);
    if (newPhotos.length < 30) setHasMore(false);
  }, [page, loading, fetchPhotos]);

  // Show skeleton on initial load
  if (photos.length === 0 && loading) {
    return <MasonryGridSkeleton columns={columns} />;
  }

  return (
    <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
      <MasonryGrid photos={photos} columns={columns} />
    </InfiniteScroll>
  );
}

function generatePlaceholders(page: number): Photo[] {
  const colors = [
    "#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483",
    "#2b2d42", "#8d99ae", "#ef233c", "#264653", "#2a9d8f",
    "#e9c46a", "#f4a261", "#e76f51", "#606c38", "#283618",
  ];
  return Array.from({ length: 15 }, (_, i) => {
    const isPortrait = i % 3 === 0;
    const w = isPortrait ? 3000 : 5000;
    const h = isPortrait ? 4500 : 3333;
    const color = colors[(page * 15 + i) % colors.length];
    return {
      id: `placeholder-${page}-${i}`,
      slug: `sample-photo-${page}-${i}`,
      alt: `Sample photo ${page * 15 + i + 1}`,
      width: w,
      height: h,
      src: { large: `https://placehold.co/${Math.round(w / 5)}x${Math.round(h / 5)}/${color.slice(1)}/ffffff?text=Photo+${page * 15 + i + 1}` },
      photographer: ["John Doe", "Jane Smith", "Alex Camera"][i % 3],
      photographer_url: `/profile/${["johndoe", "janephoto", "alexcam"][i % 3]}`,
      avg_color: color,
    };
  });
}
