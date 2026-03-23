"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import MasonryGrid from "@/components/media/MasonryGrid";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import EmptyState from "@/components/ui/EmptyState";
import { MasonryGridSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { formatCount } from "@/lib/helpers";

interface PhotoItem {
  id: string;
  slug: string;
  alt: string | null;
  width: number;
  height: number;
  src: { large: string };
  photographer: string;
  photographer_url: string;
  avg_color: string | null;
  isPremium?: boolean;
}

interface CollectionItem {
  id: string;
  title: string;
  coverUrl: string | null;
  itemsCount: number;
}

interface ProfileContentProps {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    location: string | null;
    websiteUrl: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    followersCount: number;
    followingCount: number;
    isVerified: boolean;
  };
  stats: {
    photos: number;
    videos: number;
    collections: number;
    totalViews: number;
    totalDownloads: number;
    followers: number;
    following: number;
  };
  initialPhotos: PhotoItem[];
}

type TabKey = "photos" | "videos" | "collections" | "likes" | "downloads" | "following";

export default function ProfileContent({
  user,
  stats,
  initialPhotos,
}: ProfileContentProps) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [activeTab, setActiveTab] = useState<TabKey>("photos");
  const { toast } = useToast();

  // Photos tab state
  const [photos, setPhotos] = useState<PhotoItem[]>(initialPhotos);
  const [photosPage, setPhotosPage] = useState(1);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosHasMore, setPhotosHasMore] = useState(
    initialPhotos.length >= 30
  );

  // Videos tab state
  const [videos, setVideos] = useState<PhotoItem[]>([]);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [videosLoading, setVideosLoading] = useState(false);

  // Collections tab state
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Likes tab state
  const [likes, setLikes] = useState<PhotoItem[]>([]);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);

  // Downloads tab state
  const [downloads, setDownloads] = useState<PhotoItem[]>([]);
  const [downloadsLoaded, setDownloadsLoaded] = useState(false);
  const [downloadsLoading, setDownloadsLoading] = useState(false);

  // Following tab state
  const [followingUsers, setFollowingUsers] = useState<Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null; photosCount: number }>>([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const isOwnProfile = (session?.user as any)?.username === user.username;
  const display = user.displayName || user.username;

  // Check if already following
  useEffect(() => {
    if (!session || isOwnProfile) return;
    fetch(`/api/internal/users/${user.username}/follow`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.following === "boolean") setFollowing(data.following);
      })
      .catch(() => {});
  }, [session, user.username, isOwnProfile]);

  const handleFollow = useCallback(async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch(
        `/api/internal/users/${user.username}/follow`,
        { method: "POST" }
      );
      const data = await res.json();
      setFollowing(data.following);
      setFollowersCount((prev) => (data.following ? prev + 1 : prev - 1));
      toast(
        data.following ? `Following ${display}` : `Unfollowed ${display}`,
        "success"
      );
    } catch {
      toast("Action failed", "error");
    }
  }, [session, user.username, display, toast]);

  // Load more photos (infinite scroll)
  const loadMorePhotos = useCallback(async () => {
    if (photosLoading) return;
    setPhotosLoading(true);
    try {
      const nextPage = photosPage + 1;
      const res = await fetch(
        `/api/internal/photos?page=${nextPage}&per_page=30&user=${user.username}`
      );
      if (res.ok) {
        const data = await res.json();
        const newPhotos = (data.photos || []) as PhotoItem[];
        setPhotos((prev) => [...prev, ...newPhotos]);
        setPhotosPage(nextPage);
        if (newPhotos.length < 30) setPhotosHasMore(false);
      }
    } catch {
      // silently fail
    }
    setPhotosLoading(false);
  }, [photosPage, photosLoading, user.username]);

  // Fetch videos on tab switch
  useEffect(() => {
    if (activeTab !== "videos" || videosLoaded) return;
    setVideosLoading(true);
    fetch(`/api/internal/videos?user=${user.username}&per_page=30`)
      .then((r) => (r.ok ? r.json() : { videos: [] }))
      .then((data) => {
        setVideos(data.videos || []);
        setVideosLoaded(true);
      })
      .catch(() => setVideosLoaded(true))
      .finally(() => setVideosLoading(false));
  }, [activeTab, videosLoaded, user.username]);

  // Fetch collections on tab switch
  useEffect(() => {
    if (activeTab !== "collections" || collectionsLoaded) return;
    setCollectionsLoading(true);
    fetch(`/api/internal/collections?user=${user.username}`)
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((data) => {
        setCollections(data.collections || []);
        setCollectionsLoaded(true);
      })
      .catch(() => setCollectionsLoaded(true))
      .finally(() => setCollectionsLoading(false));
  }, [activeTab, collectionsLoaded, user.username]);

  // Fetch likes on tab switch (own profile only)
  useEffect(() => {
    if (activeTab !== "likes" || likesLoaded || !isOwnProfile) return;
    setLikesLoading(true);
    fetch(`/api/internal/photos?liked=true&per_page=30`)
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((data) => {
        setLikes(data.photos || []);
        setLikesLoaded(true);
      })
      .catch(() => setLikesLoaded(true))
      .finally(() => setLikesLoading(false));
  }, [activeTab, likesLoaded, isOwnProfile]);

  // Fetch downloads on tab switch (own profile only)
  useEffect(() => {
    if (activeTab !== "downloads" || downloadsLoaded || !isOwnProfile) return;
    setDownloadsLoading(true);
    fetch(`/api/internal/downloads?per_page=30`)
      .then((r) => (r.ok ? r.json() : { photos: [] }))
      .then((data) => {
        setDownloads(data.photos || []);
        setDownloadsLoaded(true);
      })
      .catch(() => setDownloadsLoaded(true))
      .finally(() => setDownloadsLoading(false));
  }, [activeTab, downloadsLoaded, isOwnProfile]);

  // Fetch following on tab switch
  useEffect(() => {
    if (activeTab !== "following" || followingLoaded) return;
    setFollowingLoading(true);
    fetch(`/api/internal/users/${user.username}/following`)
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => {
        setFollowingUsers(data.users || []);
        setFollowingLoaded(true);
      })
      .catch(() => setFollowingLoaded(true))
      .finally(() => setFollowingLoading(false));
  }, [activeTab, followingLoaded, user.username]);

  const statItems = [
    { label: "Photos", value: stats.photos },
    { label: "Videos", value: stats.videos },
    { label: "Views", value: stats.totalViews },
    { label: "Downloads", value: stats.totalDownloads },
    { label: "Followers", value: followersCount },
    { label: "Following", value: stats.following },
  ];

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "photos", label: "Photos", count: stats.photos },
    { key: "videos", label: "Videos", count: stats.videos },
    { key: "collections", label: "Collections", count: stats.collections },
    ...(isOwnProfile ? [{ key: "likes" as TabKey, label: "Likes" }] : []),
    ...(isOwnProfile ? [{ key: "downloads" as TabKey, label: "Downloads" }] : []),
    { key: "following", label: "Following", count: stats.following },
  ];

  return (
    <div>
      {/* Cover */}
      <div
        className="relative h-56 sm:h-72 lg:h-80 bg-gradient-to-br from-brand/70 via-brand to-brand-dark"
        style={
          user.coverUrl
            ? {
                backgroundImage: `url(${user.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {user.coverUrl && (
          <div className="absolute inset-0 bg-black/20" />
        )}
      </div>

      {/* Profile Header */}
      <div className="container-app -mt-20 relative z-10 mb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-36 h-36 rounded-2xl bg-white border-4 border-white overflow-hidden shadow-lg flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={display}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-brand flex items-center justify-center text-white text-5xl font-bold">
                  {display.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-display text-surface-900">{display}</h1>
                {user.isVerified && (
                  <span className="text-brand" title="Verified">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-caption text-surface-400 mt-0.5">
                @{user.username}
              </p>
              <div className="flex items-center gap-4 mt-2 text-caption text-surface-500">
                {user.location && (
                  <span className="flex items-center gap-1">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {user.location}
                  </span>
                )}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand hover:underline flex items-center gap-1"
                  >
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    {user.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              {user.bio && (
                <p className="text-body text-surface-600 mt-2 max-w-2xl">
                  {user.bio}
                </p>
              )}
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="btn btn-md btn-outline"
                >
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`btn btn-md ${
                    following ? "btn-outline" : "btn-primary"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 mt-6">
            {statItems.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <span className="text-subtitle font-bold text-surface-900">
                  {formatCount(s.value)}
                </span>
                <span className="text-micro text-surface-500 ml-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-surface-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-caption font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab.key
                    ? "border-brand text-brand"
                    : "border-transparent text-surface-500 hover:text-surface-700"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 text-micro text-surface-400">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-app pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Photos Tab */}
          {activeTab === "photos" &&
            (photos.length > 0 ? (
              <InfiniteScroll
                onLoadMore={loadMorePhotos}
                hasMore={photosHasMore}
                loading={photosLoading}
              >
                <MasonryGrid photos={photos} columns={3} />
              </InfiniteScroll>
            ) : (
              <EmptyState
                title="No photos yet"
                description={
                  isOwnProfile
                    ? "Upload your first photo to get started."
                    : `${display} hasn't uploaded any photos yet.`
                }
                action={
                  isOwnProfile ? (
                    <Link href="/upload" className="btn btn-primary btn-md">
                      Upload Photo
                    </Link>
                  ) : undefined
                }
              />
            ))}

          {/* Videos Tab */}
          {activeTab === "videos" &&
            (videosLoading ? (
              <MasonryGridSkeleton columns={3} />
            ) : videos.length > 0 ? (
              <MasonryGrid photos={videos} columns={3} />
            ) : (
              <EmptyState
                title="No videos yet"
                description={
                  isOwnProfile
                    ? "Upload your first video to get started."
                    : `${display} hasn't uploaded any videos yet.`
                }
                action={
                  isOwnProfile ? (
                    <Link href="/upload" className="btn btn-primary btn-md">
                      Upload Video
                    </Link>
                  ) : undefined
                }
              />
            ))}

          {/* Collections Tab */}
          {activeTab === "collections" &&
            (collectionsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-xl bg-surface-100 animate-pulse"
                  />
                ))}
              </div>
            ) : collections.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {collections.map((col) => (
                  <Link
                    key={col.id}
                    href={`/collections/${col.id}`}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-100"
                  >
                    {col.coverUrl ? (
                      <img
                        src={col.coverUrl}
                        alt={col.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-surface-200 to-surface-300" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-caption font-medium text-white truncate">
                        {col.title}
                      </p>
                      <p className="text-micro text-white/70">
                        {col.itemsCount}{" "}
                        {col.itemsCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No collections yet"
                description={
                  isOwnProfile
                    ? "Create your first collection to organize your favorites."
                    : `${display} hasn't created any public collections.`
                }
              />
            ))}

          {/* Likes Tab (own profile only) */}
          {activeTab === "likes" &&
            isOwnProfile &&
            (likesLoading ? (
              <MasonryGridSkeleton columns={3} />
            ) : likes.length > 0 ? (
              <MasonryGrid photos={likes} columns={3} />
            ) : (
              <EmptyState
                title="No likes yet"
                description="Photos you like will appear here."
              />
            ))}

          {/* Downloads Tab (own profile only) */}
          {activeTab === "downloads" &&
            isOwnProfile &&
            (downloadsLoading ? (
              <MasonryGridSkeleton columns={3} />
            ) : downloads.length > 0 ? (
              <MasonryGrid photos={downloads} columns={3} />
            ) : (
              <EmptyState
                title="No downloads yet"
                description="Photos you download will appear here."
              />
            ))}

          {/* Following Tab */}
          {activeTab === "following" &&
            (followingLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-surface-100 animate-pulse" />
                ))}
              </div>
            ) : followingUsers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {followingUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-100 flex-shrink-0">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.displayName || u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-brand flex items-center justify-center text-white font-bold">
                          {(u.displayName || u.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-subtitle font-medium text-surface-900 truncate">{u.displayName || u.username}</p>
                      <p className="text-micro text-surface-400">@{u.username} · {u.photosCount} photos</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Not following anyone"
                description={isOwnProfile ? "Follow creators to see them here." : `${display} isn't following anyone yet.`}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
