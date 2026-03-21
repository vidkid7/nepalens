import Link from "next/link";
import SearchBar from "@/components/search/SearchBar";
import HomeFeed from "./HomeFeed";
import { prisma } from "@pixelstock/database";

const TRENDING_TAGS = [
  "Nature", "City", "Business", "Technology", "Food",
  "Travel", "Animals", "Architecture", "People", "Abstract",
];

const CATEGORIES = [
  { label: "Photos", value: "photos", icon: "📷" },
  { label: "Videos", value: "videos", icon: "🎬" },
];

async function getFeaturedCollections() {
  try {
    const collections = await prisma.collection.findMany({
      where: { isPublic: true },
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
        user: { select: { username: true, displayName: true } },
      },
    });
    return collections;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const collections = await getFeaturedCollections();

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background — gradient with subtle pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-[#0c1929] to-[#0a2a1f]" />
          {/* Decorative circles */}
          <div className="absolute top-1/4 right-1/4 w-[40vw] h-[40vw] bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[30vw] h-[30vw] bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto py-32">
          <h1 className="text-hero-sm sm:text-hero text-white mb-5 tracking-tight">
            The best free stock photos & videos
            <br className="hidden sm:block" />
            <span className="text-brand-300">shared by creators.</span>
          </h1>
          <p className="text-body sm:text-subtitle text-white/60 mb-10 max-w-2xl mx-auto">
            Over millions of high-quality stock images and videos shared by our talented community.
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

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-soft">
          <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ── Content Type Tabs ── */}
      <nav className="sticky top-16 z-sticky bg-white border-b border-surface-200">
        <div className="container-app flex items-center justify-between">
          <div className="flex gap-0">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.value}
                className={`px-5 py-3.5 text-caption font-medium border-b-2 transition-colors ${
                  i === 0
                    ? "border-surface-900 text-surface-900"
                    : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-micro text-surface-400">Sort:</span>
            <select className="text-caption text-surface-600 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-surface-900 transition-colors">
              <option>Curated</option>
              <option>Newest</option>
              <option>Popular</option>
            </select>
          </div>
        </div>
      </nav>

      {/* ── Featured Collections ── */}
      {collections.length > 0 && (
        <section className="container-app py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-title text-surface-900">Featured Collections</h2>
            <Link
              href="/collections"
              className="text-caption text-surface-500 hover:text-surface-900 transition-colors"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {collections.map((col: any) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-caption font-medium text-white truncate">{col.name}</p>
                  <p className="text-micro text-white/70">
                    {col._count.items} {col._count.items === 1 ? "item" : "items"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Main Feed ── */}
      <section className="container-app pb-12">
        <div className="flex items-center justify-between mb-6 pt-4">
          <h2 className="text-title text-surface-900">Free Stock Photos</h2>
        </div>
        <HomeFeed />
      </section>
    </>
  );
}
