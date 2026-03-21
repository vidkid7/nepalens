export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function hexToColorBucket(hex: string): string | null {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const saturation =
    max === min ? 0 : lightness > 127.5
      ? (max - min) / (510 - max - min)
      : (max - min) / (max + min);

  if (lightness > 230 && saturation < 0.1) return "white";
  if (lightness < 30) return "black";
  if (saturation < 0.1) return "gray";

  const hue = (() => {
    if (max === min) return 0;
    let h: number;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
  })();

  if (hue < 15 || hue >= 345) return "red";
  if (hue < 45) return lightness < 80 ? "brown" : "orange";
  if (hue < 70) return "yellow";
  if (hue < 160) return "green";
  if (hue < 190) return "turquoise";
  if (hue < 260) return "blue";
  if (hue < 290) return "violet";
  if (hue < 345) return "pink";
  return "red";
}

export function getSizeTier(megapixels: number): string {
  if (megapixels >= 24) return "large";
  if (megapixels >= 12) return "medium";
  return "small";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getCdnUrl(key: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
  return `${cdnBase}/${key}`;
}
