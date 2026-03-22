const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function validateUploadFile(file: { type: string; size: number; name: string }): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Unsupported format. Use JPEG, PNG, WebP, or AVIF.";
  if (file.size > MAX_FILE_SIZE) return `File too large. Max 50 MB.`;
  return null;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export { ACCEPTED_TYPES, MAX_FILE_SIZE };
