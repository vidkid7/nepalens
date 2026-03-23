import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

import { prisma } from "@nepalens/database";
import { downloadFromS3, uploadToS3, getCdnUrl } from "@nepalens/storage";
import { searchIndexQueue } from "../index";
import type { ProcessVideoJob } from "../index";

const execFileAsync = promisify(execFile);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);

// ── Types ──────────────────────────────────────────────────────────

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string | null;
  bitrate: number;
}

interface TranscodeOptions {
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
  preset: string;
}

interface QualityVariant {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

const QUALITY_VARIANTS: QualityVariant[] = [
  { name: "sd",  width: 960,  height: 540,  videoBitrate: "1500k", audioBitrate: "96k" },
  { name: "hd",  width: 1280, height: 720,  videoBitrate: "3000k", audioBitrate: "128k" },
  { name: "fhd", width: 1920, height: 1080, videoBitrate: "6000k", audioBitrate: "192k" },
];

// ── FFmpeg helpers ─────────────────────────────────────────────────

/**
 * Probe video file metadata using ffprobe.
 * Returns duration, resolution, codecs, bitrate, and fps.
 */
async function probeVideo(inputPath: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    inputPath,
  ]);

  const probe = JSON.parse(stdout);
  const videoStream = probe.streams?.find((s: any) => s.codec_type === "video");
  const audioStream = probe.streams?.find((s: any) => s.codec_type === "audio");

  if (!videoStream) {
    throw new Error("No video stream found in file");
  }

  // Parse frame rate from rational like "30/1" or "30000/1001"
  let fps = 30;
  if (videoStream.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
    if (den && den > 0) fps = num / den;
  }

  return {
    duration: parseFloat(probe.format?.duration ?? "0"),
    width: videoStream.width ?? 0,
    height: videoStream.height ?? 0,
    fps: Math.round(fps * 100) / 100,
    videoCodec: videoStream.codec_name ?? "unknown",
    audioCodec: audioStream?.codec_name ?? null,
    bitrate: parseInt(probe.format?.bit_rate ?? "0", 10),
  };
}

/**
 * Transcode a video to a specific quality variant.
 * Uses H.264 + AAC in MP4 container with faststart for web playback.
 */
async function transcodeVariant(
  inputPath: string,
  outputPath: string,
  options: TranscodeOptions,
): Promise<void> {
  const args = [
    "-i", inputPath,
    "-vf", `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`,
    "-c:v", "libx264",
    "-preset", options.preset,
    "-b:v", options.videoBitrate,
    "-maxrate", options.videoBitrate,
    "-bufsize", `${parseInt(options.videoBitrate) * 2}k`,
    "-c:a", "aac",
    "-b:a", options.audioBitrate,
    "-movflags", "+faststart",
    "-y",
    outputPath,
  ];

  await execFileAsync("ffmpeg", args, { timeout: 600_000 });
}

/**
 * Extract a single frame as a JPEG thumbnail at a given timestamp.
 */
async function extractThumbnail(
  inputPath: string,
  outputPath: string,
  timeSeconds: number,
): Promise<void> {
  const args = [
    "-ss", String(timeSeconds),
    "-i", inputPath,
    "-frames:v", "1",
    "-q:v", "2",
    "-y",
    outputPath,
  ];

  await execFileAsync("ffmpeg", args, { timeout: 60_000 });
}

/**
 * Create a short preview clip (MP4, no audio, lower quality for fast loading).
 */
async function createPreviewClip(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number,
): Promise<void> {
  const args = [
    "-ss", String(startTime),
    "-i", inputPath,
    "-t", String(duration),
    "-vf", "scale=480:-2",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "28",
    "-an", // no audio
    "-movflags", "+faststart",
    "-y",
    outputPath,
  ];

  await execFileAsync("ffmpeg", args, { timeout: 120_000 });
}

// ── Temp directory helper ──────────────────────────────────────────

function createTempDir(): string {
  const dir = path.join(os.tmpdir(), `nepalens-video-${crypto.randomUUID()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch (e) {
    console.warn(`[processVideo] Failed to clean up temp dir ${dir}:`, e);
  }
}

// ── Main worker ────────────────────────────────────────────────────

export async function processVideo(job: { data: ProcessVideoJob }): Promise<void> {
  const { videoId } = job.data;
  console.log(`[processVideo] Starting video processing: ${videoId}`);

  // ── 1. Fetch video record ────────────────────────────────────────
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { files: true },
  });

  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  console.log(`[processVideo] Found video: ${videoId} (${video.width}x${video.height})`);

  const tempDir = createTempDir();
  const originalPath = path.join(tempDir, "original.mp4");

  try {
    // ── 2. Download original from S3 ───────────────────────────────
    const originalKey = `videos/${videoId}/original.mp4`;
    console.log(`[processVideo] Downloading original from S3: ${originalKey}`);
    const originalBuffer = await downloadFromS3(originalKey);
    await writeFile(originalPath, originalBuffer);
    console.log(`[processVideo] Downloaded ${(originalBuffer.length / 1_048_576).toFixed(1)} MB`);

    // ── 3. Probe metadata ──────────────────────────────────────────
    let metadata: VideoMetadata;
    try {
      metadata = await probeVideo(originalPath);
      console.log(
        `[processVideo] Probed metadata: ${metadata.width}x${metadata.height}, ` +
        `${metadata.duration.toFixed(1)}s, ${metadata.fps}fps, ` +
        `${metadata.videoCodec}/${metadata.audioCodec ?? "no audio"}, ` +
        `${(metadata.bitrate / 1000).toFixed(0)}kbps`,
      );
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.error(
          "[processVideo] ffprobe not found on this machine. " +
          "Install FFmpeg (https://ffmpeg.org) to enable video processing. " +
          "Skipping transcoding — updating DB with existing metadata only.",
        );
        // Fall back to DB values so the record is still updated
        await updateDatabaseFallback(videoId, video);
        return;
      }
      throw err;
    }

    // ── 4. Transcode to quality variants ───────────────────────────
    const uploadedVariants: Array<{
      quality: string;
      width: number;
      height: number;
      fps: number;
      fileSize: number;
      cdnUrl: string;
    }> = [];

    for (const variant of QUALITY_VARIANTS) {
      // Only transcode if the original is at least as large as the target
      if (metadata.width < variant.width && metadata.height < variant.height) {
        console.log(`[processVideo] Skipping ${variant.name} (${variant.width}x${variant.height}) — source too small`);
        continue;
      }

      const outputFilename = `${variant.name}.mp4`;
      const outputPath = path.join(tempDir, outputFilename);

      console.log(`[processVideo] Transcoding ${variant.name} (${variant.width}x${variant.height})...`);
      try {
        await transcodeVariant(originalPath, outputPath, {
          width: variant.width,
          height: variant.height,
          videoBitrate: variant.videoBitrate,
          audioBitrate: variant.audioBitrate,
          preset: "slow",
        });

        const variantBuffer = await readFile(outputPath);
        const s3Key = `videos/${videoId}/${outputFilename}`;
        const cdnUrl = await uploadToS3(s3Key, variantBuffer, "video/mp4");

        uploadedVariants.push({
          quality: variant.name,
          width: variant.width,
          height: variant.height,
          fps: metadata.fps,
          fileSize: variantBuffer.length,
          cdnUrl,
        });

        console.log(
          `[processVideo] Uploaded ${variant.name}: ${(variantBuffer.length / 1_048_576).toFixed(1)} MB`,
        );
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.error("[processVideo] ffmpeg not found — cannot transcode. Install FFmpeg.");
          break;
        }
        console.error(`[processVideo] Failed to transcode ${variant.name}:`, err.message);
        // Continue with other variants
      }
    }

    // ── 5. Generate thumbnail at 25% of duration ───────────────────
    let thumbnailUrl: string | null = null;
    const thumbnailTime = Math.max(1, Math.floor(metadata.duration * 0.25));
    const thumbnailPath = path.join(tempDir, "thumbnail.jpg");

    try {
      console.log(`[processVideo] Extracting thumbnail at ${thumbnailTime}s...`);
      await extractThumbnail(originalPath, thumbnailPath, thumbnailTime);

      const thumbBuffer = await readFile(thumbnailPath);
      const thumbKey = `videos/${videoId}/thumbnail.jpg`;
      thumbnailUrl = await uploadToS3(thumbKey, thumbBuffer, "image/jpeg");
      console.log(`[processVideo] Uploaded thumbnail (${(thumbBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.error("[processVideo] ffmpeg not found — cannot extract thumbnail.");
      } else {
        console.error("[processVideo] Failed to extract thumbnail:", err.message);
      }
    }

    // ── 6. Generate preview clip (3s from 20% mark) ────────────────
    const previewStart = Math.max(0, Math.floor(metadata.duration * 0.2));
    const previewDuration = Math.min(3, metadata.duration - previewStart);
    const previewPath = path.join(tempDir, "preview.mp4");

    try {
      if (previewDuration > 0) {
        console.log(`[processVideo] Creating preview clip at ${previewStart}s (${previewDuration}s)...`);
        await createPreviewClip(originalPath, previewPath, previewStart, previewDuration);

        const previewBuffer = await readFile(previewPath);
        const previewKey = `videos/${videoId}/preview.mp4`;
        await uploadToS3(previewKey, previewBuffer, "video/mp4");
        console.log(`[processVideo] Uploaded preview (${(previewBuffer.length / 1024).toFixed(0)} KB)`);
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.error("[processVideo] ffmpeg not found — cannot create preview clip.");
      } else {
        console.error("[processVideo] Failed to create preview clip:", err.message);
      }
    }

    // ── 7. Compute derived fields ──────────────────────────────────
    const orientation =
      metadata.width > metadata.height
        ? "landscape"
        : metadata.height > metadata.width
          ? "portrait"
          : "square";

    // ── 8. Update database ─────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Update video record
      await tx.video.update({
        where: { id: videoId },
        data: {
          status: "processed",
          orientation,
          durationSeconds: Math.round(metadata.duration),
          frameRate: metadata.fps,
          width: metadata.width,
          height: metadata.height,
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        },
      });

      // Remove old file variants and insert new ones
      await tx.videoFile.deleteMany({ where: { videoId } });

      if (uploadedVariants.length > 0) {
        await tx.videoFile.createMany({
          data: uploadedVariants.map((v) => ({
            videoId,
            quality: v.quality,
            fileType: "mp4",
            width: v.width,
            height: v.height,
            fps: v.fps,
            fileSize: BigInt(v.fileSize),
            cdnUrl: v.cdnUrl,
          })),
        });
      }
    });

    console.log(
      `[processVideo] Updated DB: ${videoId} → processed ` +
      `(${orientation}, ${metadata.duration.toFixed(1)}s, ${uploadedVariants.length} variants)`,
    );

    // ── 9. Enqueue search index job ────────────────────────────────
    await searchIndexQueue.add("index-video", {
      mediaType: "video",
      mediaId: videoId,
      action: "index",
    });

    console.log(`[processVideo] Video processed successfully: ${videoId}`);
  } finally {
    // ── 10. Clean up temp files ────────────────────────────────────
    await cleanupTempDir(tempDir);
    console.log(`[processVideo] Cleaned up temp directory`);
  }
}

/**
 * Fallback when FFmpeg is not available: update DB with whatever
 * metadata we already have and mark as processed so the pipeline
 * doesn't stall.
 */
async function updateDatabaseFallback(
  videoId: string,
  video: { width: number; height: number; durationSeconds: number | null; frameRate: number | null },
): Promise<void> {
  const orientation =
    video.width > video.height
      ? "landscape"
      : video.height > video.width
        ? "portrait"
        : "square";

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "processed",
      orientation,
      durationSeconds: video.durationSeconds ?? 0,
      frameRate: video.frameRate ?? 30,
    },
  });

  await searchIndexQueue.add("index-video", {
    mediaType: "video",
    mediaId: videoId,
    action: "index",
  });

  console.log(`[processVideo] Fallback update complete: ${videoId} (${orientation})`);
}
