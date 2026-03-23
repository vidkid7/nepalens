import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";
import HomeFeed from "./HomeFeed";
import HomeControls from "./HomeControls";
import MediaGrid from "@/components/home/MediaGrid";
import CategoryChips from "@/components/home/CategoryChips";
import type { MediaItem } from "@/components/home/MediaGrid";
import type { CategoryItem } from "@/components/home/CategoryChips";
import { prisma } from "@pixelstock/database";
import { cached, CacheTTL } from "@/lib/cache";

/* ─── helpers ─── */

function getPhotoUrl(
  photo: { id: string; cdnKey: string | null; originalUrl: string; isPremium?: boolean },
  _size = "large"
) {
  if (photo.isPremium) {
    return `/api/internal/photos/${photo.id}/preview?w=800`;
  }
  if (photo.originalUrl && photo.originalUrl.startsWith("http")) {
    return photo.originalUrl;
  }
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  return photo.cdnKey
    ? `${cdnBase}/${photo.cdnKey}`
    : photo.originalUrl;
}

function getVideoThumbnail(thumbnailUrl: string | null): string {
  if (!thumbnailUrl) return "";
  if (thumbnailUrl.includes("/video/upload/") && !thumbnailUrl.includes("so_0")) {
    return thumbnailUrl
      .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
      .replace(/\.[^.]+$/, ".jpg");
  }
  return thumbnailUrl;
}

/* ─── data fetching ─── */

async function getHeroPhotos() {
  return cached("home:hero:v3", CacheTTL.HOME, async () => {
    try {
      // Prefer non-premium landscape photos for the hero
      const photos = await prisma.photo.findMany({
        where: { status: "approved", isPremium: false, width: { gte: 3000 } },
        take: 5,
        orderBy: { viewsCount: "desc" },
        select: { id: true, cdnKey: true, originalUrl: true, altText: true, isPremium: true },
      });
      return photos.map((p) => ({
        url: getPhotoUrl(p),
        alt: p.altText || "Featured photo",
      }));
    } catch {
      return [];
    }
  });
}

async function getStats() {
  return cached("home:stats", CacheTTL.HOME, async () => {
    try {
      const [photoCount, videoCount, userCount, downloadCount] = await Promise.all([
        prisma.photo.count({ where: { status: "approved" } }),
        prisma.video.count({ where: { status: "approved" } }),
        prisma.user.count(),
        prisma.download.count(),
      ]);
      return { photos: photoCount, videos: videoCount, creators: userCount, downloads: downloadCount };
    } catch {
      return { photos: 0, videos: 0, creators: 0, downloads: 0 };
    }
  });
}

async function getCuratedMedia(): Promise<MediaItem[]> {
  return cached("home:curated:v2", CacheTTL.HOME, async () => {
    try {
      const [photos, videos] = await Promise.all([
        prisma.photo.findMany({
          where: { status: "approved", isCurated: true },
          take: 6,
          orderBy: { curatedAt: "desc" },
          include: { user: { select: { username: true, displayName: true } } },
        }),
        prisma.video.findMany({
          where: { status: "approved" },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { username: true, displayName: true } },
            files: { where: { quality: "sd" }, take: 1 },
          },
        }),
      ]);

      const items: MediaItem[] = [
        ...photos.map((p) => ({
          id: p.id,
          type: "photo" as const,
          slug: p.slug,
          title: p.altText || "Photo",
          thumbnailUrl: getPhotoUrl(p),
          width: p.width,
          height: p.height,
          isPremium: p.isPremium,
          photographer: p.user.displayName || p.user.username,
          photographerUrl: `/profile/${p.user.username}`,
        })),
        ...videos.map((v) => ({
          id: v.id,
          type: "video" as const,
          slug: v.slug,
          title: v.altText || "Video",
          thumbnailUrl: getVideoThumbnail(v.thumbnailUrl),
          videoUrl: v.files[0]?.cdnUrl || null,
          width: v.width,
          height: v.height,
          duration: v.durationSeconds,
          isPremium: v.isPremium,
          photographer: v.user.displayName || v.user.username,
          photographerUrl: `/profile/${v.user.username}`,
        })),
      ];

      // Interleave videos among photos
      const photoItems = items.filter(i => i.type === "photo");
      const videoItems = items.filter(i => i.type === "video");
      const result: MediaItem[] = [];
      let vi = 0;
      for (let i = 0; i < photoItems.length; i++) {
        result.push(photoItems[i]);
        if ((i + 1) % 2 === 0 && vi < videoItems.length) {
          result.push(videoItems[vi++]);
        }
      }
      while (vi < videoItems.length) result.push(videoItems[vi++]);
      return result;
    } catch {
      return [];
    }
  });
}

async function getTrendingMedia(): Promise<MediaItem[]> {
  return cached("home:trending:v2", CacheTTL.HOME, async () => {
    try {
      const [photos, videos] = await Promise.all([
        prisma.photo.findMany({
          where: { status: "approved" },
          take: 6,
          orderBy: { viewsCount: "desc" },
          include: { user: { select: { username: true, displayName: true } } },
        }),
        prisma.video.findMany({
          where: { status: "approved" },
          take: 3,
          orderBy: { viewsCount: "desc" },
          include: {
            user: { select: { username: true, displayName: true } },
            files: { where: { quality: "sd" }, take: 1 },
          },
        }),
      ]);

      const items: MediaItem[] = [
        ...photos.map((p) => ({
          id: p.id,
          type: "photo" as const,
          slug: p.slug,
          title: p.altText || "Photo",
          thumbnailUrl: getPhotoUrl(p),
          width: p.width,
          height: p.height,
          isPremium: p.isPremium,
          photographer: p.user.displayName || p.user.username,
          photographerUrl: `/profile/${p.user.username}`,
        })),
        ...videos.map((v) => ({
          id: v.id,
          type: "video" as const,
          slug: v.slug,
          title: v.altText || "Video",
          thumbnailUrl: getVideoThumbnail(v.thumbnailUrl),
          videoUrl: v.files[0]?.cdnUrl || null,
          width: v.width,
          height: v.height,
          duration: v.durationSeconds,
          isPremium: v.isPremium,
          photographer: v.user.displayName || v.user.username,
          photographerUrl: `/profile/${v.user.username}`,
        })),
      ];

      const photoItems = items.filter(i => i.type === "photo");
      const videoItems = items.filter(i => i.type === "video");
      const result: MediaItem[] = [];
      let vi = 0;
      for (let i = 0; i < photoItems.length; i++) {
        result.push(photoItems[i]);
        if ((i + 1) % 2 === 0 && vi < videoItems.length) {
          result.push(videoItems[vi++]);
        }
      }
      while (vi < videoItems.length) result.push(videoItems[vi++]);
      return result;
    } catch {
      return [];
    }
  });
}

async function getTrendingCategories(): Promise<CategoryItem[]> {
  return cached("home:categories:v2", CacheTTL.HOME, async () => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { photosCount: "desc" },
        take: 12,
        where: { photosCount: { gt: 0 } },
        include: {
          photos: {
            take: 1,
            include: {
              photo: {
                select: { id: true, cdnKey: true, originalUrl: true, isPremium: true },
              },
            },
          },
        },
      });

      return tags.map((t) => {
        const firstPhoto = t.photos[0]?.photo;
        return {
          name: t.name,
          slug: t.slug,
          count: t.photosCount + t.videosCount,
          thumbnailUrl: firstPhoto ? getPhotoUrl(firstPhoto) : null,
        };
      });
    } catch {
      return [];
    }
  });
}

function formatStat(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

/* ─── page ─── */

interface HomePageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams.sort || "curated";

  const [heroPhotos, stats, curatedMedia, trendingMedia, categories] =
    await Promise.all([
      getHeroPhotos(),
      getStats(),
      getCuratedMedia(),
      getTrendingMedia(),
      getTrendingCategories(),
    ]);

  const heroUrl = heroPhotos[0]?.url || "";

  return (
    <>
      {/* ── Cinematic Hero ── */}
      <section className="relative min-h-[520px] sm:min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background image */}
        {heroUrl && (
          <img
            src={heroUrl}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-sm sm:text-base font-medium text-white/70 tracking-widest uppercase mb-4">
            PixelStock — Free to use everywhere
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Where creativity<br className="hidden sm:block" />
            <span className="text-brand-400"> finds its canvas.</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Discover stunning photos and videos shared by talented creators worldwide — all free to download and use.
          </p>

          {/* Search */}
          <div className="mt-8 flex justify-center">
            <SearchBar autoFocus variant="hero" />
          </div>

          {/* Trending topics */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/50">Popular:</span>
            {["Nature", "Architecture", "Portraits", "Travel", "Abstract", "Food"].map(
              (tag) => (
                <Link
                  key={tag}
                  href={`/search/${tag.toLowerCase()}`}
                  className="text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full transition-all"
                >
                  {tag}
                </Link>
              )
            )}
          </div>

          {/* Quick browse buttons */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 bg-white text-surface-900 font-semibold text-sm px-6 py-3 rounded-full hover:bg-white/90 transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Browse Photos
            </Link>
            <Link
              href="/search?tab=videos"
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white/25 transition-colors border border-white/20"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Browse Videos
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Ribbon ── */}
      <section className="bg-surface-50 border-y border-surface-200">
        <div className="container-app py-5">
          <div className="flex items-center justify-center gap-8 sm:gap-16 text-center">
            {[
              { label: "Photos", value: formatStat(stats.photos), icon: "📷" },
              { label: "Videos", value: formatStat(stats.videos), icon: "🎬" },
              { label: "Creators", value: formatStat(stats.creators), icon: "👤" },
              { label: "Downloads", value: formatStat(stats.downloads), icon: "⬇️" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-lg">{stat.icon}</span>
                <div className="text-left">
                  <p className="text-lg sm:text-xl font-bold text-surface-900">{stat.value}</p>
                  <p className="text-xs text-surface-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ── */}
      <HomeControls />

      {/* ── Category Chips ── */}
      {categories.length > 0 && (
        <section className="container-app pt-8 pb-4">
          <CategoryChips categories={categories} />
        </section>
      )}

      {/* ── Editor's Picks ── */}
      {curatedMedia.length > 0 && (
        <section className="container-app py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-surface-900">
                Editor&apos;s Picks
              </h2>
              <p className="text-sm text-surface-500 mt-1">
                Hand-selected photos &amp; videos by our creative team
              </p>
            </div>
            <Link
              href="/discover"
              className="text-sm font-medium text-brand hover:text-brand-600 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              Explore more
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <MediaGrid items={curatedMedia} />
        </section>
      )}

      {/* ── Popular Right Now ── */}
      {trendingMedia.length > 0 && (
        <section className="bg-surface-50 py-10">
          <div className="container-app">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-surface-900">
                  Popular Right Now
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                  Most viewed content from our community
                </p>
              </div>
              <Link
                href="/?sort=popular"
                className="text-sm font-medium text-brand hover:text-brand-600 transition-colors hidden sm:inline-flex items-center gap-1"
              >
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <MediaGrid items={trendingMedia} />
          </div>
        </section>
      )}

      {/* ── Feed Header ── */}
      <section className="container-app pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-surface-900">
            Explore All Media
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-surface-400 uppercase tracking-wider">Sort:</span>
            <Link
              href="/"
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                sort === "curated"
                  ? "bg-surface-900 text-white"
                  : "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
              }`}
            >
              Trending
            </Link>
            <Link
              href="/?sort=newest"
              className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                sort === "newest"
                  ? "bg-surface-900 text-white"
                  : "text-surface-500 hover:text-surface-800 hover:bg-surface-100"
              }`}
            >
              New
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main Feed (infinite scroll) ── */}
      <section className="container-app pb-16">
        <HomeFeed sort={sort} />
      </section>
    </>
  );
}
