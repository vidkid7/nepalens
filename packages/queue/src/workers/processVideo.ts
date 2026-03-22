import { prisma } from "@pixelstock/database";
import { searchIndexQueue } from "../index";
import type { ProcessVideoJob } from "../index";

/**
 * Video processing worker (stub).
 *
 * Production implementation would:
 * 1. Download the original video from S3
 * 2. Probe metadata with FFmpeg (duration, resolution, codecs)
 * 3. Transcode to multiple quality variants (720p, 1080p, 4K)
 * 4. Generate HLS/DASH adaptive streaming segments
 * 5. Extract thumbnail frames
 * 6. Generate a preview GIF / short clip
 * 7. Upload all variants back to S3/CDN
 * 8. Update the database with processed metadata
 *
 * This stub performs only metadata lookup, status update, and search indexing.
 */
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

  // ── 2. Download from S3 (metadata only in stub) ──────────────────
  // TODO: Download the original video file from S3
  // const originalKey = `videos/${videoId}/original`;
  // const originalBuffer = await downloadFromS3(originalKey);

  // ── 3. Probe video metadata with FFmpeg ──────────────────────────
  // TODO: Use FFmpeg/FFprobe to extract:
  //   - Duration (seconds)
  //   - Frame rate (fps)
  //   - Codec info (video + audio)
  //   - Bitrate
  //   - Rotation / orientation
  //
  // Example:
  //   const probe = await ffprobe(originalBuffer);
  //   const duration = probe.format.duration;
  //   const fps = eval(probe.streams[0].r_frame_rate);

  const duration = video.durationSeconds || 0;
  const fps = video.frameRate || 30;

  console.log(`[processVideo] Video metadata: ${duration}s, ${fps}fps`);

  // ── 4. Transcode to quality variants ─────────────────────────────
  // TODO: Transcode to multiple resolutions using FFmpeg:
  //
  // const qualities = [
  //   { name: 'sd',   width: 960,  height: 540,  bitrate: '1500k' },
  //   { name: 'hd',   width: 1280, height: 720,  bitrate: '3000k' },
  //   { name: 'fhd',  width: 1920, height: 1080, bitrate: '6000k' },
  //   { name: '4k',   width: 3840, height: 2160, bitrate: '15000k' },
  // ];
  //
  // for (const q of qualities) {
  //   if (video.width >= q.width) {
  //     const output = await ffmpeg(originalBuffer, {
  //       width: q.width,
  //       height: q.height,
  //       videoBitrate: q.bitrate,
  //       codec: 'libx264',
  //       preset: 'slow',
  //       format: 'mp4',
  //     });
  //     await uploadToS3(`videos/${videoId}/${q.name}.mp4`, output, 'video/mp4');
  //
  //     // Also generate HLS segments
  //     const hlsOutput = await ffmpegHLS(originalBuffer, q);
  //     await uploadToS3(`videos/${videoId}/hls/${q.name}/`, hlsOutput);
  //   }
  // }

  console.log(`[processVideo] Transcoding would happen here for ${videoId}`);

  // ── 5. Generate thumbnail ────────────────────────────────────────
  // TODO: Extract thumbnail at 25% of duration
  //
  // const thumbnailTime = Math.max(1, Math.floor(duration * 0.25));
  // const thumbnail = await ffmpeg(originalBuffer, {
  //   seekTo: thumbnailTime,
  //   frames: 1,
  //   format: 'mjpeg',
  //   width: 1280,
  //   height: 720,
  // });
  // await uploadToS3(`videos/${videoId}/thumbnail.jpg`, thumbnail, 'image/jpeg');

  console.log(`[processVideo] Thumbnail generation would happen here for ${videoId}`);

  // ── 6. Generate preview GIF ──────────────────────────────────────
  // TODO: Create a short preview GIF/WebP from the first few seconds
  //
  // const preview = await ffmpeg(originalBuffer, {
  //   startTime: Math.floor(duration * 0.2),
  //   duration: 3,
  //   width: 480,
  //   fps: 10,
  //   format: 'gif',
  // });
  // await uploadToS3(`videos/${videoId}/preview.gif`, preview, 'image/gif');

  console.log(`[processVideo] Preview generation would happen here for ${videoId}`);

  // ── 7. Compute derived fields ────────────────────────────────────
  const orientation =
    video.width > video.height
      ? "landscape"
      : video.height > video.width
        ? "portrait"
        : "square";

  // ── 8. Update database ───────────────────────────────────────────
  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "processed",
      orientation,
      durationSeconds: duration,
      frameRate: fps,
    },
  });

  console.log(`[processVideo] Updated video record: ${videoId} → processed`);

  // ── 9. Enqueue search index job ──────────────────────────────────
  await searchIndexQueue.add("index-video", {
    mediaType: "video",
    mediaId: videoId,
    action: "index",
  });

  console.log(`[processVideo] Video processed successfully: ${videoId} (${orientation}, ${duration}s)`);
}
