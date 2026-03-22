import { Metadata } from "next";
import SearchPageClient from "./SearchResults";

interface SearchPageProps {
  params: { params?: string[] };
  searchParams: {
    orientation?: string;
    size?: string;
    color?: string;
    sort?: string;
    tab?: string;
  };
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

export default function SearchPage({ params, searchParams }: SearchPageProps) {
  const keyword = params.params?.[0] ? decodeURIComponent(params.params[0]) : "";

  return (
    <SearchPageClient
      keyword={keyword}
      initialFilters={{
        orientation: searchParams.orientation || "",
        size: searchParams.size || "",
        color: searchParams.color || "",
        sort: searchParams.sort || "",
        tab: searchParams.tab || "photos",
      }}
    />
  );
}
