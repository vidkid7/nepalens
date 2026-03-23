"use client";

import { useState, useCallback, useEffect } from "react";
import MasonryGrid from "@/components/media/MasonryGrid";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { MasonryGridSkeleton } from "@/components/ui/Skeleton";

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
  mediaType?: "photo" | "video";
  videoUrl?: string | null;
  duration?: number | null;
}

interface HomeFeedProps {
  sort?: string;
}

export default function HomeFeed({ sort = "curated" }: HomeFeedProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
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

  const fetchFeed = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/internal/feed?page=${pageNum}&per_page=30&sort=${sort}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setError(false);
      return { items: data.items as MediaItem[], hasMore: data.hasMore };
    } catch {
      setError(true);
      return { items: [], hasMore: false };
    }
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    setError(false);
    fetchFeed(1).then(({ items: data, hasMore: more }) => {
      setItems(data);
      setLoading(false);
      setHasMore(more);
    });
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const nextPage = page + 1;
    const { items: newItems, hasMore: more } = await fetchFeed(nextPage);
    setItems((prev) => [...prev, ...newItems]);
    setPage(nextPage);
    setLoading(false);
    setHasMore(more);
  }, [page, loading, fetchFeed]);

  if (items.length === 0 && loading) {
    return <MasonryGridSkeleton columns={columns} />;
  }

  if (items.length === 0 && error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">Unable to load content</h3>
        <p className="text-sm text-surface-500 mb-4">Something went wrong. Please try again.</p>
        <button
          onClick={() => { setError(false); setLoading(true); fetchFeed(1).then(({ items: d }) => { setItems(d); setLoading(false); }); }}
          className="btn btn-sm btn-brand"
        >
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">No content yet</h3>
        <p className="text-sm text-surface-500">Be the first to share your work with the community.</p>
      </div>
    );
  }

  return (
    <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
      <MasonryGrid photos={items} columns={columns} />
    </InfiniteScroll>
  );
}
