"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

export interface CategoryItem {
  name: string;
  slug: string;
  count: number;
  thumbnailUrl: string | null;
}

interface CategoryChipsProps {
  categories: CategoryItem[];
}

export default function CategoryChips({ categories }: CategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -280 : 280;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative group/scroll">
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-surface-600 hover:text-surface-900 transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable chips */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/search/${cat.slug}`}
            className="flex items-center gap-2.5 flex-shrink-0 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-full pl-1 pr-4 py-1 transition-colors"
          >
            {/* Circular thumbnail */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-200 flex-shrink-0">
              {cat.thumbnailUrl ? (
                <img
                  src={cat.thumbnailUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-caption font-medium text-surface-800 whitespace-nowrap">
                {cat.name}
              </span>
              <span className="text-micro text-surface-400 whitespace-nowrap">
                {cat.count.toLocaleString()}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Right fade + arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-md rounded-full flex items-center justify-center text-surface-600 hover:text-surface-900 transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
