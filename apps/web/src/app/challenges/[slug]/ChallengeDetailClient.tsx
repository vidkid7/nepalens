"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";

interface Submission {
  id: string;
  slug: string;
  altText: string | null;
  originalUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  dominantColor: string | null;
  likesCount: number;
  viewsCount: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface WinnerData {
  id: string;
  slug: string;
  altText: string | null;
  originalUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  dominantColor: string | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface UserPhoto {
  id: string;
  slug: string;
  altText: string | null;
  originalUrl: string;
  cdnKey: string | null;
  width: number;
  height: number;
  dominantColor: string | null;
  status: string;
}

interface ChallengeData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  rules: string | null;
  coverUrl: string | null;
  prizeDesc: string | null;
  submissionTag: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  winnerId: string | null;
  submissionCount: number;
  submissions: Submission[];
  winner: WinnerData | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "badge badge-success";
    case "upcoming":
      return "badge badge-info";
    case "voting":
      return "badge badge-warning";
    case "completed":
    case "ended":
      return "badge badge-neutral";
    default:
      return "badge badge-neutral";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "upcoming":
      return "Upcoming";
    case "voting":
      return "Voting";
    case "completed":
      return "Completed";
    case "ended":
      return "Ended";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    function update() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function ChallengeDetailClient({
  challenge,
}: {
  challenge: ChallengeData;
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isActive = challenge.status === "active";
  const isCompleted =
    challenge.status === "completed" || challenge.status === "ended";
  const countdown = useCountdown(isActive ? challenge.endsAt : null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<string[]>([]);
  const [submitStep, setSubmitStep] = useState<"select" | "confirm">("select");

  // Fetch user's existing submissions when modal opens
  const fetchUserData = useCallback(async () => {
    if (!session?.user) return;
    setLoadingPhotos(true);
    try {
      const [photosRes, subsRes] = await Promise.all([
        fetch("/api/internal/photos?mine=true&status=approved&per_page=50"),
        fetch(`/api/internal/challenges/${challenge.slug}/submit`),
      ]);

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setUserPhotos(photosData.photos || []);
      }

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setUserSubmissions(
          (subsData.submissions || []).map((s: any) => s.id)
        );
      }
    } catch {
      // Silently fail — user can still try
    }
    setLoadingPhotos(false);
  }, [session, challenge.slug]);

  const openSubmitModal = useCallback(() => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }
    setShowSubmitModal(true);
    setSubmitStep("select");
    setSelectedPhotoId(null);
    fetchUserData();
  }, [session, fetchUserData]);

  const handleSubmit = useCallback(async () => {
    if (!selectedPhotoId) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/internal/challenges/${challenge.slug}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: selectedPhotoId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast("Photo submitted successfully!", "success");
        setShowSubmitModal(false);
        setUserSubmissions((prev) => [...prev, selectedPhotoId]);
      } else {
        toast(data.error || "Failed to submit", "error");
      }
    } catch {
      toast("Failed to submit photo", "error");
    }
    setSubmitting(false);
  }, [selectedPhotoId, challenge.slug, toast]);

  const availablePhotos = useMemo(
    () => userPhotos.filter((p) => !userSubmissions.includes(p.id)),
    [userPhotos, userSubmissions]
  );

  const selectedPhoto = useMemo(
    () => userPhotos.find((p) => p.id === selectedPhotoId),
    [userPhotos, selectedPhotoId]
  );

  const cdnBase = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_CDN_URL || "")
    : "";

  function getPhotoThumb(photo: UserPhoto) {
    if (photo.cdnKey) return `${cdnBase}/photos/${photo.id}/small.jpg`;
    return photo.originalUrl;
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <section className="relative h-72 sm:h-96 overflow-hidden">
        {challenge.coverUrl ? (
          <img
            src={challenge.coverUrl}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand via-brand-600 to-brand-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 flex items-end">
          <div className="container-app pb-10">
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 text-caption text-white/70 hover:text-white mb-4 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              All Challenges
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <span className={statusBadgeClass(challenge.status)}>
                {statusLabel(challenge.status)}
              </span>
              {isActive && countdown && (
                <span className="text-caption text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                  ⏱ {countdown} remaining
                </span>
              )}
            </div>
            <h1 className="text-display sm:text-hero text-white mb-2">
              {challenge.title}
            </h1>
            {challenge.prizeDesc && (
              <p className="text-body text-white/90 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium">{challenge.prizeDesc}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container-app py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {challenge.description && (
                <div className="card p-6">
                  <h2 className="text-title text-surface-900 mb-3">
                    About This Challenge
                  </h2>
                  <div className="prose-content text-body text-surface-600 whitespace-pre-line">
                    {challenge.description}
                  </div>
                </div>
              )}

              {/* Rules */}
              {challenge.rules && (
                <div className="card p-6">
                  <h2 className="text-title text-surface-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-brand"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Rules
                  </h2>
                  <div className="prose-content text-body text-surface-600 whitespace-pre-line">
                    {challenge.rules}
                  </div>
                </div>
              )}

              {/* How to Enter */}
              {challenge.submissionTag && (
                <div className="card p-6">
                  <h2 className="text-title text-surface-900 mb-3">
                    How to Enter
                  </h2>
                  <ol className="space-y-3 text-body text-surface-600">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand text-caption font-semibold flex items-center justify-center">
                        1
                      </span>
                      <span>
                        Take a photo that fits the challenge theme.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand text-caption font-semibold flex items-center justify-center">
                        2
                      </span>
                      <span>
                        Upload your photo to PixelStock or select from your
                        existing photos.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-50 text-brand text-caption font-semibold flex items-center justify-center">
                        3
                      </span>
                      <span>
                        Click{" "}
                        <strong>&quot;Submit Your Photo&quot;</strong> below and
                        confirm your entry.
                      </span>
                    </li>
                  </ol>
                  {isActive && (
                    <div className="mt-5">
                      <button
                        onClick={openSubmitModal}
                        className="btn btn-primary"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Submit Your Photo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Winner Section */}
              {isCompleted && challenge.winner && (
                <div className="card p-6 border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50">
                  <h2 className="text-title text-surface-900 mb-4 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    Winner
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={`/photo/${challenge.winner.slug}-${challenge.winner.id}`}
                      className="w-full sm:w-48 aspect-square rounded-xl overflow-hidden group relative flex-shrink-0"
                      style={{
                        backgroundColor:
                          challenge.winner.dominantColor || "#e5e7eb",
                      }}
                    >
                      <img
                        src={
                          challenge.winner.thumbnailUrl ||
                          challenge.winner.originalUrl
                        }
                        alt={challenge.winner.altText || "Winning photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="flex-1">
                      <p className="text-body text-surface-700 mb-2">
                        🎉 Congratulations to the winner!
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar
                          src={challenge.winner.user.avatarUrl}
                          name={
                            challenge.winner.user.displayName ||
                            challenge.winner.user.username
                          }
                          size="sm"
                        />
                        <Link
                          href={`/profile/${challenge.winner.user.username}`}
                          className="text-caption text-surface-700 hover:text-brand font-medium"
                        >
                          {challenge.winner.user.displayName ||
                            challenge.winner.user.username}
                        </Link>
                      </div>
                      {challenge.prizeDesc && (
                        <p className="text-caption text-surface-500 mt-3">
                          Prize: {challenge.prizeDesc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submissions Gallery */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-title text-surface-900">
                    Submissions
                    {challenge.submissionCount > 0 && (
                      <span className="text-body text-surface-400 font-normal ml-2">
                        ({challenge.submissionCount})
                      </span>
                    )}
                  </h2>
                  {isActive && session?.user && (
                    <button
                      onClick={openSubmitModal}
                      className="btn btn-sm btn-primary"
                    >
                      Submit Your Photo
                    </button>
                  )}
                </div>
                {challenge.submissions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {challenge.submissions.map((photo) => (
                      <Link
                        key={photo.id}
                        href={`/photo/${photo.slug}-${photo.id}`}
                        className="aspect-square rounded-xl overflow-hidden group relative"
                        style={{
                          backgroundColor:
                            photo.dominantColor || "#e5e7eb",
                        }}
                      >
                        <img
                          src={
                            photo.thumbnailUrl || photo.originalUrl
                          }
                          alt={photo.altText || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                            <Avatar
                              src={photo.user.avatarUrl}
                              name={
                                photo.user.displayName ||
                                photo.user.username
                              }
                              size="xs"
                            />
                            <span className="text-micro text-white truncate">
                              {photo.user.displayName ||
                                photo.user.username}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card p-8 text-center">
                    <p className="text-body text-surface-400">
                      No submissions yet. Be the first to enter!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <div>
                  <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <span className={statusBadgeClass(challenge.status)}>
                    {statusLabel(challenge.status)}
                  </span>
                </div>
                <div>
                  <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">
                    Starts
                  </p>
                  <p className="text-body text-surface-800 font-medium">
                    {formatDate(challenge.startsAt)}
                  </p>
                </div>
                <div>
                  <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">
                    Ends
                  </p>
                  <p className="text-body text-surface-800 font-medium">
                    {formatDate(challenge.endsAt)}
                  </p>
                </div>
                {isActive && countdown && (
                  <div className="pt-4 border-t border-surface-100">
                    <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">
                      Time Remaining
                    </p>
                    <p className="text-subtitle text-brand font-semibold font-mono">
                      {countdown}
                    </p>
                  </div>
                )}
                {challenge.prizeDesc && (
                  <div className="pt-4 border-t border-surface-100">
                    <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">
                      Prize
                    </p>
                    <p className="text-body text-surface-800 font-medium flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {challenge.prizeDesc}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-surface-100">
                  <p className="text-micro text-surface-400 uppercase tracking-wide mb-1">
                    Submissions
                  </p>
                  <p className="text-body text-surface-800 font-medium">
                    {challenge.submissionCount} photos
                  </p>
                </div>
              </div>

              {isActive && (
                <button
                  onClick={openSubmitModal}
                  className="btn btn-primary w-full text-center"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Submit Your Entry
                </button>
              )}

              {isCompleted && !challenge.winner && (
                <div className="card p-6 text-center">
                  <p className="text-body text-surface-500">
                    This challenge has ended. Thank you to all participants!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Photo Modal */}
      <Modal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Your Photo"
        description="Select a photo from your approved uploads to submit to this challenge."
        size="lg"
      >
        {submitStep === "select" && (
          <div>
            {loadingPhotos ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-surface-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : availablePhotos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-body text-surface-500 mb-4">
                  {userPhotos.length === 0
                    ? "You don't have any approved photos yet."
                    : "All your photos have been submitted already!"}
                </p>
                <Link
                  href="/upload"
                  className="btn btn-primary"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Upload a Photo
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4 max-h-96 overflow-y-auto">
                  {availablePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoId(photo.id)}
                      className={`aspect-square rounded-lg overflow-hidden relative ring-2 transition-all ${
                        selectedPhotoId === photo.id
                          ? "ring-brand ring-offset-2"
                          : "ring-transparent hover:ring-surface-300"
                      }`}
                      style={{
                        backgroundColor:
                          photo.dominantColor || "#e5e7eb",
                      }}
                    >
                      <img
                        src={getPhotoThumb(photo)}
                        alt={photo.altText || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedPhotoId === photo.id && (
                        <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                  <Link
                    href="/upload"
                    className="btn btn-sm btn-outline"
                    onClick={() => setShowSubmitModal(false)}
                  >
                    Upload New Photo
                  </Link>
                  <button
                    disabled={!selectedPhotoId}
                    onClick={() => setSubmitStep("confirm")}
                    className="btn btn-primary"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {submitStep === "confirm" && selectedPhoto && (
          <div className="py-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div
                className="w-full sm:w-40 aspect-square rounded-lg overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: selectedPhoto.dominantColor || "#e5e7eb",
                }}
              >
                <img
                  src={getPhotoThumb(selectedPhoto)}
                  alt={selectedPhoto.altText || ""}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-subtitle text-surface-900 mb-2">
                  Confirm Submission
                </h3>
                <p className="text-body text-surface-600 mb-3">
                  Submit this photo to{" "}
                  <strong>{challenge.title}</strong>?
                </p>
                <div className="text-caption text-surface-500 space-y-1">
                  <p>
                    Dimensions: {selectedPhoto.width} × {selectedPhoto.height}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setSubmitStep("select")}
                className="btn btn-outline"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Photo"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
