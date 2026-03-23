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
  // Convert Cloudinary video URL to a JPG thumbnail
  if (thumbnailUrl.includes("/video/upload/")) {
    return thumbnailUrl
      .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
      .replace(/\.[^.]+$/, ".jpg");
  }
  return thumbnailUrl;
}

/* ─── data fetching ─── */

async function getFeaturedCollections() {
  return cached("home:collections", CacheTTL.HOME, async () => {
    try {
      return await prisma.collection.findMany({
        where: { isPrivate: false },
        take: 2,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { items: true } },
          user: { select: { username: true, displayName: true } },
          items: {
            take: 1,
            orderBy: { position: "asc" },
            where: { mediaType: "photo" },
            include: {
              photo: {
                select: {
                  id: true,
                  cdnKey: true,
                  originalUrl: true,
                  dominantColor: true,
                  isPremium: true,
                },
              },
            },
          },
        },
      });
    } catch {
      return [];
    }
  });
}

async function getCuratedMedia(): Promise<MediaItem[]> {
  return cached("home:curated:media", CacheTTL.HOME, async () => {
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
          take: 2,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { username: true, displayName: true } },
            files: { where: { quality: "sd" }, take: 1 },
          },
        }),
      ]);

      const photoItems: MediaItem[] = photos.map((p) => ({
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
      }));

      const videoItems: MediaItem[] = videos.map((v) => ({
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
      }));

      // Interleave: insert videos after every 3 photos
      const result: MediaItem[] = [];
      let vi = 0;
      for (let i = 0; i < photoItems.length; i++) {
        result.push(photoItems[i]);
        if ((i + 1) % 3 === 0 && vi < videoItems.length) {
          result.push(videoItems[vi++]);
        }
      }
      while (vi < videoItems.length) {
        result.push(videoItems[vi++]);
      }
      return result;
    } catch {
      return [];
    }
  });
}

async function getTrendingMedia(): Promise<MediaItem[]> {
  return cached("home:trending:media", CacheTTL.HOME, async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [photos, videos] = await Promise.all([
        prisma.photo.findMany({
          where: { status: "approved", updatedAt: { gte: weekAgo } },
          take: 6,
          orderBy: { viewsCount: "desc" },
          include: { user: { select: { username: true, displayName: true } } },
        }),
        prisma.video.findMany({
          where: { status: "approved", updatedAt: { gte: weekAgo } },
          take: 2,
          orderBy: { viewsCount: "desc" },
          include: {
            user: { select: { username: true, displayName: true } },
            files: { where: { quality: "sd" }, take: 1 },
          },
        }),
      ]);

      const photoItems: MediaItem[] = photos.map((p) => ({
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
      }));

      const videoItems: MediaItem[] = videos.map((v) => ({
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
      }));

      const result: MediaItem[] = [];
      let vi = 0;
      for (let i = 0; i < photoItems.length; i++) {
        result.push(photoItems[i]);
        if ((i + 1) % 3 === 0 && vi < videoItems.length) {
          result.push(videoItems[vi++]);
        }
      }
      while (vi < videoItems.length) {
        result.push(videoItems[vi++]);
      }
      return result;
    } catch {
      return [];
    }
  });
}

async function getTrendingCategories(): Promise<CategoryItem[]> {
  return cached("home:categories", CacheTTL.HOME, async () => {
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

/* ─── page ─── */

interface HomePageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams.sort || "curated";

  const [collections, curatedMedia, trendingMedia, categories] =
    await Promise.all([
      getFeaturedCollections(),
      getCuratedMedia(),
      getTrendingMedia(),
      getTrendingCategories(),
    ]);

  return (
    <>
      {/* ── Hero Section (white, split layout) ── */}
      <section className="bg-white pt-12 pb-16">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left – headline + search */}
            <div>
              <h1 className="text-hero-sm sm:text-hero text-surface-900 tracking-tight leading-tight">
                The best free stock photos, royalty free images &amp; videos{" "}
                <span className="text-brand">shared by creators.</span>
              </h1>
              <div className="mt-8">
                <SearchBar autoFocus />
              </div>
              <p className="mt-4 text-caption text-surface-400">
                Trending:{" "}
                {["Nature", "Business", "Technology", "Food", "Travel"].map(
                  (tag, i) => (
                    <Link
                      key={tag}
                      href={`/search/${tag.toLowerCase()}`}
                      className="text-surface-500 hover:text-brand transition-colors"
                    >
                      {i > 0 && ", "}
                      {tag}
                    </Link>
                  )
                )}
              </p>
            </div>

            {/* Right – 2 featured collection cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {collections.slice(0, 2).map((col: any) => {
                const coverPhoto = col.items?.[0]?.photo;
                const coverUrl = coverPhoto
                  ? getPhotoUrl(coverPhoto, "medium")
                  : null;
                const bgColor = coverPhoto?.dominantColor || "#374151";

                return (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-100"
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={col.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: bgColor }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-body font-semibold text-white truncate">
                        {col.title}
                      </p>
                      <p className="text-caption text-white/70 mt-0.5">
                        {col._count.items}{" "}
                        {col._count.items === 1 ? "item" : "items"}
                      </p>
                      <span className="inline-flex items-center gap-1 text-caption font-medium text-white mt-2 group-hover:underline">
                        Join
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigation Tabs ── */}
      <HomeControls />

      {/* ── Feed Header + Categories ── */}
      <section className="container-app pt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-title text-surface-900">
            Free Stock Photos &amp; Videos
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-micro text-surface-400">Sort:</span>
            <Link
              href="/"
              className={`text-caption px-3 py-1 rounded-full transition-colors ${
                sort === "curated"
                  ? "bg-surface-900 text-white"
                  : "text-surface-500 hover:text-surface-800"
              }`}
            >
              Trending
            </Link>
            <Link
              href="/?sort=newest"
              className={`text-caption px-3 py-1 rounded-full transition-colors ${
                sort === "newest"
                  ? "bg-surface-900 text-white"
                  : "text-surface-500 hover:text-surface-800"
              }`}
            >
              New
            </Link>
          </div>
        </div>

        {/* Category chips */}
        <div className="mb-8">
          <CategoryChips categories={categories} />
        </div>
      </section>

      {/* ── Curated by our team ── */}
      {curatedMedia.length > 0 && (
        <section className="container-app py-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-title text-surface-900">
                Curated by our team
              </h2>
              <p className="text-caption text-surface-500 mt-1">
                Hand-picked photos &amp; videos by our editors
              </p>
            </div>
            <Link
              href="/search/photos?sort=curated"
              className="text-caption text-surface-500 hover:text-surface-900 transition-colors"
            >
              See all →
            </Link>
          </div>
          <MediaGrid items={curatedMedia} />
        </section>
      )}

      {/* ── Trending this week ── */}
      {trendingMedia.length > 0 && (
        <section className="container-app py-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-title text-surface-900">
                Trending this week
              </h2>
              <p className="text-caption text-surface-500 mt-1">
                Most viewed photos &amp; videos in the last 7 days
              </p>
            </div>
            <Link
              href="/?sort=popular"
              className="text-caption text-surface-500 hover:text-surface-900 transition-colors"
            >
              See all →
            </Link>
          </div>
          <MediaGrid items={trendingMedia} />
        </section>
      )}

      {/* ── Featured Collections ── */}
      {collections.length > 0 && (
        <section className="container-app py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-title text-surface-900">
              Featured Collections
            </h2>
            <Link
              href="/collections"
              className="text-caption text-surface-500 hover:text-surface-900 transition-colors"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {collections.map((col: any) => {
              const coverPhoto = col.items?.[0]?.photo;
              const coverUrl = coverPhoto
                ? getPhotoUrl(coverPhoto, "medium")
                : null;
              const bgColor = coverPhoto?.dominantColor || "#374151";

              return (
                <Link
                  key={col.id}
                  href={`/collections/${col.id}`}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100"
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={col.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: bgColor }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-caption font-medium text-white truncate">
                      {col.title}
                    </p>
                    <p className="text-micro text-white/70">
                      {col._count.items}{" "}
                      {col._count.items === 1 ? "item" : "items"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Main Feed (infinite scroll) ── */}
      <section className="container-app pb-12">
        <HomeFeed sort={sort} />
      </section>
    </>
  );
}
