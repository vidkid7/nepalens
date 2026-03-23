import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

let configured = false;

function ensureCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
      api_key: process.env.CLOUDINARY_API_KEY || "",
      api_secret: process.env.CLOUDINARY_API_SECRET || "",
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/**
 * Upload a buffer to Cloudinary.
 * Returns the secure URL of the uploaded asset.
 */
export async function uploadToCloudinary(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const cld = ensureCloudinary();
  const isVideo = contentType.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";
  // Remove extension from public_id
  const publicId = key.replace(/\.[^.]+$/, "");

  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        folder: "",
        overwrite: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );
    stream.end(body);
  });
}

// Legacy alias
export const uploadToS3 = uploadToCloudinary;

/**
 * Download a file from Cloudinary as a Buffer.
 */
export async function downloadFromCloudinary(key: string): Promise<Buffer> {
  const url = getCdnUrl(key);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download from Cloudinary: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Legacy alias
export const downloadFromS3 = downloadFromCloudinary;

/**
 * Delete a file from Cloudinary.
 */
export async function deleteFromCloudinary(key: string): Promise<void> {
  const cld = ensureCloudinary();
  const publicId = key.replace(/\.[^.]+$/, "");
  await cld.uploader.destroy(publicId, { invalidate: true });
}

// Legacy alias
export const deleteFromS3 = deleteFromCloudinary;

/**
 * Generate a signed Cloudinary upload URL + signature for client-side uploads.
 * Returns { url, signature, timestamp, apiKey, cloudName, folder }
 */
export function getCloudinaryUploadParams(
  folder: string,
  publicId: string,
  resourceType: "image" | "video" = "image"
) {
  const cld = ensureCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, any> = {
    timestamp,
    folder,
    public_id: publicId,
    overwrite: true,
  };

  const signature = cld.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET || "");

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    folder,
    publicId,
  };
}

// Legacy alias for presign
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  _expiresIn?: number
): Promise<string> {
  // For Cloudinary we return a JSON string with upload params
  const isVideo = contentType.startsWith("video/");
  const folder = key.substring(0, key.lastIndexOf("/"));
  const filename = key.substring(key.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "");
  const params = getCloudinaryUploadParams(folder, filename, isVideo ? "video" : "image");
  // Return the upload URL — the caller will need the extra params too
  return params.url;
}

/**
 * Get the Cloudinary CDN URL for a given key.
 * Uses Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{key}
 */
export function getCdnUrl(key: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  if (!cloudName) {
    // Fallback to legacy CDN URL
    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL || "";
    return `${cdnBase}/${key}`;
  }
  // Determine resource type from key
  const isVideo = key.includes("videos/") || key.endsWith(".mp4") || key.endsWith(".mov") || key.endsWith(".webm");
  const resourceType = isVideo ? "video" : "image";
  const publicId = key.replace(/\.[^.]+$/, "");
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
}

/**
 * Get Cloudinary transformation URLs for different photo sizes.
 */
export function getPhotoSrcUrls(photoId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  if (!cloudName) {
    return {
      original: getCdnUrl(`photos/${photoId}/original.jpg`),
      large2x: getCdnUrl(`photos/${photoId}/large2x.jpg`),
      large: getCdnUrl(`photos/${photoId}/large.jpg`),
      medium: getCdnUrl(`photos/${photoId}/medium.jpg`),
      small: getCdnUrl(`photos/${photoId}/small.jpg`),
      portrait: getCdnUrl(`photos/${photoId}/portrait.jpg`),
      landscape: getCdnUrl(`photos/${photoId}/landscape.jpg`),
      tiny: getCdnUrl(`photos/${photoId}/tiny.jpg`),
    };
  }
  // Use Cloudinary transformations
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const pid = `photos/${photoId}/original`;
  return {
    original: `${base}/${pid}`,
    large2x: `${base}/w_3840,c_limit,q_auto/${pid}`,
    large: `${base}/w_1920,c_limit,q_auto/${pid}`,
    medium: `${base}/w_1280,c_limit,q_auto/${pid}`,
    small: `${base}/w_640,c_limit,q_auto/${pid}`,
    portrait: `${base}/w_800,h_1200,c_fill,q_auto/${pid}`,
    landscape: `${base}/w_1200,h_800,c_fill,q_auto/${pid}`,
    tiny: `${base}/w_280,c_limit,q_auto/${pid}`,
  };
}

export { cloudinary };

