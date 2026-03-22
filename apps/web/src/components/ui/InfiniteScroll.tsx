"use client";

import { useEffect, useRef, ReactNode } from "react";
import { MessageLoading } from "@/components/ui/message-loading";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  children: ReactNode;
}

export default function InfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: "600px" } // Trigger earlier for seamless feel
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-4" />
      {loading && hasMore && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-50 rounded-full shadow-sm border border-surface-100">
            <MessageLoading />
            <span className="text-caption text-surface-500 font-medium">Loading more photos</span>
          </div>
        </div>
      )}
      {!hasMore && (
        <div className="flex justify-center py-10">
          <span className="text-caption text-surface-400">You&apos;ve seen it all ✨</span>
        </div>
      )}
    </>
  );
}
