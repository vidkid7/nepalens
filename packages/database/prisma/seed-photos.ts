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

// Photo data organized by category
const photosByCategory = {
  nature: [
    { title: "Mountain Lake Reflection", tags: ["nature", "mountain", "water", "landscape"], color: "#2c5f7d" },
    { title: "Forest Path in Autumn", tags: ["nature", "forest", "landscape"], color: "#8b5a3c" },
    { title: "Ocean Waves at Sunset", tags: ["ocean", "water", "sunset", "nature"], color: "#e87d2f" },
    { title: "Misty Mountain Peak", tags: ["mountain", "nature", "landscape"], color: "#6b7c8f" },
    { title: "Tropical Beach Paradise", tags: ["beach", "ocean", "nature", "travel"], color: "#4a9fb5" },
    { title: "Desert Sand Dunes", tags: ["nature", "landscape"], color: "#d4a574" },
    { title: "Northern Lights Display", tags: ["nature", "sky", "landscape"], color: "#2d5f4f" },
    { title: "Waterfall in Rainforest", tags: ["water", "nature", "forest"], color: "#3d6b4f" },
    { title: "Snowy Mountain Range", tags: ["mountain", "nature", "landscape"], color: "#b8c9d9" },
    { title: "Sunset Over Ocean", tags: ["sunset", "ocean", "nature", "sky"], color: "#ff6b35" },
    { title: "Cherry Blossom Trees", tags: ["flowers", "nature", "landscape"], color: "#e8a0b4" },
    { title: "Rocky Coastline", tags: ["ocean", "nature", "landscape"], color: "#5a7d8f" },
    { title: "Alpine Meadow Flowers", tags: ["flowers", "nature", "mountain"], color: "#7fb069" },
    { title: "Volcanic Landscape", tags: ["nature", "landscape"], color: "#4a4a4a" },
    { title: "River Through Valley", tags: ["water", "nature", "landscape"], color: "#4d7c8a" },
  ],
  architecture: [
    { title: "Modern Glass Skyscraper", tags: ["architecture", "building", "city", "urban"], color: "#4a7fb5" },
    { title: "Historic Cathedral Interior", tags: ["architecture", "building"], color: "#8b7355" },
    { title: "Minimalist White Building", tags: ["architecture", "building", "urban"], color: "#e8e8e8" },
    { title: "Futuristic Bridge Design", tags: ["architecture", "city", "urban"], color: "#5a6d7e" },
    { title: "Traditional Japanese Temple", tags: ["architecture", "building", "travel"], color: "#8b4513" },
    { title: "Art Deco Facade", tags: ["architecture", "building", "city"], color: "#d4af37" },
    { title: "Contemporary Museum", tags: ["architecture", "building", "urban"], color: "#6b7c8f" },
    { title: "Gothic Architecture Details", tags: ["architecture", "building"], color: "#5a5a5a" },
    { title: "Spiral Staircase", tags: ["architecture", "building", "urban"], color: "#7d8a96" },
    { title: "Glass Dome Structure", tags: ["architecture", "building", "city"], color: "#a8c5dd" },
    { title: "Brutalist Concrete Building", tags: ["architecture", "building", "urban"], color: "#6b6b6b" },
    { title: "Colorful Row Houses", tags: ["architecture", "building", "city"], color: "#e85d75" },
    { title: "Modern Library Interior", tags: ["architecture", "building", "urban"], color: "#8b9dc3" },
    { title: "Industrial Warehouse", tags: ["architecture", "building", "urban"], color: "#7a6f5d" },
    { title: "Rooftop Garden View", tags: ["architecture", "city", "urban"], color: "#6b8e7d" },
  ],
  people: [
    { title: "Business Professional Portrait", tags: ["people", "portrait", "business"], color: "#4a5d6f" },
    { title: "Happy Family Together", tags: ["people", "portrait"], color: "#e8a87c" },
    { title: "Athlete in Action", tags: ["people", "portrait"], color: "#5a7d8f" },
    { title: "Creative Artist Working", tags: ["people", "portrait", "business"], color: "#7d6b8f" },
    { title: "Friends Laughing", tags: ["people", "portrait"], color: "#e8b4a0" },
    { title: "Elderly Wisdom Portrait", tags: ["people", "portrait"], color: "#8b7d6f" },
    { title: "Child Playing Outdoors", tags: ["people", "portrait"], color: "#a8c5b4" },
    { title: "Couple at Sunset", tags: ["people", "portrait", "sunset"], color: "#e87d5f" },
    { title: "Yoga Meditation", tags: ["people", "portrait"], color: "#b8c9d9" },
    { title: "Chef Cooking", tags: ["people", "portrait", "food"], color: "#d4a574" },
    { title: "Musician Performing", tags: ["people", "portrait"], color: "#6b5a7d" },
    { title: "Student Studying", tags: ["people", "portrait"], color: "#7d8a96" },
    { title: "Dancer in Motion", tags: ["people", "portrait"], color: "#e85d75" },
    { title: "Traveler with Backpack", tags: ["people", "portrait", "travel"], color: "#8b9dc3" },
    { title: "Remote Worker", tags: ["people", "portrait", "business", "technology"], color: "#6b7c8f" },
  ],
  technology: [
    { title: "Laptop on Desk", tags: ["technology", "business"], color: "#4a5d6f" },
    { title: "Smartphone Close-up", tags: ["technology"], color: "#2c3e50" },
    { title: "Circuit Board Macro", tags: ["technology"], color: "#3d5a80" },
    { title: "Data Center Servers", tags: ["technology", "business"], color: "#5a6d7e" },
    { title: "Coding on Screen", tags: ["technology", "business"], color: "#1e3a5f" },
    { title: "Wireless Headphones", tags: ["technology"], color: "#6b7c8f" },
    { title: "Smart Home Devices", tags: ["technology"], color: "#7d8a96" },
    { title: "Drone in Flight", tags: ["technology"], color: "#4a7fb5" },
    { title: "Virtual Reality Headset", tags: ["technology"], color: "#5a7d8f" },
    { title: "Robot Arm Assembly", tags: ["technology", "business"], color: "#6b6b6b" },
    { title: "Solar Panels Array", tags: ["technology", "nature"], color: "#4d7c8a" },
    { title: "Electric Car Charging", tags: ["technology", "travel"], color: "#5a8f7d" },
    { title: "3D Printer Working", tags: ["technology"], color: "#7a6f5d" },
    { title: "Fiber Optic Cables", tags: ["technology"], color: "#4a9fb5" },
    { title: "Smart Watch Display", tags: ["technology"], color: "#6b5a7d" },
  ],
  food: [
    { title: "Fresh Fruit Bowl", tags: ["food"], color: "#e85d75" },
    { title: "Gourmet Burger", tags: ["food"], color: "#8b5a3c" },
    { title: "Sushi Platter", tags: ["food"], color: "#e8a87c" },
    { title: "Coffee and Pastry", tags: ["food"], color: "#7d6b5a" },
    { title: "Colorful Smoothie Bowl", tags: ["food"], color: "#e8b4a0" },
    { title: "Pizza Margherita", tags: ["food"], color: "#d4a574" },
    { title: "Fresh Salad", tags: ["food"], color: "#7fb069" },
    { title: "Chocolate Dessert", tags: ["food"], color: "#5a4a3a" },
    { title: "Pasta Dish", tags: ["food"], color: "#e8c5a0" },
    { title: "Grilled Steak", tags: ["food"], color: "#8b6f5a" },
    { title: "Vegetable Market", tags: ["food"], color: "#6b8e7d" },
    { title: "Artisan Bread", tags: ["food"], color: "#d4a574" },
    { title: "Seafood Platter", tags: ["food"], color: "#4a9fb5" },
    { title: "Wine and Cheese", tags: ["food"], color: "#8b7355" },
    { title: "Breakfast Spread", tags: ["food"], color: "#e8d5b4" },
  ],
  travel: [
    { title: "Eiffel Tower Paris", tags: ["travel", "architecture", "city"], color: "#6b7c8f" },
    { title: "Tropical Island Beach", tags: ["travel", "beach", "ocean", "nature"], color: "#4a9fb5" },
    { title: "Ancient Ruins", tags: ["travel", "architecture"], color: "#8b7355" },
    { title: "Mountain Village", tags: ["travel", "mountain", "nature"], color: "#7d8a96" },
    { title: "Desert Caravan", tags: ["travel", "nature"], color: "#d4a574" },
    { title: "City Skyline Night", tags: ["travel", "city", "urban"], color: "#1a1a2e" },
    { title: "Safari Wildlife", tags: ["travel", "animals", "nature"], color: "#8b6f5a" },
    { title: "Venice Canals", tags: ["travel", "water", "city"], color: "#4d7c8a" },
    { title: "Japanese Garden", tags: ["travel", "nature", "landscape"], color: "#6b8e7d" },
    { title: "Northern Lights Iceland", tags: ["travel", "nature", "sky"], color: "#2d5f4f" },
    { title: "Santorini Sunset", tags: ["travel", "sunset", "architecture"], color: "#e87d2f" },
    { title: "Machu Picchu", tags: ["travel", "mountain", "architecture"], color: "#7d8a96" },
    { title: "Great Wall China", tags: ["travel", "architecture", "mountain"], color: "#6b7c8f" },
    { title: "Taj Mahal", tags: ["travel", "architecture"], color: "#e8e8e8" },
    { title: "Grand Canyon", tags: ["travel", "nature", "landscape"], color: "#d4a574" },
  ],
  animals: [
    { title: "Lion Portrait", tags: ["animals", "nature"], color: "#8b6f5a" },
    { title: "Elephant Herd", tags: ["animals", "nature"], color: "#7d8a96" },
    { title: "Colorful Parrot", tags: ["animals", "nature"], color: "#e85d75" },
    { title: "Dolphin Jumping", tags: ["animals", "ocean", "nature"], color: "#4a9fb5" },
    { title: "Butterfly on Flower", tags: ["animals", "flowers", "nature"], color: "#e8a0b4" },
    { title: "Penguin Colony", tags: ["animals", "nature"], color: "#2c3e50" },
    { title: "Tiger in Jungle", tags: ["animals", "nature", "forest"], color: "#8b5a3c" },
    { title: "Hummingbird Feeding", tags: ["animals", "nature"], color: "#7fb069" },
    { title: "Polar Bear", tags: ["animals", "nature"], color: "#e8e8e8" },
    { title: "Monkey Family", tags: ["animals", "nature"], color: "#8b7355" },
    { title: "Eagle in Flight", tags: ["animals", "nature", "sky"], color: "#6b7c8f" },
    { title: "Sea Turtle Swimming", tags: ["animals", "ocean", "nature"], color: "#4d7c8a" },
    { title: "Fox in Snow", tags: ["animals", "nature"], color: "#e87d5f" },
    { title: "Giraffe Savanna", tags: ["animals", "nature"], color: "#d4a574" },
    { title: "Owl Close-up", tags: ["animals", "nature"], color: "#7d6b5a" },
  ],
  business: [
    { title: "Office Meeting", tags: ["business", "people"], color: "#4a5d6f" },
    { title: "Stock Market Charts", tags: ["business", "technology"], color: "#2c5f7d" },
    { title: "Handshake Deal", tags: ["business", "people"], color: "#6b7c8f" },
    { title: "Modern Office Space", tags: ["business", "architecture", "urban"], color: "#7d8a96" },
    { title: "Business Presentation", tags: ["business", "people", "technology"], color: "#5a6d7e" },
    { title: "Startup Team", tags: ["business", "people"], color: "#e8a87c" },
    { title: "Financial Documents", tags: ["business"], color: "#e8e8e8" },
    { title: "Corporate Building", tags: ["business", "architecture", "city"], color: "#6b7c8f" },
    { title: "Video Conference", tags: ["business", "people", "technology"], color: "#4a7fb5" },
    { title: "Calculator and Pen", tags: ["business"], color: "#7d8a96" },
    { title: "Business Cards", tags: ["business"], color: "#e8d5b4" },
    { title: "Coffee Break Meeting", tags: ["business", "people", "food"], color: "#8b7355" },
    { title: "Warehouse Logistics", tags: ["business", "architecture"], color: "#7a6f5d" },
    { title: "Retail Store Interior", tags: ["business", "architecture"], color: "#e8b4a0" },
    { title: "Factory Production Line", tags: ["business", "technology"], color: "#6b6b6b" },
  ],
};

async function main() {
  console.log("🌱 Starting comprehensive photo seed...");

  // Create admin user
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@nepalens.app" },
    update: {},
    create: {
      username: "admin",
      email: "admin@nepalens.app",
      passwordHash: adminPassword,
      displayName: "Admin User",
      bio: "Platform administrator",
      isAdmin: true,
      isVerified: true,
      isContributor: true,
      followersCount: 1000,
    },
  });

  console.log("✅ Admin user created");

  // Create diverse photographers
  const photographerData = [
    { username: "sarah_lens", displayName: "Sarah Anderson", location: "New York, USA", bio: "Nature and landscape photographer" },
    { username: "mike_captures", displayName: "Mike Chen", location: "Tokyo, Japan", bio: "Urban and street photography" },
    { username: "emma_photos", displayName: "Emma Rodriguez", location: "Barcelona, Spain", bio: "Travel and architecture" },
    { username: "alex_vision", displayName: "Alex Kumar", location: "Mumbai, India", bio: "Portrait and people photography" },
    { username: "lisa_shots", displayName: "Lisa Thompson", location: "London, UK", bio: "Food and lifestyle" },
    { username: "david_frames", displayName: "David Park", location: "Seoul, South Korea", bio: "Technology and business" },
    { username: "maria_clicks", displayName: "Maria Silva", location: "Rio de Janeiro, Brazil", bio: "Wildlife and animals" },
    { username: "john_focus", displayName: "John Williams", location: "Sydney, Australia", bio: "Ocean and beach photography" },
  ];

  const photographers = [];
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
        bio: data.bio,
        isVerified: true,
        isContributor: true,
        followersCount: Math.floor(Math.random() * 5000) + 500,
      },
    });
    photographers.push(user);
  }

  console.log(`✅ Created ${photographers.length} photographers`);

  // Create categories
  const categoryData = [
    { name: "Nature", slug: "nature", description: "Beautiful landscapes and natural scenery", position: 1 },
    { name: "Architecture", slug: "architecture", description: "Buildings and structural designs", position: 2 },
    { name: "People", slug: "people", description: "Portraits and human subjects", position: 3 },
    { name: "Technology", slug: "technology", description: "Tech gadgets and digital world", position: 4 },
    { name: "Food", slug: "food", description: "Culinary delights and beverages", position: 5 },
    { name: "Travel", slug: "travel", description: "Destinations around the world", position: 6 },
    { name: "Animals", slug: "animals", description: "Wildlife and pets", position: 7 },
    { name: "Business", slug: "business", description: "Corporate and professional", position: 8 },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(`✅ Created ${categoryData.length} categories`);

  // Create all tags
  const allTags = new Set<string>();
  Object.values(photosByCategory).forEach(photos => {
    photos.forEach(photo => {
      photo.tags.forEach(tag => allTags.add(tag));
    });
  });

  const tags: Record<string, any> = {};
  for (const tagName of Array.from(allTags)) {
    tags[tagName] = await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: { name: tagName, slug: tagName },
    });
  }

  console.log(`✅ Created ${Object.keys(tags).length} tags`);

  // Create photos for each category
  let totalPhotos = 0;
  const orientations = ["landscape", "portrait", "square"];
  const dimensions = {
    landscape: [{ w: 6000, h: 4000 }, { w: 5472, h: 3648 }, { w: 5000, h: 3333 }],
    portrait: [{ w: 3000, h: 4500 }, { w: 4000, h: 6000 }, { w: 3648, h: 5472 }],
    square: [{ w: 4000, h: 4000 }, { w: 3000, h: 3000 }, { w: 5000, h: 5000 }],
  };

  for (const [category, photos] of Object.entries(photosByCategory)) {
    console.log(`📸 Creating ${photos.length} photos for ${category}...`);
    
    for (let i = 0; i < photos.length; i++) {
      const photoData = photos[i];
      const photographer = photographers[Math.floor(Math.random() * photographers.length)];
      const orientation = orientations[Math.floor(Math.random() * orientations.length)] as keyof typeof dimensions;
      const dims = dimensions[orientation][Math.floor(Math.random() * dimensions[orientation].length)];
      
      const slug = photoData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const megapixels = (dims.w * dims.h) / 1_000_000;
      
      const photo = await prisma.photo.create({
        data: {
          slug: `${slug}-${Date.now()}-${i}`,
          altText: photoData.title,
          description: `High quality ${category} photography: ${photoData.title}`,
          width: dims.w,
          height: dims.h,
          megapixels,
          orientation,
          dominantColor: photoData.color,
          colorBucket: photoData.color.includes("e8") ? "warm" : photoData.color.includes("4") ? "cool" : "neutral",
          sizeTier: megapixels > 24 ? "large" : megapixels > 12 ? "medium" : "small",
          originalUrl: `https://images.unsplash.com/photo-${Date.now()}?w=${dims.w}&h=${dims.h}`,
          userId: photographer.id,
          status: "approved",
          isCurated: Math.random() > 0.7,
          isFeatured: Math.random() > 0.9,
          viewsCount: BigInt(Math.floor(Math.random() * 100000)),
          downloadsCount: BigInt(Math.floor(Math.random() * 10000)),
          likesCount: Math.floor(Math.random() * 1000),
          approvedAt: new Date(),
          approvedBy: admin.id,
        },
      });

      // Link tags
      for (const tagName of photoData.tags) {
        if (tags[tagName]) {
          await prisma.photoTag.create({
            data: { 
              photoId: photo.id, 
              tagId: tags[tagName].id,
              isAiGen: false,
            },
          });
          
          // Update tag counts
          await prisma.tag.update({
            where: { id: tags[tagName].id },
            data: { photosCount: { increment: 1 } },
          });
        }
      }

      totalPhotos++;
    }
  }

  console.log(`✅ Created ${totalPhotos} photos across all categories`);

  // Create system collections
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
        isPrivate: true,
      },
    });
  }

  console.log("✅ Created system collections");
  console.log(`\n🎉 Seed completed! Created ${totalPhotos} photos with diverse content!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - ${photographers.length} photographers`);
  console.log(`   - ${categoryData.length} categories`);
  console.log(`   - ${Object.keys(tags).length} tags`);
  console.log(`   - ${totalPhotos} photos`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
