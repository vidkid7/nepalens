export const IMAGE_SIZES = [
  { name: "original", maxWidth: null, maxHeight: null },
  { name: "large2x", width: 1880, height: 1253 },
  { name: "large", width: 940, height: 627 },
  { name: "medium", width: 350, height: 233 },
  { name: "small", width: 130, height: 87 },
  { name: "portrait", width: 800, height: 1200 },
  { name: "landscape", width: 1200, height: 627 },
  { name: "tiny", width: 280, height: 200 },
] as const;

export type ImageSizeName = (typeof IMAGE_SIZES)[number]["name"];

export const COLOR_BUCKETS = {
  red: ["#ff0000", "#cc0000", "#ff4444"],
  orange: ["#ff6600", "#ff8c00", "#ff7f50"],
  yellow: ["#ffff00", "#ffd700", "#ffec8b"],
  green: ["#00ff00", "#228b22", "#90ee90"],
  turquoise: ["#40e0d0", "#00ced1", "#48d1cc"],
  blue: ["#0000ff", "#1e90ff", "#4169e1"],
  violet: ["#8b00ff", "#9400d3", "#7b68ee"],
  pink: ["#ffc0cb", "#ff69b4", "#ff1493"],
  brown: ["#a52a2a", "#8b4513", "#d2691e"],
  black: ["#000000", "#1a1a1a", "#333333"],
  gray: ["#808080", "#a9a9a9", "#c0c0c0"],
  white: ["#ffffff", "#fffaf0", "#f5f5f5"],
} as const;

export type ColorBucket = keyof typeof COLOR_BUCKETS;

export const ORIENTATIONS = ["landscape", "portrait", "square"] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const SIZE_TIERS = ["large", "medium", "small"] as const;
export type SizeTier = (typeof SIZE_TIERS)[number];

export const MEDIA_TYPES = ["photo", "video"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const PHOTO_STATUSES = [
  "pending",
  "processed",
  "approved",
  "rejected",
  "removed",
] as const;
export type PhotoStatus = (typeof PHOTO_STATUSES)[number];

// Content state machine (all 12 states)
export const CONTENT_STATES = {
  DRAFT: 'draft',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  PROCESSING_FAILED: 'processing_failed',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CHANGES: 'needs_changes',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  REMOVED: 'removed',
  REPORTED: 'reported',
} as const;

export type ContentState = (typeof CONTENT_STATES)[keyof typeof CONTENT_STATES];

// Valid state transitions: maps current state → allowed next states
export const STATE_TRANSITIONS: Record<string, string[]> = {
  draft: ['uploaded'],
  uploaded: ['processing'],
  processing: ['processing_failed', 'pending_review'],
  processing_failed: ['processing'], // retry
  pending_review: ['approved', 'rejected', 'needs_changes'],
  approved: ['published', 'hidden', 'removed', 'reported'],
  rejected: ['pending_review'], // resubmit
  needs_changes: ['pending_review'], // resubmit after changes
  published: ['hidden', 'removed', 'reported'],
  hidden: ['published', 'removed'],
  removed: ['pending_review'], // restore
  reported: ['approved', 'removed'], // after review
};

/**
 * Validate whether a state transition is allowed.
 * Returns true if transitioning from `currentState` to `nextState` is valid.
 */
export function isValidTransition(currentState: string, nextState: string): boolean {
  const allowed = STATE_TRANSITIONS[currentState];
  if (!allowed) return false;
  return allowed.includes(nextState);
}

export const VIDEO_QUALITIES = ["hd", "fhd", "4k"] as const;
export type VideoQuality = (typeof VIDEO_QUALITIES)[number];

export const API_TIERS = {
  free: { rateLimitHour: 200, rateLimitMonth: 20000 },
  unlimited: { rateLimitHour: 10000, rateLimitMonth: 1000000 },
} as const;
