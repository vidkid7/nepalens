#!/usr/bin/env node
/**
 * Seed stock videos: upload to Cloudinary then insert into PostgreSQL.
 * Usage: node scripts/seed-stock-videos.mjs
 */
import { execSync, spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import path from "path";
import crypto from "crypto";

// ── Load env from apps/web/.env.local ──
const envPath = path.resolve("apps/web/.env.local");
const envText = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const DATABASE_URL = env.DATABASE_URL;
const CLOUD_NAME   = env.CLOUDINARY_CLOUD_NAME   || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY       = env.CLOUDINARY_API_KEY;
const API_SECRET    = env.CLOUDINARY_API_SECRET;

if (!DATABASE_URL || !CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing env vars. Need DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

// ── Video metadata ──
const VIDEOS = [
  {
    file: "12032422-uhd_3840_2160_60fps.mp4",
    title: "Aerial Mountain Sunrise",
    description: "Breathtaking aerial view of mountain peaks at sunrise with golden light",
    width: 3840, height: 2160, duration: 20, fps: 60,
    orientation: "landscape", isPremium: false,
    tags: ["aerial", "mountain", "sunrise", "landscape", "nature", "golden hour", "drone"]
  },
  {
    file: "13103067_2160_3840_30fps.mp4",
    title: "City Night Lights Portrait",
    description: "Vertical cityscape at night with vibrant neon lights and traffic",
    width: 2160, height: 3840, duration: 15, fps: 30,
    orientation: "portrait", isPremium: false,
    tags: ["city", "night", "neon", "urban", "portrait", "traffic", "lights"]
  },
  {
    file: "1390942-uhd_4096_2160_24fps.mp4",
    title: "Ocean Waves Crashing",
    description: "Ultra-wide cinematic ocean waves crashing against rocky shore",
    width: 4096, height: 2160, duration: 30, fps: 24,
    orientation: "landscape", isPremium: true,
    tags: ["ocean", "waves", "sea", "coast", "cinematic", "nature", "water"]
  },
  {
    file: "15375254_3840_2160_60fps.mp4",
    title: "Forest Canopy Timelapse",
    description: "Stunning timelapse through dense forest canopy with dappled sunlight",
    width: 3840, height: 2160, duration: 45, fps: 60,
    orientation: "landscape", isPremium: true,
    tags: ["forest", "timelapse", "nature", "trees", "sunlight", "canopy", "green"]
  },
  {
    file: "15483869_3840_2160_60fps.mp4",
    title: "Abstract Light Particles",
    description: "Mesmerizing abstract light particles floating in dark space",
    width: 3840, height: 2160, duration: 25, fps: 60,
    orientation: "landscape", isPremium: false,
    tags: ["abstract", "particles", "light", "dark", "motion", "bokeh", "glow"]
  },
  {
    file: "7677755-hd_1080_1920_25fps.mp4",
    title: "Rain on Window Close-up",
    description: "Vertical close-up of raindrops running down a window with blurred city background",
    width: 1080, height: 1920, duration: 12, fps: 25,
    orientation: "portrait", isPremium: false,
    tags: ["rain", "window", "close-up", "water", "drops", "city", "mood"]
  }
];

// ── Cloudinary signed upload ──
function uploadToCloudinary(filePath) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "pixelstock/videos";
  const toSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  console.log(`  Uploading ${path.basename(filePath)} …`);
  const args = [
    "-s", "-X", "POST",
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`,
    "-F", `file=@${filePath}`,
    "-F", `api_key=${API_KEY}`,
    "-F", `timestamp=${timestamp}`,
    "-F", `signature=${signature}`,
    "-F", `folder=${folder}`,
    "-F", `resource_type=video`
  ];

  const proc = spawnSync("curl", args, { maxBuffer: 500 * 1024 * 1024, timeout: 600_000 });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw new Error(`curl exited with ${proc.status}: ${proc.stderr?.toString()}`);
  return JSON.parse(proc.stdout.toString());
}

// ── Seed one video into DB ──
async function seedVideo(meta, cloudinaryUrl, adminUserId) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const slug = meta.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    const id = `sv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Cloudinary thumbnail
    let thumbnailUrl = null;
    if (cloudinaryUrl.includes("res.cloudinary.com")) {
      thumbnailUrl = cloudinaryUrl
        .replace("/video/upload/", "/video/upload/so_0,w_640,c_limit,q_auto,f_jpg/")
        .replace(/\.[^.]+$/, ".jpg");
    }

    // Insert video — camelCase columns need double-quotes
    await client.query(
      `INSERT INTO videos (id, "userId", slug, "altText", description, width, height, "durationSeconds", "frameRate", "thumbnailUrl", orientation, status, "isPremium", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved', $12, NOW(), NOW())`,
      [id, adminUserId, slug, meta.title, meta.description, meta.width, meta.height, meta.duration, meta.fps, thumbnailUrl, meta.orientation, meta.isPremium]
    );

    // Insert video files — NO createdAt/updatedAt columns
    // Original
    await client.query(
      `INSERT INTO video_files (id, "videoId", quality, "fileType", width, height, fps, "cdnUrl")
       VALUES ($1, $2, 'original', 'mp4', $3, $4, $5, $6)`,
      [`${id}_orig`, id, meta.width, meta.height, meta.fps, cloudinaryUrl]
    );
    // HD variant
    if (meta.width >= 1280) {
      const hdW = Math.min(meta.width, 1920);
      const hdH = Math.round((hdW / meta.width) * meta.height);
      await client.query(
        `INSERT INTO video_files (id, "videoId", quality, "fileType", width, height, fps, "cdnUrl")
         VALUES ($1, $2, 'hd', 'mp4', $3, $4, $5, $6)`,
        [`${id}_hd`, id, hdW, hdH, meta.fps, cloudinaryUrl]
      );
    }
    // SD variant
    const sdW = Math.min(meta.width, 960);
    const sdH = Math.round((sdW / meta.width) * meta.height);
    await client.query(
      `INSERT INTO video_files (id, "videoId", quality, "fileType", width, height, fps, "cdnUrl")
       VALUES ($1, $2, 'sd', 'mp4', $3, $4, $5, $6)`,
      [`${id}_sd`, id, sdW, sdH, meta.fps, cloudinaryUrl]
    );

    // Insert tags — NO updatedAt on tags table
    for (const tagName of meta.tags) {
      const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
      const tagId = `tag_${tagSlug}_${Math.random().toString(36).slice(2, 6)}`;
      await client.query(
        `INSERT INTO tags (id, name, slug, "createdAt") VALUES ($1, $2, $3, NOW()) ON CONFLICT (name) DO NOTHING`,
        [tagId, tagName, tagSlug]
      );
      const tagResult = await client.query(`SELECT id FROM tags WHERE name = $1`, [tagName]);
      if (tagResult.rows[0]) {
        // video_tags: composite PK (videoId, tagId), NO id column, NO createdAt
        await client.query(
          `INSERT INTO video_tags ("videoId", "tagId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, tagResult.rows[0].id]
        );
      }
    }

    console.log(`  ✅ Seeded: ${meta.title} (${id})`);
    return id;
  } finally {
    await client.end();
  }
}

// ── Main ──
async function main() {
  console.log("🎬 Stock Video Seeder\n");

  // Find admin user
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  const adminResult = await client.query(`SELECT id FROM users WHERE "isAdmin" = true LIMIT 1`);
  await client.end();

  if (!adminResult.rows[0]) {
    console.error("No admin user found!");
    process.exit(1);
  }
  const adminUserId = adminResult.rows[0].id;
  console.log(`Admin user: ${adminUserId}\n`);

  const videosDir = path.resolve("stock videos");

  for (const meta of VIDEOS) {
    const filePath = path.join(videosDir, meta.file);
    if (!existsSync(filePath)) {
      console.log(`⚠ Skipping ${meta.file} (not found)`);
      continue;
    }
    console.log(`\n📹 Processing: ${meta.title}`);
    try {
      const cloudResult = uploadToCloudinary(filePath);
      if (cloudResult.error) {
        console.error(`  ❌ Cloudinary error: ${JSON.stringify(cloudResult.error)}`);
        continue;
      }
      console.log(`  ☁ Uploaded: ${cloudResult.secure_url}`);
      await seedVideo(meta, cloudResult.secure_url, adminUserId);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  console.log("\n🎉 Done!");
}

main().catch(console.error);
