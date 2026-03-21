"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import MasonryGrid from "@/components/media/MasonryGrid";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

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
    totalViews: number;
    totalDownloads: number;
  };
  photos: Array<{
    id: string;
    slug: string;
    alt: string | null;
    width: number;
    height: number;
    src: { large: string };
    photographer: string;
    photographer_url: string;
    avg_color: string | null;
  }>;
}

export default function ProfileContent({ user, stats, photos }: ProfileContentProps) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [activeTab, setActiveTab] = useState<"photos" | "videos" | "collections">("photos");
  const { toast } = useToast();

  const isOwnProfile = (session?.user as any)?.username === user.username;
  const display = user.displayName || user.username;

  const handleFollow = useCallback(async () => {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    try {
      const res = await fetch(`/api/internal/users/${user.username}/follow`, { method: "POST" });
      const data = await res.json();
      setFollowing(data.following);
      setFollowersCount((prev) => (data.following ? prev + 1 : prev - 1));
      toast(data.following ? `Following ${display}` : `Unfollowed ${display}`, "success");
    } catch {
      toast("Action failed", "error");
    }
  }, [session, user.username, display, toast]);

  const statItems = [
    { label: "Photos", value: stats.photos },
    { label: "Videos", value: stats.videos },
    { label: "Followers", value: followersCount },
    { label: "Views", value: stats.totalViews },
    { label: "Downloads", value: stats.totalDownloads },
  ];

  return (
    <div>
      {/* Cover */}
      <div
        className="h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-brand/70 via-brand to-brand-dark"
        style={
          user.coverUrl
            ? { backgroundImage: `url(${user.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />

      {/* Profile Header */}
      <div className="container-app -mt-16 relative z-10 mb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-white border-4 border-white overflow-hidden shadow-lg flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={display} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand flex items-center justify-center text-white text-4xl font-bold">
                  {display.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-display text-surface-900">{display}</h1>
                {user.isVerified && (
                  <span className="text-brand" title="Verified">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-caption text-surface-500">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {user.location}
                  </span>
                )}
                {user.websiteUrl && (
                  <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {user.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
              {user.bio && <p className="text-body text-surface-600 mt-2 max-w-2xl">{user.bio}</p>}
            </div>

            {!isOwnProfile ? (
              <button
                onClick={handleFollow}
                className={`btn btn-md flex-shrink-0 ${
                  following ? "btn-outline" : "btn-primary"
                }`}
              >
                {following ? "Following" : "Follow"}
              </button>
            ) : (
              <Link href="/account/settings" className="btn btn-md btn-outline flex-shrink-0">
                Edit Profile
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            {statItems.map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <span className="text-subtitle font-bold text-surface-900">{s.value.toLocaleString()}</span>
                <span className="text-micro text-surface-500 ml-1">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-surface-200">
            {(["photos", "videos", "collections"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-caption font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-brand text-brand"
                    : "border-transparent text-surface-500 hover:text-surface-700"
                }`}
              >
                {tab}
                {tab === "photos" && <span className="ml-1 text-micro text-surface-400">({stats.photos})</span>}
                {tab === "videos" && <span className="ml-1 text-micro text-surface-400">({stats.videos})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-app pb-12">
        <div className="max-w-5xl mx-auto">
          {activeTab === "photos" && (
            photos.length > 0 ? (
              <MasonryGrid photos={photos} columns={3} />
            ) : (
              <EmptyState title="No photos yet" description={isOwnProfile ? "Upload your first photo to get started." : `${display} hasn't uploaded any photos yet.`} />
            )
          )}
          {activeTab === "videos" && (
            <EmptyState title="No videos yet" description={isOwnProfile ? "Upload your first video to get started." : `${display} hasn't uploaded any videos yet.`} />
          )}
          {activeTab === "collections" && (
            <EmptyState title="No collections yet" description={isOwnProfile ? "Create your first collection." : `${display} hasn't created any public collections.`} />
          )}
        </div>
      </div>
    </div>
  );
}
