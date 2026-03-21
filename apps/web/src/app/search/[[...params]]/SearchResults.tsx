"use client";

import { useState, useCallback, useEffect } from "react";
import MasonryGrid from "@/components/media/MasonryGrid";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { MasonryGridSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

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
}

interface SearchResultsProps {
  keyword: string;
  filters: { orientation?: string; size?: string; color?: string; sort?: string };
}

export default function SearchResults({ keyword, filters }: SearchResultsProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
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

  const fetchResults = useCallback(
    async (pageNum: number) => {
      const params = new URLSearchParams({ page: String(pageNum), per_page: "30" });
      if (keyword) params.set("q", keyword);
      if (filters.orientation) params.set("orientation", filters.orientation);
      if (filters.size) params.set("size", filters.size);
      if (filters.color) params.set("color", filters.color);
      if (filters.sort) params.set("sort", filters.sort);

      try {
        const res = await fetch(`/api/internal/photos?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setTotal(data.total_results || 0);
        return data.photos as Photo[];
      } catch {
        return [];
      }
    },
    [keyword, filters.orientation, filters.size, filters.color, filters.sort]
  );

  useEffect(() => {
    if (!keyword) {
      setInitialLoading(false);
      return;
    }
    setPhotos([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    setLoading(true);
    fetchResults(1).then((data) => {
      setPhotos(data);
      setLoading(false);
      setInitialLoading(false);
      if (data.length < 30) setHasMore(false);
    });
  }, [keyword, fetchResults]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const nextPage = page + 1;
    const newPhotos = await fetchResults(nextPage);
    setPhotos((prev) => [...prev, ...newPhotos]);
    setPage(nextPage);
    setLoading(false);
    if (newPhotos.length < 30) setHasMore(false);
  }, [page, loading, fetchResults]);

  if (!keyword) {
    return (
      <EmptyState
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        title="Enter a search term"
        description="Search for free stock photos, videos, and creators"
      />
    );
  }

  if (initialLoading) {
    return <MasonryGridSkeleton columns={columns} />;
  }

  if (!loading && photos.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        title={`No results for "${keyword}"`}
        description="Try different keywords or remove search filters"
        action={
          <a href="/discover" className="btn btn-sm btn-primary">
            Explore trending
          </a>
        }
      />
    );
  }

  return (
    <>
      {total > 0 && (
        <p className="text-caption text-surface-500 mb-5">
          {total.toLocaleString()} free photos for &ldquo;{keyword}&rdquo;
        </p>
      )}
      <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
        <MasonryGrid photos={photos} columns={columns} />
      </InfiniteScroll>
    </>
  );
}
