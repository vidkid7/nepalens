import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@nepalens.app" },
    update: {},
    create: {
      username: "admin",
      email: "admin@nepalens.app",
      passwordHash: adminPassword,
      displayName: "Admin",
      isAdmin: true,
      isVerified: true,
      isContributor: true,
    },
  });

  // Create sample photographers
  const photographers = [];
  const photographerData = [
    { username: "johndoe", displayName: "John Doe", location: "New York, USA" },
    { username: "janephoto", displayName: "Jane Smith", location: "London, UK" },
    { username: "alexcam", displayName: "Alex Camera", location: "Tokyo, Japan" },
  ];

  for (const data of photographerData) {
    const pw = await hashPassword("password123");
    const user = await prisma.user.upsert({
      where: { email: `${data.username}@example.com` },
      update: {},
      create: {
        username: data.username,
        email: `${data.username}@example.com`,
        passwordHash: pw,
        displayName: data.displayName,
        location: data.location,
        isVerified: true,
        isContributor: true,
      },
    });
    photographers.push(user);
  }

  // Create categories
  const categoryData = [
    { name: "Nature", slug: "nature", position: 1 },
    { name: "Architecture", slug: "architecture", position: 2 },
    { name: "People", slug: "people", position: 3 },
    { name: "Travel", slug: "travel", position: 4 },
    { name: "Technology", slug: "technology", position: 5 },
    { name: "Food", slug: "food", position: 6 },
    { name: "Animals", slug: "animals", position: 7 },
    { name: "Business", slug: "business", position: 8 },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Create tags
  const tagNames = [
    "nature", "landscape", "ocean", "mountain", "sunset", "forest",
    "city", "architecture", "building", "street", "urban",
    "people", "portrait", "business", "technology", "food",
    "travel", "animals", "flowers", "sky", "beach", "water",
  ];

  const tags: Record<string, any> = {};
  for (const name of tagNames) {
    tags[name] = await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name, slug: name },
    });
  }

  // Create sample photos
  const samplePhotos = [
    {
      slug: "serene-ocean-waves-with-deep-blue-hues",
      altText: "Serene ocean waves with deep blue hues",
      width: 6000,
      height: 4000,
      orientation: "landscape",
      colorBucket: "blue",
      dominantColor: "#1e4d8c",
      status: "approved",
      isCurated: true,
      tagNames: ["ocean", "water", "nature", "landscape"],
    },
    {
      slug: "golden-sunset-over-mountain-range",
      altText: "Golden sunset over mountain range",
      width: 5000,
      height: 3333,
      orientation: "landscape",
      colorBucket: "orange",
      dominantColor: "#e87d2f",
      status: "approved",
      isFeatured: true,
      isCurated: true,
      tagNames: ["sunset", "mountain", "nature", "landscape", "sky"],
    },
    {
      slug: "modern-glass-skyscraper-downtown",
      altText: "Modern glass skyscraper in downtown",
      width: 3000,
      height: 4500,
      orientation: "portrait",
      colorBucket: "blue",
      dominantColor: "#4a7fb5",
      status: "approved",
      tagNames: ["architecture", "building", "city", "urban"],
    },
    {
      slug: "cherry-blossoms-in-spring",
      altText: "Cherry blossoms blooming in spring",
      width: 4000,
      height: 4000,
      orientation: "square",
      colorBucket: "pink",
      dominantColor: "#e8a0b4",
      status: "approved",
      isCurated: true,
      tagNames: ["flowers", "nature", "landscape"],
    },
    {
      slug: "busy-city-street-at-night",
      altText: "Busy city street illuminated at night",
      width: 5472,
      height: 3648,
      orientation: "landscape",
      colorBucket: "black",
      dominantColor: "#1a1a2e",
      status: "approved",
      tagNames: ["city", "street", "urban", "architecture"],
    },
  ];

  for (let i = 0; i < samplePhotos.length; i++) {
    const photoData = samplePhotos[i];
    const photographer = photographers[i % photographers.length];
    const { tagNames: photoTagNames, ...rest } = photoData;

    const photo = await prisma.photo.create({
      data: {
        ...rest,
        userId: photographer.id,
        megapixels: (rest.width * rest.height) / 1_000_000,
        sizeTier: rest.width * rest.height > 24_000_000 ? "large" : rest.width * rest.height > 12_000_000 ? "medium" : "small",
        originalUrl: `https://placeholder.nepalens.app/photos/${rest.slug}.jpg`,
        viewsCount: BigInt(Math.floor(Math.random() * 50000)),
        downloadsCount: BigInt(Math.floor(Math.random() * 5000)),
        likesCount: Math.floor(Math.random() * 500),
        approvedAt: new Date(),
        approvedBy: admin.id,
      },
    });

    // Link tags
    for (const tagName of photoTagNames) {
      if (tags[tagName]) {
        await prisma.photoTag.create({
          data: { photoId: photo.id, tagId: tags[tagName].id },
        });
      }
    }
  }

  // Create system collections for each user
  for (const user of [admin, ...photographers]) {
    await prisma.collection.upsert({
      where: { id: `${user.id}-likes` },
      update: {},
      create: {
        id: `${user.id}-likes`,
        userId: user.id,
        title: "Your Likes",
        isSystem: true,
        systemType: "likes",
      },
    });
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
