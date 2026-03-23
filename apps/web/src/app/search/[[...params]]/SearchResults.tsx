"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import MasonryGrid from "@/components/media/MasonryGrid";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import { MasonryGridSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import Avatar from "@/components/ui/Avatar";

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

interface VideoResult {
  id: string;
  slug: string;
  alt: string | null;
  width: number;
  height: number;
  duration: number | null;
  thumbnail: string;
  videoUrl?: string | null;
  isPremium?: boolean;
  photographer: string;
  photographer_url: string;
  tags: string[];
}

interface UserResult {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  photosCount: number;
  videosCount: number;
}

interface Filters {
  orientation: string;
  size: string;
  color: string;
  sort: string;
  tab: string;
}

interface SearchPageClientProps {
  keyword: string;
  initialFilters: Filters;
}

const COLORS = [
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f97316" },
  { name: "yellow", hex: "#eab308" },
  { name: "green", hex: "#22c55e" },
  { name: "turquoise", hex: "#14b8a6" },
  { name: "blue", hex: "#3b82f6" },
  { name: "violet", hex: "#8b5cf6" },
  { name: "pink", hex: "#ec4899" },
  { name: "brown", hex: "#a16207" },
  { name: "black", hex: "#171717" },
  { name: "gray", hex: "#9ca3af" },
  { name: "white", hex: "#f5f5f5" },
];

const RELATED_TOPICS = [
  "landscape", "sunset", "forest", "ocean", "mountains",
  "flowers", "sky", "urban", "minimal", "abstract",
];

const TAB_KEYS = ["photos", "videos", "users"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function SearchPageClient({ keyword, initialFilters }: SearchPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter state synced with URL
  const [tab, setTab] = useState<TabKey>((initialFilters.tab as TabKey) || "photos");
  const [orientation, setOrientation] = useState(initialFilters.orientation);
  const [size, setSize] = useState(initialFilters.size);
  const [color, setColor] = useState(initialFilters.color);
  const [sort, setSort] = useState(initialFilters.sort);

  // Results state
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({ photos: 0, videos: 0, users: 0 });
  const [columns, setColumns] = useState(3);

  // Read filters from URL on back/forward
  useEffect(() => {
    const urlTab = searchParams.get("tab") || "photos";
    const urlOrientation = searchParams.get("orientation") || "";
    const urlSize = searchParams.get("size") || "";
    const urlColor = searchParams.get("color") || "";
    const urlSort = searchParams.get("sort") || "";

    setTab(urlTab as TabKey);
    setOrientation(urlOrientation);
    setSize(urlSize);
    setColor(urlColor);
    setSort(urlSort);
  }, [searchParams]);

  // Responsive columns
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

  // Sync state to URL
  const updateURL = useCallback(
    (newFilters: Partial<Filters>) => {
      const params = new URLSearchParams();
      const finalTab = newFilters.tab ?? tab;
      const finalOrientation = newFilters.orientation ?? orientation;
      const finalSize = newFilters.size ?? size;
      const finalColor = newFilters.color ?? color;
      const finalSort = newFilters.sort ?? sort;

      if (finalTab && finalTab !== "photos") params.set("tab", finalTab);
      if (finalOrientation) params.set("orientation", finalOrientation);
      if (finalSize) params.set("size", finalSize);
      if (finalColor) params.set("color", finalColor);
      if (finalSort) params.set("sort", finalSort);

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, tab, orientation, size, color, sort]
  );

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      const update: Partial<Filters> = { [key]: value };

      switch (key) {
        case "tab":
          setTab(value as TabKey);
          break;
        case "orientation":
          setOrientation(value);
          break;
        case "size":
          setSize(value);
          break;
        case "color":
          setColor(value);
          break;
        case "sort":
          setSort(value);
          break;
      }

      updateURL(update);
    },
    [updateURL]
  );

  // Fetch results
  const fetchResults = useCallback(
    async (pageNum: number) => {
      const params = new URLSearchParams({
        page: String(pageNum),
        per_page: "30",
        tab,
      });
      if (keyword) params.set("q", keyword);
      if (orientation) params.set("orientation", orientation);
      if (size) params.set("size", size);
      if (color) params.set("color", color);
      if (sort) params.set("sort", sort);

      try {
        const res = await fetch(`/api/internal/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setCounts(data.counts || { photos: 0, videos: 0, users: 0 });
        setTotal(data.total_results || 0);
        return data.results || [];
      } catch {
        return [];
      }
    },
    [keyword, tab, orientation, size, color, sort]
  );

  // Refetch on filter changes
  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    setLoading(true);
    fetchResults(1).then((data) => {
      setResults(data);
      setLoading(false);
      setInitialLoading(false);
      if (data.length < 30) setHasMore(false);
    });
  }, [keyword, tab, fetchResults]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const nextPage = page + 1;
    const newResults = await fetchResults(nextPage);
    setResults((prev) => [...prev, ...newResults]);
    setPage(nextPage);
    setLoading(false);
    if (newResults.length < 30) setHasMore(false);
  }, [page, loading, fetchResults]);

  return (
    <div>
      {/* Search Header */}
      <div className="container-app pt-8 pb-4">
        <h1 className="text-display text-surface-900 mb-1">
          {keyword ? (
            <>
              Free <span className="capitalize">{keyword}</span>{" "}
              {tab === "photos" ? "Photos" : tab === "videos" ? "Videos" : "Users"}
            </>
          ) : (
            <>
              {tab === "videos" ? "Browse Videos" : tab === "users" ? "Browse Users" : "Browse Photos"}
            </>
          )}
        </h1>
        {keyword ? (
          <p className="text-caption text-surface-500">
            Download free {keyword} stock photos and videos
          </p>
        ) : (
          <p className="text-caption text-surface-500">
            {tab === "videos"
              ? "Explore our collection of free stock videos"
              : tab === "users"
                ? "Discover talented creators"
                : "Explore our collection of free stock photos"}
          </p>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="sticky top-16 z-sticky bg-white border-b border-surface-200">
        <div className="container-app">
          <div className="flex items-center gap-6 mb-0">
            <div className="flex gap-0">
              {TAB_KEYS.map((key) => {
                const labels: Record<TabKey, string> = {
                  photos: "Photos",
                  videos: "Videos",
                  users: "Users",
                };
                const count = counts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => handleFilterChange("tab", key)}
                    className={`px-4 py-3 text-caption font-medium border-b-2 transition-colors ${
                      tab === key
                        ? "border-surface-900 text-surface-900"
                        : "border-transparent text-surface-500 hover:text-surface-700"
                    }`}
                  >
                    {labels[key]}
                    {count > 0 && (
                      <span className="ml-1.5 text-micro text-surface-400">
                        {count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filters bar — only for photos and videos */}
      {tab !== "users" && (
        <div className="bg-surface-50 border-b border-surface-200">
          <div className="container-app py-3 flex items-center gap-3 overflow-x-auto">
            <FilterSelect
              label="Orientation"
              value={orientation}
              onChange={(v) => handleFilterChange("orientation", v)}
              options={[
                { value: "landscape", label: "Landscape" },
                { value: "portrait", label: "Portrait" },
                { value: "square", label: "Square" },
              ]}
            />
            {tab === "photos" && (
              <FilterSelect
                label="Size"
                value={size}
                onChange={(v) => handleFilterChange("size", v)}
                options={[
                  { value: "large", label: "Large (24MP+)" },
                  { value: "medium", label: "Medium (12MP+)" },
                  { value: "small", label: "Small" },
                ]}
              />
            )}
            <FilterSelect
              label="Sort by"
              value={sort}
              onChange={(v) => handleFilterChange("sort", v)}
              options={[
                { value: "relevant", label: "Most Relevant" },
                { value: "popular", label: "Most Popular" },
                { value: "newest", label: "Newest" },
              ]}
            />

            {/* Color picker — photos only */}
            {tab === "photos" && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-surface-200">
                <span className="text-micro text-surface-500 mr-1">Color</span>
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() =>
                      handleFilterChange("color", color === c.name ? "" : c.name)
                    }
                    className={`w-5 h-5 rounded-full border border-surface-200 transition-all ${
                      color === c.name
                        ? "ring-2 ring-brand ring-offset-1 scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Filter by ${c.name}`}
                  />
                ))}
                {color && (
                  <button
                    onClick={() => handleFilterChange("color", "")}
                    className="ml-1 p-0.5 rounded text-surface-400 hover:text-surface-600"
                    title="Clear color"
                    aria-label="Clear color filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related topics */}
      {keyword && (
        <div className="container-app pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {RELATED_TOPICS.map((topic) => (
              <a key={topic} href={`/search/${topic}`} className="chip flex-shrink-0">
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <section className="container-app py-6">
        {initialLoading ? (
          tab === "users" ? (
            <UsersSkeleton />
          ) : (
            <MasonryGridSkeleton columns={columns} />
          )
        ) : !loading && results.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            title={keyword ? `No ${tab} found for "${keyword}"` : `No ${tab} found`}
            description={keyword ? "Try different keywords or remove search filters" : "Check back later for new content"}
            action={
              <a href="/discover" className="btn btn-sm btn-primary">
                Explore trending
              </a>
            }
          />
        ) : tab === "photos" ? (
          <PhotoResults
            results={results as Photo[]}
            total={total}
            keyword={keyword}
            hasMore={hasMore}
            loading={loading}
            loadMore={loadMore}
            columns={columns}
          />
        ) : tab === "videos" ? (
          <VideoResults
            results={results as VideoResult[]}
            total={total}
            keyword={keyword}
            hasMore={hasMore}
            loading={loading}
            loadMore={loadMore}
          />
        ) : (
          <UserResults
            results={results as UserResult[]}
            total={total}
            keyword={keyword}
            hasMore={hasMore}
            loading={loading}
            loadMore={loadMore}
          />
        )}
      </section>
    </div>
  );
}

/* ─── Photo Results ───────────────────────────────────────────── */

function PhotoResults({
  results,
  total,
  keyword,
  hasMore,
  loading,
  loadMore,
  columns,
}: {
  results: Photo[];
  total: number;
  keyword: string;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  columns: number;
}) {
  return (
    <>
      {total > 0 && (
        <p className="text-caption text-surface-500 mb-5">
          {total.toLocaleString()} free photo{total !== 1 ? "s" : ""}
          {keyword ? <> for &ldquo;{keyword}&rdquo;</> : ""}
        </p>
      )}
      <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
        <MasonryGrid photos={results} columns={columns} />
      </InfiniteScroll>
    </>
  );
}

/* ─── Video Card with hover-to-play ──────────────────────────── */

function VideoCard({ video }: { video: VideoResult }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setIsHovered(false);
    setIsVideoReady(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Trigger load when hover starts so the browser fetches the video
  useEffect(() => {
    if (isHovered && videoRef.current && video.videoUrl) {
      videoRef.current.load();
    }
  }, [isHovered, video.videoUrl]);

  // Play when video is loaded and we're still hovering
  useEffect(() => {
    if (isHovered && isVideoReady && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isHovered, isVideoReady]);

  return (
    <Link
      href={`/video/${video.slug}-${video.id}`}
      className="group relative rounded-xl overflow-hidden bg-surface-100 aspect-video block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail (always visible, fades out when video plays) */}
      <img
        src={video.thumbnail}
        alt={video.alt || video.slug}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isHovered && isVideoReady ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
      />

      {/* Video element for hover preview */}
      {video.videoUrl && (
        <video
          ref={videoRef}
          src={isHovered ? video.videoUrl : undefined}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered && isVideoReady ? "opacity-100" : "opacity-0"
          }`}
          muted
          loop
          playsInline
          preload="none"
          onCanPlay={() => setIsVideoReady(true)}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Video icon badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
        {video.isPremium && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
            ⭐ Pro
          </span>
        )}
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-md ring-1 ring-white/30 text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
          <svg className="w-3.5 h-3.5 ml-[1px]" viewBox="0 0 16 16" fill="none">
            <path d="M4.5 2.8C4.5 2.3 5.1 2 5.5 2.3l7.2 5.2c.4.3.4.8 0 1l-7.2 5.2c-.4.3-1 0-1-.5V2.8z" fill="currentColor" />
          </svg>
        </span>
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <p className="text-caption text-white font-medium truncate">
          {video.alt || video.slug}
        </p>
        <p className="text-micro text-white/70">{video.photographer}</p>
      </div>
    </Link>
  );
}

/* ─── Video Results ───────────────────────────────────────────── */

function VideoResults({
  results,
  total,
  keyword,
  hasMore,
  loading,
  loadMore,
}: {
  results: VideoResult[];
  total: number;
  keyword: string;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}) {
  return (
    <>
      {total > 0 && (
        <p className="text-caption text-surface-500 mb-5">
          {total.toLocaleString()} free video{total !== 1 ? "s" : ""}
          {keyword ? <> for &ldquo;{keyword}&rdquo;</> : ""}
        </p>
      )}
      <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </InfiniteScroll>
    </>
  );
}

/* ─── User Results ────────────────────────────────────────────── */

function UserResults({
  results,
  total,
  keyword,
  hasMore,
  loading,
  loadMore,
}: {
  results: UserResult[];
  total: number;
  keyword: string;
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}) {
  return (
    <>
      {total > 0 && (
        <p className="text-caption text-surface-500 mb-5">
          {total.toLocaleString()} users matching &ldquo;{keyword}&rdquo;
        </p>
      )}
      <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <Avatar
                src={user.avatarUrl}
                name={user.displayName}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="text-subtitle text-surface-900 truncate">
                  {user.displayName}
                </p>
                <p className="text-micro text-surface-500 truncate">@{user.username}</p>
                {user.bio && (
                  <p className="text-caption text-surface-600 mt-1 line-clamp-2">
                    {user.bio}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-micro text-surface-400">
                  <span>{(user.followersCount ?? 0).toLocaleString()} followers</span>
                  <span>{user.photosCount ?? 0} photos</span>
                  {(user.videosCount ?? 0) > 0 && <span>{user.videosCount} videos</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </InfiniteScroll>
    </>
  );
}

/* ─── Skeletons ───────────────────────────────────────────────── */

function UsersSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 flex items-start gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-surface-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 w-24 rounded bg-surface-200 mb-2" />
            <div className="h-3 w-16 rounded bg-surface-200 mb-3" />
            <div className="h-3 w-full rounded bg-surface-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── FilterSelect ────────────────────────────────────────────── */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative flex-shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none px-3.5 py-2 pr-8 bg-white border border-surface-200 rounded-lg text-caption text-surface-700 cursor-pointer hover:border-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
