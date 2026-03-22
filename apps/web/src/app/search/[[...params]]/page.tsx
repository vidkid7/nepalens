import { Metadata } from "next";
import SearchPageClient from "./SearchResults";

interface SearchPageProps {
  params: Promise<{ params?: string[] }>;
  searchParams: Promise<{
    orientation?: string;
    size?: string;
    color?: string;
    sort?: string;
    tab?: string;
  }>;
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const keyword = resolvedParams.params?.[0] ? decodeURIComponent(resolvedParams.params[0]) : "";
  return {
    title: keyword
      ? `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Photos & Videos`
      : "Search",
    description: keyword
      ? `Free ${keyword} stock photos and videos. Download high-quality royalty-free images.`
      : "Search for free stock photos and videos.",
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const keyword = resolvedParams.params?.[0] ? decodeURIComponent(resolvedParams.params[0]) : "";

  return (
    <SearchPageClient
      keyword={keyword}
      initialFilters={{
        orientation: resolvedSearchParams.orientation || "",
        size: resolvedSearchParams.size || "",
        color: resolvedSearchParams.color || "",
        sort: resolvedSearchParams.sort || "",
        tab: resolvedSearchParams.tab || "photos",
      }}
    />
  );
}
