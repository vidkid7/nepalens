import { Metadata } from "next";
import SearchResults from "./SearchResults";

interface SearchPageProps {
  params: { params?: string[] };
  searchParams: { orientation?: string; size?: string; color?: string; sort?: string };
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const keyword = params.params?.[0] ? decodeURIComponent(params.params[0]) : "";
  return {
    title: keyword
      ? `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Photos & Videos`
      : "Search",
    description: keyword
      ? `Free ${keyword} stock photos and videos. Download high-quality royalty-free images.`
      : "Search for free stock photos and videos.",
  };
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

export default function SearchPage({ params, searchParams }: SearchPageProps) {
  const keyword = params.params?.[0] ? decodeURIComponent(params.params[0]) : "";

  return (
    <div>
      {/* Search Header */}
      <div className="container-app pt-8 pb-4">
        <h1 className="text-display text-surface-900 mb-1">
          {keyword ? (
            <>
              Free <span className="capitalize">{keyword}</span> Photos
            </>
          ) : (
            "Search Results"
          )}
        </h1>
        {keyword && (
          <p className="text-caption text-surface-500">
            Download free {keyword} stock photos and videos
          </p>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="sticky top-16 z-sticky bg-white border-b border-surface-200">
        <div className="container-app">
          {/* Tabs */}
          <div className="flex items-center gap-6 mb-0">
            <div className="flex gap-0">
              {["Photos", "Videos", "Users"].map((tab, i) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-caption font-medium border-b-2 transition-colors ${
                    i === 0
                      ? "border-surface-900 text-surface-900"
                      : "border-transparent text-surface-500 hover:text-surface-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-surface-50 border-b border-surface-200">
        <div className="container-app py-3 flex items-center gap-3 overflow-x-auto">
          <FilterSelect
            label="Orientation"
            value={searchParams.orientation}
            options={[
              { value: "landscape", label: "Landscape" },
              { value: "portrait", label: "Portrait" },
              { value: "square", label: "Square" },
            ]}
          />
          <FilterSelect
            label="Size"
            value={searchParams.size}
            options={[
              { value: "large", label: "Large (24MP+)" },
              { value: "medium", label: "Medium (12MP+)" },
              { value: "small", label: "Small" },
            ]}
          />
          <FilterSelect
            label="Sort by"
            value={searchParams.sort}
            options={[
              { value: "relevant", label: "Most Relevant" },
              { value: "popular", label: "Most Popular" },
              { value: "newest", label: "Newest" },
            ]}
          />

          {/* Color picker */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-surface-200">
            <span className="text-micro text-surface-500 mr-1">Color</span>
            {COLORS.map((c) => (
              <button
                key={c.name}
                className={`w-5 h-5 rounded-full border border-surface-200 transition-all ${
                  searchParams.color === c.name
                    ? "ring-2 ring-brand ring-offset-1 scale-110"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                aria-label={`Filter by ${c.name}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Related topics */}
      {keyword && (
        <div className="container-app pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {RELATED_TOPICS.map((topic) => (
              <a
                key={topic}
                href={`/search/${topic}`}
                className="chip flex-shrink-0"
              >
                {topic.charAt(0).toUpperCase() + topic.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <section className="container-app py-6">
        <SearchResults keyword={keyword} filters={searchParams} />
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative flex-shrink-0">
      <select
        defaultValue={value || ""}
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
