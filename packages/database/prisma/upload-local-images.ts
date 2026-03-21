import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// MinIO/S3 configuration from .env
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_BUCKET = process.env.S3_BUCKET || "pixelstock-media";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";

interface ImageMetadata {
  filename: string;
  title: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  category: string;
  tags: string[];
  color: string;
}

// Parse filename to extract metadata
function parseFilename(filename: string): ImageMetadata {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  
  // Extract dimensions if present (e.g., "5472x3648")
  const dimensionMatch = nameWithoutExt.match(/(\d{3,5})x(\d{3,5})/);
  let width = 5000;
  let height = 3333;
  
  if (dimensionMatch) {
    width = parseInt(dimensionMatch[1]);
    height = parseInt(dimensionMatch[2]);
  }
  
  // Determine orientation
  let orientation: "landscape" | "portrait" | "square" = "landscape";
  if (width > height) orientation = "landscape";
  else if (height > width) orientation = "portrait";
  else orientation = "square";
  
  // Extract title from filename (remove dimensions and clean up)
  let title = nameWithoutExt
    .replace(/_/g, " ")
    .replace(/\d{3,5}x\d{3,5}/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\W+/, "")
    .trim();
  
  // Capitalize first letter of each word
  title = title.split(" ").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
  
  // Determine category and tags based on filename keywords
  const lowerName = nameWithoutExt.toLowerCase();
  let category = "nature";
  let tags = ["nature", "landscape"];
  let color = "#4a7fb5";
  
  if (lowerName.includes("mountain") || lowerName.includes("peak") || lowerName.includes("hill")) {
    tags.push("mountain");
    color = "#7d8a96";
  }
  if (lowerName.includes("water") || lowerName.includes("ocean") || lowerName.includes("sea") || lowerName.includes("lake")) {
    tags.push("water", "ocean");
    color = "#4a9fb5";
  }
  if (lowerName.includes("sunset") || lowerName.includes("sunrise")) {
    tags.push("sunset", "sky");
    color = "#e87d2f";
  }
  if (lowerName.includes("flower") || lowerName.includes("blossom") || lowerName.includes("lavender")) {
    tags.push("flowers");
    color = "#e8a0b4";
  }
  if (lowerName.includes("forest") || lowerName.includes("tree") || lowerName.includes("woodland")) {
    tags.push("forest");
    color = "#6b8e7d";
  }
  if (lowerName.includes("bird") || lowerName.includes("animal")) {
    category = "animals";
    tags = ["animals", "nature"];
    color = "#8b6f5a";
  }
  if (lowerName.includes("sky") || lowerName.includes("cloud")) {
    tags.push("sky");
    color = "#a8c5dd";
  }
  if (lowerName.includes("beach") || lowerName.includes("sand")) {
    tags.push("beach");
    color = "#d4a574";
  }
  if (lowerName.includes("grass") || lowerName.includes("field") || lowerName.includes("meadow")) {
    tags.push("landscape");
    color = "#7fb069";
  }
  if (lowerName.includes("star") || lowerName.includes("night")) {
    tags.push("sky");
    color = "#1a1a2e";
  }
  if (lowerName.includes("fall") || lowerName.includes("autumn")) {
    tags.push("landscape");
    color = "#e87d5f";
  }
  if (lowerName.includes("leaf") || lowerName.includes("green")) {
    tags.push("nature");
    color = "#6b8e7d";
  }
  
  // Remove duplicates
  tags = [...new Set(tags)];
  
  return {
    filename,
    title: title || "Beautiful Nature Photography",
    width,
    height,
    orientation,
    category,
    tags,
    color,
  };
}

async function uploadToMinIO(filePath: string, photoId: string): Promise<string> {
  try {
    // For now, we'll use the local file path
    // In production, you would upload to MinIO using AWS SDK
    const filename = path.basename(filePath);
    const cdnUrl = `${S3_ENDPOINT}/${S3_BUCKET}/photos/${photoId}/${filename}`;
    
    console.log(`  📤 Would upload to: ${cdnUrl}`);
    console.log(`  📁 Local file: ${filePath}`);
    
    // Return the local file path for now (you can access via file:// protocol)
    return `file:///${filePath.replace(/\\/g, "/")}`;
  } catch (error) {
    console.error(`  ❌ Upload failed:`, error);
    throw error;
  }
}

async function main() {
  console.log("🖼️  Starting image upload from local folder...\n");
  
  const imagesFolder = "d:\\Pexels\\stock imges";
  
  // Check if folder exists
  if (!fs.existsSync(imagesFolder)) {
    console.error(`❌ Folder not found: ${imagesFolder}`);
    process.exit(1);
  }
  
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
  });
  
  if (!admin) {
    console.error("❌ Admin user not found. Please run seed first.");
    process.exit(1);
  }
  
  // Get or create a photographer for these images
  let photographer = await prisma.user.findUnique({
    where: { username: "nature_explorer" },
  });
  
  if (!photographer) {
    const pw = crypto.randomBytes(16).toString("hex");
    photographer = await prisma.user.create({
      data: {
        username: "nature_explorer",
        email: "nature@pixelstock.app",
        passwordHash: pw,
        displayName: "Nature Explorer",
        bio: "Professional nature and landscape photographer",
        location: "Worldwide",
        isVerified: true,
        isContributor: true,
        followersCount: 5000,
      },
    });
    console.log("✅ Created photographer: nature_explorer\n");
  }
  
  // Get all image files
  const files = fs.readdirSync(imagesFolder)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .filter(file => !file.includes(" (1).")); // Skip duplicates
  
  console.log(`📸 Found ${files.length} images to upload\n`);
  
  // Get or create tags
  const tagCache: Record<string, any> = {};
  const allTags = new Set<string>();
  
  files.forEach(file => {
    const metadata = parseFilename(file);
    metadata.tags.forEach(tag => allTags.add(tag));
  });
  
  for (const tagName of Array.from(allTags)) {
    let tag = await prisma.tag.findUnique({ where: { slug: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName, slug: tagName },
      });
    }
    tagCache[tagName] = tag;
  }
  
  console.log(`✅ Prepared ${Object.keys(tagCache).length} tags\n`);
  
  // Upload each image
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(imagesFolder, file);
    const metadata = parseFilename(file);
    
    console.log(`[${i + 1}/${files.length}] Processing: ${file}`);
    console.log(`  📝 Title: ${metadata.title}`);
    console.log(`  📐 Dimensions: ${metadata.width}x${metadata.height} (${metadata.orientation})`);
    console.log(`  🏷️  Tags: ${metadata.tags.join(", ")}`);
    
    try {
      // Create slug
      const slug = metadata.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + `-${Date.now()}-${i}`;
      
      // Upload to MinIO (or use local path for now)
      const originalUrl = await uploadToMinIO(filePath, slug);
      
      // Calculate megapixels
      const megapixels = (metadata.width * metadata.height) / 1_000_000;
      
      // Create photo in database
      const photo = await prisma.photo.create({
        data: {
          slug,
          altText: metadata.title,
          description: `High quality ${metadata.category} photography: ${metadata.title}. Professional nature and landscape image.`,
          width: metadata.width,
          height: metadata.height,
          megapixels,
          orientation: metadata.orientation,
          dominantColor: metadata.color,
          colorBucket: metadata.color.includes("e8") ? "warm" : metadata.color.includes("4") ? "cool" : "neutral",
          sizeTier: megapixels > 24 ? "large" : megapixels > 12 ? "medium" : "small",
          originalUrl,
          cdnKey: slug,
          userId: photographer.id,
          status: "approved",
          isCurated: Math.random() > 0.6, // 40% curated
          isFeatured: Math.random() > 0.85, // 15% featured
          viewsCount: BigInt(Math.floor(Math.random() * 50000)),
          downloadsCount: BigInt(Math.floor(Math.random() * 5000)),
          likesCount: Math.floor(Math.random() * 500),
          approvedAt: new Date(),
          approvedBy: admin.id,
        },
      });
      
      // Link tags
      for (const tagName of metadata.tags) {
        if (tagCache[tagName]) {
          await prisma.photoTag.create({
            data: {
              photoId: photo.id,
              tagId: tagCache[tagName].id,
              isAiGen: false,
            },
          });
          
          // Update tag count
          await prisma.tag.update({
            where: { id: tagCache[tagName].id },
            data: { photosCount: { increment: 1 } },
          });
        }
      }
      
      console.log(`  ✅ Uploaded successfully!\n`);
      successCount++;
      
    } catch (error) {
      console.error(`  ❌ Error:`, error);
      errorCount++;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`🎉 Upload complete!`);
  console.log(`✅ Success: ${successCount} images`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} images`);
  }
  console.log("=".repeat(60));
  
  // Update photographer photo count
  const photoCount = await prisma.photo.count({
    where: { userId: photographer.id },
  });
  
  console.log(`\n📊 Photographer "${photographer.displayName}" now has ${photoCount} photos`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
