import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";
import HomeFeed from "./HomeFeed";
import HomeControls from "./HomeControls";
import CategoryChips from "@/components/home/CategoryChips";
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

/* ─── data fetching ─── */

async function getHeroPhotos() {
  return cached("home:hero:v4", CacheTTL.HOME, async () => {
    try {
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

async function getTrendingCategories(): Promise<CategoryItem[]> {
  return cached("home:categories:v3", CacheTTL.HOME, async () => {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { photosCount: "desc" },
        take: 14,
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

  const [heroPhotos, categories] = await Promise.all([
    getHeroPhotos(),
    getTrendingCategories(),
  ]);

  const heroUrl = heroPhotos[0]?.url || "";

  return (
    <>
      {/* ── Cinematic Hero ── */}
      <section className="relative min-h-[480px] sm:min-h-[560px] flex items-center justify-center overflow-hidden">
        {heroUrl && (
          <img
            src={heroUrl}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Where creativity<br className="hidden sm:block" />
            <span className="text-brand-400"> finds its canvas.</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Discover stunning photos and videos shared by talented creators worldwide — all free to download and use.
          </p>

          <div className="mt-8 flex justify-center">
            <SearchBar autoFocus variant="hero" />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-white/50">Trending:</span>
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
        </div>
      </section>

      {/* ── Navigation Tabs ── */}
      <HomeControls />

      {/* ── Feed Title + Sort + Category Chips ── */}
      <section className="container-app pt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-surface-900">
            Free Stock Photos &amp; Videos
          </h2>
          <div className="flex items-center gap-2">
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

        {categories.length > 0 && (
          <div className="mb-6">
            <CategoryChips categories={categories} />
          </div>
        )}
      </section>

      {/* ── Main Feed (infinite scroll masonry) ── */}
      <section className="container-app pb-16">
        <HomeFeed sort={sort} />
      </section>
    </>
  );
}
