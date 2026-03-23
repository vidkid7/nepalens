import { prisma } from "@nepalens/database";
import Link from "next/link";
import { Metadata } from "next";
import Avatar from "@/components/ui/Avatar";
import { cached, CacheTTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover — NepaLens",
  description: "Explore curated collections and featured photographers on NepaLens.",
};

export default async function DiscoverPage() {
  let categories: any[] = [];
  let featuredPhotographers: any[] = [];
  let trendingTags: any[] = [];

  try {
    [categories, featuredPhotographers, trendingTags] = await Promise.all([
      cached("discover:categories", CacheTTL.DISCOVER, () =>
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { position: "asc" },
        })
      ),
      cached("discover:photographers", CacheTTL.DISCOVER, () =>
        prisma.user.findMany({
          where: { isContributor: true, isVerified: true },
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            _count: { select: { photos: { where: { status: "approved" } } } },
          },
          orderBy: { followersCount: "desc" },
          take: 8,
        })
      ),
      cached("discover:tags", CacheTTL.DISCOVER, () =>
        prisma.tag.findMany({
          orderBy: { photosCount: "desc" },
          take: 24,
        })
      ),
    ]);
  } catch {
    // DB not available — show empty state
  }

  const gradients = [
    "from-brand to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-orange-500 to-red-500",
    "from-purple-500 to-pink-500",
    "from-yellow-500 to-orange-500",
    "from-cyan-500 to-blue-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-emerald-500",
  ];

  return (
    <div className="container-app py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-hero text-surface-900 mb-3">Discover</h1>
          <p className="text-body text-surface-500 max-w-lg">
            Explore curated categories, trending topics, and featured creators.
          </p>
        </div>

        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-title text-surface-900 mb-6">Browse by Category</h2>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/search/${cat.slug}`}
                  className="relative h-36 rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg transition-all"
                >
                  {cat.coverUrl ? (
                    <>
                      <img
                        src={cat.coverUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradients[i % gradients.length]}`} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-subtitle font-bold group-hover:scale-110 transition-transform drop-shadow-md">
                      {cat.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-surface-50 rounded-2xl p-12 text-center">
              <p className="text-caption text-surface-400">Categories will appear here once added.</p>
            </div>
          )}
        </section>

        {/* Featured Photographers */}
        <section className="mb-16">
          <h2 className="text-title text-surface-900 mb-6">Featured Photographers</h2>
          {featuredPhotographers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featuredPhotographers.map((user: any) => (
                <Link
                  key={user.username}
                  href={`/profile/${user.username}`}
                  className="card p-5 flex flex-col items-center text-center group hover:shadow-card-hover transition-all"
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.displayName || user.username}
                    size="xl"
                  />
                  <p className="text-subtitle font-medium text-surface-900 mt-3 group-hover:text-brand transition-colors">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-micro text-surface-500 mt-1">
                    {user._count.photos} photos
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-surface-50 rounded-2xl p-12 text-center">
              <p className="text-caption text-surface-400">Featured photographers will appear here.</p>
            </div>
          )}
        </section>

        {/* Trending Tags */}
        <section>
          <h2 className="text-title text-surface-900 mb-6">Trending Tags</h2>
          {trendingTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag: any) => (
                <Link key={tag.id} href={`/search/${tag.slug}`} className="chip hover:bg-brand hover:text-white transition-colors">
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-surface-50 rounded-2xl p-12 text-center">
              <p className="text-caption text-surface-400">Tags will appear here as content is uploaded.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
