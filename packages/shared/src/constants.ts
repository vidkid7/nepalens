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

export const VIDEO_QUALITIES = ["hd", "fhd", "4k"] as const;
export type VideoQuality = (typeof VIDEO_QUALITIES)[number];

export const API_TIERS = {
  free: { rateLimitHour: 200, rateLimitMonth: 20000 },
  unlimited: { rateLimitHour: 10000, rateLimitMonth: 1000000 },
} as const;
