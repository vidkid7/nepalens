import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";
import HomeFeed from "./HomeFeed";
import HomeControls from "./HomeControls";
import { prisma } from "@pixelstock/database";
import { cached, CacheKeys, CacheTTL } from "@/lib/cache";

const TRENDING_TAGS = [
  "Nature", "City", "Business", "Technology", "Food",
  "Travel", "Animals", "Architecture", "People", "Abstract",
];

function getPhotoUrl(
  photo: { id: string; cdnKey: string | null; originalUrl: string; isPremium?: boolean },
  _size = "large"
) {
  // Premium images go through auth proxy (bakes watermark for non-Pro users)
  if (photo.isPremium) {
    return `/api/internal/photos/${photo.id}/preview?w=800`;
  }
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  return photo.cdnKey
    ? `${cdnBase}/${photo.cdnKey}`
    : photo.originalUrl;
}

async function getHeroImage() {
  return cached(CacheKeys.heroImage(), CacheTTL.HOME, async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const hero = await prisma.heroImage.findFirst({
        where: { isActive: true, displayDate: { lte: today } },
        orderBy: { displayDate: "desc" },
        include: {
          photo: {
            include: { user: { select: { username: true, displayName: true } } },
          },
        },
      });

      if (hero) return hero;

      const featured = await prisma.photo.findFirst({
        where: {
          status: "approved",
          OR: [{ isFeatured: true }, { isCurated: true }],
        },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true, displayName: true } } },
      });

      if (featured) {
        return {
          id: featured.id,
          photo: featured,
          displayDate: featured.createdAt,
        };
      }

      return null;
    } catch {
      return null;
    }
  });
}

async function getFeaturedCollections() {
  return cached("home:collections", CacheTTL.HOME, async () => {
    try {
      const collections = await prisma.collection.findMany({
        where: { isPrivate: false },
        take: 6,
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
      return collections;
    } catch {
      return [];
    }
  });
}

async function getCuratedPhotos() {
  return cached("home:curated", CacheTTL.HOME, async () => {
    try {
      return await prisma.photo.findMany({
        where: { status: "approved", isCurated: true },
        take: 8,
        orderBy: { curatedAt: "desc" },
        include: { user: { select: { username: true, displayName: true } } },
      });
    } catch {
      return [];
    }
  });
}

async function getTrendingPhotos() {
  return cached("home:trending", CacheTTL.HOME, async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      return await prisma.photo.findMany({
        where: { status: "approved", updatedAt: { gte: weekAgo } },
        take: 8,
        orderBy: { viewsCount: "desc" },
        include: { user: { select: { username: true, displayName: true } } },
      });
    } catch {
      return [];
    }
  });
}

interface HomePageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams.sort || "curated";

  const [hero, collections, curatedPhotos, trendingPhotos] = await Promise.all([
    getHeroImage(),
    getFeaturedCollections(),
    getCuratedPhotos(),
    getTrendingPhotos(),
  ]);

  const heroPhotoUrl = hero?.photo
    ? getPhotoUrl(hero.photo, "large2x")
    : null;
  const heroCredit = hero?.photo?.user;

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background — real photo or gradient fallback */}
        <div className="absolute inset-0">
          {heroPhotoUrl ? (
            <>
              <img
                src={heroPhotoUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-[#0c1929] to-[#0a2a1f]" />
              <div className="absolute top-1/4 right-1/4 w-[40vw] h-[40vw] bg-brand/5 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 left-1/4 w-[30vw] h-[30vw] bg-blue-500/5 rounded-full blur-3xl" />
            </>
          )}
        </div>

        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto py-32">
          <h1 className="text-hero-sm sm:text-hero text-white mb-5 tracking-tight">
            The best free stock photos & videos
            <br className="hidden sm:block" />
            <span className="text-brand-300">shared by creators.</span>
          </h1>
          <p className="text-body sm:text-subtitle text-white/60 mb-10 max-w-2xl mx-auto">
            Over millions of high-quality stock images and videos shared by our
            talented community.
          </p>

          {/* Search bar */}
          <div className="flex justify-center mb-8">
            <SearchBar autoFocus />
          </div>

          {/* Trending tags */}
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span className="text-caption text-white/40 mr-1">Trending:</span>
            {TRENDING_TAGS.map((tag) => (
              <Link
                key={tag}
                href={`/search/${tag.toLowerCase()}`}
                className="text-caption text-white/70 hover:text-white px-2.5 py-1 rounded-full hover:bg-white/10 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Photo credit */}
        {heroCredit && (
          <div className="absolute bottom-8 right-8 z-10">
            <Link
              href={`/profile/${heroCredit.username}`}
              className="text-micro text-white/50 hover:text-white/80 transition-colors"
            >
              📷 {heroCredit.displayName || heroCredit.username}
            </Link>
          </div>
        )}

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-soft">
          <svg
            className="w-5 h-5 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* ── Content Type Tabs & Sort ── */}
      <HomeControls sort={sort} />

      {/* ── Curated by our team ── */}
      {curatedPhotos.length > 0 && (
        <section className="container-app py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-title text-surface-900">
                Curated by our team
              </h2>
              <p className="text-caption text-surface-500 mt-1">
                Hand-picked photos by our editors
              </p>
            </div>
            <Link
              href="/search/photos?sort=curated"
              className="text-caption text-surface-500 hover:text-surface-900 transition-colors"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {curatedPhotos.map((photo) => (
              <Link
                key={photo.id}
                href={`/photo/${photo.slug}-${photo.id}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100"
              >
                <img
                  src={getPhotoUrl(photo)}
                  alt={photo.altText || ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-caption font-medium text-white truncate">
                    {photo.user.displayName || photo.user.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Trending this week ── */}
      {trendingPhotos.length > 0 && (
        <section className="container-app py-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-title text-surface-900">
                Trending this week
              </h2>
              <p className="text-caption text-surface-500 mt-1">
                Most viewed photos in the last 7 days
              </p>
            </div>
            <Link
              href="/?sort=popular"
              className="text-caption text-surface-500 hover:text-surface-900 transition-colors"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {trendingPhotos.map((photo) => (
              <Link
                key={photo.id}
                href={`/photo/${photo.slug}-${photo.id}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100"
              >
                <img
                  src={getPhotoUrl(photo)}
                  alt={photo.altText || ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-caption font-medium text-white truncate">
                    {photo.user.displayName || photo.user.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Collections ── */}
      {collections.length > 0 && (
        <section className="container-app py-10">
          <div className="flex items-center justify-between mb-6">
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

      {/* ── Main Feed ── */}
      <section className="container-app pb-12">
        <div className="flex items-center justify-between mb-6 pt-4">
          <h2 className="text-title text-surface-900">Free Stock Photos</h2>
        </div>
        <HomeFeed sort={sort} />
      </section>
    </>
  );
}
