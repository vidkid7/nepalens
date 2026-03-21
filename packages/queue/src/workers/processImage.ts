import Sharp from "sharp";
import { encode as blurhashEncode } from "blurhash";
import { prisma } from "@pixelstock/database";
import { downloadFromS3, uploadToS3, getCdnUrl } from "@pixelstock/storage";
import { hexToColorBucket, getSizeTier } from "@pixelstock/shared";
import { searchIndexQueue } from "../index";
import type { ProcessImageJob } from "../index";

const IMAGE_SIZES = [
  { name: "large2x", width: 1880, height: 1253 },
  { name: "large", width: 940, height: 627 },
  { name: "medium", width: 350, height: 233 },
  { name: "small", width: 130, height: 87 },
  { name: "portrait", width: 800, height: 1200 },
  { name: "landscape", width: 1200, height: 627 },
  { name: "tiny", width: 280, height: 200 },
];

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

export async function processImage(job: { data: ProcessImageJob }): Promise<void> {
  const { photoId } = job.data;
  console.log(`Processing image: ${photoId}`);

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) throw new Error(`Photo not found: ${photoId}`);

  // Download original from S3
  const originalKey = photo.cdnKey || photo.originalUrl.split("/").slice(-3).join("/");
  let originalBuffer: Buffer;
  try {
    originalBuffer = await downloadFromS3(originalKey);
  } catch (e) {
    console.error(`Failed to download from S3: ${originalKey}`, e);
    throw e;
  }

  // Create Sharp instance, auto-orient from EXIF
  const image = Sharp(originalBuffer).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  // Generate blur hash (4x3 components)
  const rawPixels = await image
    .clone()
    .resize(64, 64, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const blurHash = blurhashEncode(
    new Uint8ClampedArray(rawPixels),
    64,
    64,
    4,
    3
  );

  // Extract dominant color from resized image
  const { dominant } = await image.clone().resize(100, 100, { fit: "cover" }).stats();
  const dominantHex = rgbToHex(
    Math.round(dominant.r),
    Math.round(dominant.g),
    Math.round(dominant.b)
  );
  const colorBucket = hexToColorBucket(dominantHex);

  // Generate all size variants and upload to S3
  const baseKey = `photos/${photoId}`;

  // Upload original (EXIF-stripped)
  const strippedOriginal = await image.clone().jpeg({ quality: 95, mozjpeg: true }).toBuffer();
  await uploadToS3(`${baseKey}/original.jpg`, strippedOriginal, "image/jpeg");

  // Generate sized variants
  for (const size of IMAGE_SIZES) {
    const resized = await image
      .clone()
      .resize(size.width, size.height, {
        fit: "cover",
        position: "attention", // smart cropping
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    await uploadToS3(`${baseKey}/${size.name}.jpg`, resized, "image/jpeg");

    // Also generate WebP variant
    const webpBuffer = await image
      .clone()
      .resize(size.width, size.height, { fit: "cover", position: "attention" })
      .webp({ quality: 85 })
      .toBuffer();
    await uploadToS3(`${baseKey}/${size.name}.webp`, webpBuffer, "image/webp");
  }

  // Compute derived fields
  const megapixels = (metadata.width * metadata.height) / 1_000_000;
  const orientation =
    metadata.width > metadata.height
      ? "landscape"
      : metadata.height > metadata.width
        ? "portrait"
        : "square";

  // Update database
  await prisma.photo.update({
    where: { id: photoId },
    data: {
      blurHash,
      dominantColor: dominantHex,
      avgColor: dominantHex,
      colorBucket,
      orientation,
      megapixels,
      width: metadata.width,
      height: metadata.height,
      fileSizeBytes: BigInt(originalBuffer.length),
      sizeTier: getSizeTier(megapixels),
      cdnKey: baseKey,
      status: "processed",
    },
  });

  // Enqueue search indexing
  await searchIndexQueue.add("index-photo", {
    mediaType: "photo",
    mediaId: photoId,
    action: "index",
  });

  console.log(`Image processed: ${photoId} (${megapixels.toFixed(1)}MP, ${orientation}, ${colorBucket})`);
}
