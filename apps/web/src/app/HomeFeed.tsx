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
  const [error, setError] = useState(false);
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
      setError(false);
      return data.photos as Photo[];
    } catch {
      setError(true);
      return [];
    }
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    setError(false);
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

  if (photos.length === 0 && loading) {
    return <MasonryGridSkeleton columns={columns} />;
  }

  if (photos.length === 0 && error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">Unable to load photos</h3>
        <p className="text-sm text-surface-500 mb-4">Something went wrong. Please try again.</p>
        <button
          onClick={() => { setError(false); setLoading(true); fetchPhotos(1).then(d => { setPhotos(d); setLoading(false); }); }}
          className="btn btn-sm btn-brand"
        >
          Try again
        </button>
      </div>
    );
  }

  if (photos.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">No photos yet</h3>
        <p className="text-sm text-surface-500">Be the first to share your work with the community.</p>
      </div>
    );
  }

  return (
    <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
      <MasonryGrid photos={photos} columns={columns} />
    </InfiniteScroll>
  );
}
