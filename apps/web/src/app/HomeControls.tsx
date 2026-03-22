"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface HomeControlsProps {
  sort?: string;
}

export default function HomeControls({ sort = "curated" }: HomeControlsProps) {
  const router = useRouter();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "curated") {
      router.push("/");
    } else {
      router.push(`/?sort=${value}`);
    }
  };

  return (
    <nav className="sticky top-16 z-sticky bg-white border-b border-surface-200">
      <div className="container-app flex items-center justify-between">
        <div className="flex gap-0">
          <Link
            href="/"
            className="px-5 py-3.5 text-caption font-medium border-b-2 border-surface-900 text-surface-900 transition-colors"
          >
            <span className="mr-1.5">📷</span>
            Photos
          </Link>
          <Link
            href="/search/videos"
            className="px-5 py-3.5 text-caption font-medium border-b-2 border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 transition-colors"
          >
            <span className="mr-1.5">🎬</span>
            Videos
          </Link>
          <Link
            href="/discover"
            className="px-5 py-3.5 text-caption font-medium border-b-2 border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 transition-colors"
          >
            <span className="mr-1.5">🔍</span>
            Explore
          </Link>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-micro text-surface-400">Sort:</span>
          <select
            value={sort}
            onChange={handleSortChange}
            className="text-caption text-surface-600 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-surface-900 transition-colors"
          >
            <option value="curated">Curated</option>
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>
    </nav>
  );
}
