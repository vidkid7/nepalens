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

const STOCK_PHOTOS = [
  {
    filename: "_RBcxo9AU-U_green_grass_field_during_sunset_7932x5291.jpg",
    title: "Green Grass Field During Sunset",
    description: "A breathtaking view of a vast green grass field bathed in warm golden sunset light.",
    width: 7932, height: 5291,
    tags: ["nature", "landscape", "sunset", "grass", "field", "golden-hour"],
    color: "#8B7D3C", colorBucket: "warm",
    isFeatured: true, isCurated: true, isHero: true,
  },
  {
    filename: "-G3rw6Y02D0_Hopeful_Horizons_4159x2773.jpg",
    title: "Hopeful Horizons",
    description: "Inspiring vista of wide open horizons under a dramatic sky.",
    width: 4159, height: 2773,
    tags: ["nature", "landscape", "sky", "horizon", "hope"],
    color: "#5A7D8F", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: true,
  },
  {
    filename: "-qrcOR33ErA_Not_really_lost_though_____I_took_this_picture_dur_5142x3111.jpg",
    title: "Mountain Adventure Trail",
    description: "An adventurous mountain trail through rugged terrain — the joy of exploring wild places.",
    width: 5142, height: 3111,
    tags: ["nature", "mountains", "travel", "adventure", "hiking", "trail"],
    color: "#4D6B5F", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "-SO3JtE3gZo_green_hills_with_forest_under_cloudy_sky_during_da_5184x3240.jpg",
    title: "Green Hills With Forest Under Cloudy Sky",
    description: "Rolling green hills blanketed with dense forest under a dramatic cloudy sky.",
    width: 5184, height: 3240,
    tags: ["nature", "landscape", "hills", "forest", "clouds", "green"],
    color: "#4A6E3D", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "01_igFr7hd4_Body_Grassland_in_Yili_Xinjiang_China_2600x1548.jpg",
    title: "Grassland in Yili Xinjiang China",
    description: "Vast rolling grasslands of Yili, Xinjiang, China — an endless sea of green stretching to the horizon.",
    width: 2600, height: 1548,
    tags: ["nature", "landscape", "grassland", "china", "travel", "green"],
    color: "#5C8A4D", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "1OtUkD_8svc_Star_Night_Sky_Ravine_3880x2586.jpg",
    title: "Star Night Sky Over Ravine",
    description: "A stunning night sky filled with stars arching over a deep ravine landscape.",
    width: 3880, height: 2586,
    tags: ["nature", "sky", "stars", "night", "landscape", "astrophotography"],
    color: "#1A2A3D", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: true,
  },
  {
    filename: "1Z2niiBPg5A_Taking_The_Scenic_Route_7372x4392.jpg",
    title: "Taking The Scenic Route",
    description: "A winding road through magnificent scenic landscape — the beauty of the journey.",
    width: 7372, height: 4392,
    tags: ["nature", "landscape", "road", "travel", "scenic", "adventure"],
    color: "#6B8A5C", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: true,
  },
  {
    filename: "6EfKUoRTe8I_selective_focus_photography_of_yellow_flowers_7360x4912.jpg",
    title: "Yellow Wildflowers in Focus",
    description: "Beautiful selective focus photography capturing vibrant yellow wildflowers in their natural habitat.",
    width: 7360, height: 4912,
    tags: ["flowers", "nature", "yellow", "macro", "wildflowers", "garden"],
    color: "#D4A520", colorBucket: "warm",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "78A265wPiO4_Alone_in_the_unspoilt_wilderness_3506x2329.jpg",
    title: "Alone in the Unspoilt Wilderness",
    description: "A solitary figure embracing the raw beauty of untouched wilderness.",
    width: 3506, height: 2329,
    tags: ["nature", "landscape", "wilderness", "solitude", "mountains"],
    color: "#7D8A6B", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "Bkci_8qcdvQ_travelyukon_5760x3840.jpg",
    title: "Travel Yukon",
    description: "The pristine wild beauty of the Yukon territory — mountains, forests, and crystal-clear waters.",
    width: 5760, height: 3840,
    tags: ["nature", "travel", "landscape", "yukon", "canada", "mountains", "water"],
    color: "#3D6B8A", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: true,
  },
  {
    filename: "c1Jp-fo53U8_Sunset_over_a_lavender_field_6000x4000.jpg",
    title: "Sunset Over a Lavender Field",
    description: "Golden sunset light painting a fragrant lavender field in warm purple and orange hues.",
    width: 6000, height: 4000,
    tags: ["nature", "flowers", "lavender", "sunset", "landscape", "golden-hour"],
    color: "#8A5CAD", colorBucket: "warm",
    isFeatured: true, isCurated: true, isHero: false,
  },
  {
    filename: "CSpjU6hYo_0_brown_rock_formation_under_blue_sky_4896x3264.jpg",
    title: "Brown Rock Formation Under Blue Sky",
    description: "Dramatic brown rock formations standing tall against a vivid blue sky.",
    width: 4896, height: 3264,
    tags: ["nature", "landscape", "rocks", "desert", "sky", "geology"],
    color: "#8B6B3D", colorBucket: "warm",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "DlkF4-dbCOU_sunrise_5472x3648.jpg",
    title: "Golden Sunrise",
    description: "A magnificent golden sunrise painting the sky in warm oranges and reds.",
    width: 5472, height: 3648,
    tags: ["nature", "sky", "sunrise", "golden-hour", "landscape"],
    color: "#E87D2F", colorBucket: "warm",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "Dm-qxdynoEc_Not_so_tasty_5558x3705.jpg",
    title: "Forest Mushroom Close-Up",
    description: "An intricate close-up of a forest mushroom — nature's fascinating details.",
    width: 5558, height: 3705,
    tags: ["nature", "macro", "mushroom", "forest", "fungi", "close-up"],
    color: "#6B5A3D", colorBucket: "warm",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "dXYE1d08BiY_Pooling_Water_4608x3456.jpg",
    title: "Pooling Water",
    description: "Serene pooling water reflecting the surrounding landscape in crystal clarity.",
    width: 4608, height: 3456,
    tags: ["nature", "water", "reflection", "landscape", "serene"],
    color: "#4A8AB5", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "eOpewngf68w_Whangarei_Falls_footbridge_5472x3648.jpg",
    title: "Whangarei Falls Footbridge",
    description: "A scenic footbridge crossing near the majestic Whangarei Falls in New Zealand.",
    width: 5472, height: 3648,
    tags: ["nature", "waterfall", "travel", "new-zealand", "bridge", "forest"],
    color: "#3D6B4F", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "FIKD9t5_5zQ_white_clouds_during_daytime_5464x3643.jpg",
    title: "White Clouds During Daytime",
    description: "Fluffy white clouds drifting across a bright blue daytime sky.",
    width: 5464, height: 3643,
    tags: ["nature", "sky", "clouds", "blue", "weather", "minimal"],
    color: "#87CEEB", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "IicyiaPYGGI_orange_flowers_4928x3264.jpg",
    title: "Vibrant Orange Flowers",
    description: "Striking orange flowers captured in vivid detail with rich warm tones.",
    width: 4928, height: 3264,
    tags: ["flowers", "nature", "orange", "garden", "vibrant", "close-up"],
    color: "#E8692F", colorBucket: "warm",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "jFCViYFYcus_Beautiful_woodland_path_2560x1705.jpg",
    title: "Beautiful Woodland Path",
    description: "A magical path winding through an enchanting woodland bathed in dappled light.",
    width: 2560, height: 1705,
    tags: ["nature", "forest", "path", "woodland", "trees", "walking"],
    color: "#5A7D3D", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "K2s_YE031CA_I_had_been_travelling_around_Central_America_5112x3408.jpg",
    title: "Central America Landscape",
    description: "Stunning landscape from a journey through Central America — lush greenery and vibrant colors.",
    width: 5112, height: 3408,
    tags: ["nature", "travel", "landscape", "central-america", "tropical", "adventure"],
    color: "#4D8A5C", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "koy6FlCCy5s_California_blooming_like_crazy_after_months_of_non_7952x5304.jpg",
    title: "California Super Bloom",
    description: "California's incredible wildflower super bloom carpeting hillsides in vibrant color.",
    width: 7952, height: 5304,
    tags: ["flowers", "nature", "california", "wildflowers", "landscape", "spring"],
    color: "#D4A020", colorBucket: "warm",
    isFeatured: true, isCurated: true, isHero: false,
  },
  {
    filename: "Kp9z6zcUfGw_macro_photography_of_drop_of_water_on_top_of_green_4592x3448.jpg",
    title: "Water Drop on Green Leaf",
    description: "Stunning macro photography of a crystal water drop perched atop a vibrant green leaf.",
    width: 4592, height: 3448,
    tags: ["nature", "macro", "water", "leaf", "green", "close-up"],
    color: "#2D6B3D", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "kqJfP-lrl-8_I_used_5_tiers_of_glass_to_create_this_layered_eff_4287x3283.jpg",
    title: "Layered Glass Mountain Effect",
    description: "A creative layered glass effect creating a mesmerizing mountain landscape composition.",
    width: 4287, height: 3283,
    tags: ["nature", "mountains", "creative", "abstract", "landscape", "glass"],
    color: "#5A7DAD", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "Kt5hRENuotI_concrete_road_between_mountains_3914x2935.jpg",
    title: "Concrete Road Between Mountains",
    description: "An endless concrete road cutting through towering mountain ranges toward the horizon.",
    width: 3914, height: 2935,
    tags: ["nature", "road", "mountains", "travel", "landscape", "highway"],
    color: "#6B7D8A", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "mBQIfKlvowM_waves_of_body_of_water_splashing_on_sand_4752x3168.jpg",
    title: "Ocean Waves on Sandy Beach",
    description: "Powerful ocean waves crashing and splashing onto a golden sandy beach.",
    width: 4752, height: 3168,
    tags: ["nature", "ocean", "beach", "waves", "water", "sand"],
    color: "#4A8AAD", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "ndN00KmbJ1c_El_Capitan_on_a_sunny_afternoon_5616x3744.jpg",
    title: "El Capitan on a Sunny Afternoon",
    description: "The iconic El Capitan rock face in Yosemite National Park gleaming in afternoon sunlight.",
    width: 5616, height: 3744,
    tags: ["nature", "mountains", "yosemite", "landscape", "el-capitan", "national-park"],
    color: "#7D8A6B", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: false,
  },
  {
    filename: "NRQV-hBF10M_I_was_freezing_cold_staying_in_the_tent_cabins_in__7360x4912.jpg",
    title: "Yosemite Tent Cabin Vista",
    description: "A breathtaking winter vista from the tent cabins in Yosemite — mist and majesty.",
    width: 7360, height: 4912,
    tags: ["nature", "landscape", "yosemite", "mountains", "mist", "winter"],
    color: "#8A9DAD", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "pQMM63GE7fo_Swimming_under_a_waterfall_5472x3648.jpg",
    title: "Swimming Under a Waterfall",
    description: "The exhilarating experience of swimming beneath a cascading tropical waterfall.",
    width: 5472, height: 3648,
    tags: ["nature", "waterfall", "water", "adventure", "tropical", "swimming"],
    color: "#3D7D6B", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "q1-dAZuhs7I_macro_photography_of_green_leaf_3759x2819.jpg",
    title: "Green Leaf Macro",
    description: "Intricate macro photography revealing the beautiful veined structure of a fresh green leaf.",
    width: 3759, height: 2819,
    tags: ["nature", "macro", "leaf", "green", "close-up", "botanical"],
    color: "#3D8A4D", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "Rfflri94rs8_Conifer_sapling_5000x3333.jpg",
    title: "Conifer Sapling",
    description: "A delicate young conifer sapling reaching skyward — new life in the forest.",
    width: 5000, height: 3333,
    tags: ["nature", "trees", "forest", "sapling", "green", "growth"],
    color: "#4D6B3D", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "RwHv7LgeC7s_Mystery_Forest_Light_4368x2912.jpg",
    title: "Mystery Forest Light",
    description: "Ethereal beams of light piercing through a mysterious misty forest canopy.",
    width: 4368, height: 2912,
    tags: ["nature", "forest", "light", "mist", "trees", "ethereal"],
    color: "#3D5A4D", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: false,
  },
  {
    filename: "T_Qe4QlMIvQ_a_mountain_range_with_a_lake_in_the_foreground_6000x4000.jpg",
    title: "Mountain Range With Lake",
    description: "A majestic mountain range reflected in the still waters of a pristine alpine lake.",
    width: 6000, height: 4000,
    tags: ["nature", "mountains", "lake", "landscape", "reflection", "alpine"],
    color: "#4A6B8A", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: false,
  },
  {
    filename: "TRhGEGdw-YY_aerial_photography_of_flowers_at_daytime_5745x3830.jpg",
    title: "Aerial Photography of Flower Fields",
    description: "Stunning aerial view of vast flower fields creating a patchwork of vivid colors.",
    width: 5745, height: 3830,
    tags: ["flowers", "nature", "aerial", "landscape", "colorful", "fields"],
    color: "#AD5C8A", colorBucket: "warm",
    isFeatured: false, isCurated: true, isHero: false,
  },
  {
    filename: "ugnrXk1129g_This_photo_was_taken_in_the_high_mountains_of_Adja_4288x2848.jpg",
    title: "High Mountains of Adjara",
    description: "The dramatic high mountains of Adjara region — raw and untamed alpine beauty.",
    width: 4288, height: 2848,
    tags: ["nature", "mountains", "landscape", "adjara", "travel", "alpine"],
    color: "#5A7D6B", colorBucket: "cool",
    isFeatured: false, isCurated: false, isHero: false,
  },
  {
    filename: "UWQP2mh5YJI_Emerald_Bay_State_Park_in_the_Fall_5857x3905.jpg",
    title: "Emerald Bay State Park in the Fall",
    description: "The stunning Emerald Bay of Lake Tahoe surrounded by vibrant fall foliage.",
    width: 5857, height: 3905,
    tags: ["nature", "landscape", "lake", "fall", "autumn", "tahoe", "national-park"],
    color: "#3D8A6B", colorBucket: "cool",
    isFeatured: true, isCurated: true, isHero: false,
  },
  {
    filename: "vUNQaTtZeOo_Perched_blue_and_orange_bird_4844x3234.jpg",
    title: "Perched Blue and Orange Bird",
    description: "A stunning blue and orange kingfisher perched gracefully on a branch.",
    width: 4844, height: 3234,
    tags: ["wildlife", "bird", "nature", "kingfisher", "animals", "colorful"],
    color: "#2D6BAD", colorBucket: "cool",
    isFeatured: false, isCurated: true, isHero: false,
  },
];

const PHOTOGRAPHERS = [
  {
    username: "naturelens",
    displayName: "Nature Lens",
    email: "naturelens@nepalens.app",
    bio: "Landscape and nature photographer capturing the beauty of our planet. Based in the Pacific Northwest.",
  },
  {
    username: "wanderlight",
    displayName: "Wander Light",
    email: "wanderlight@nepalens.app",
    bio: "Travel photographer and adventurer. Always chasing the light across wild landscapes.",
  },
  {
    username: "florashot",
    displayName: "Flora Shot",
    email: "florashot@nepalens.app",
    bio: "Macro and botanical photographer. Finding beauty in petals, leaves, and the smallest details.",
  },
  {
    username: "peakframes",
    displayName: "Peak Frames",
    email: "peakframes@nepalens.app",
    bio: "Mountain and wilderness photographer. Capturing peaks, valleys, and everything in between.",
  },
];

const COLLECTIONS = [
  {
    title: "Majestic Landscapes",
    description: "The most stunning landscape photography from around the world",
    photoIndices: [0, 1, 3, 4, 6, 9, 25, 31, 34],
  },
  {
    title: "Flowers & Botanicals",
    description: "Beautiful floral and botanical close-ups",
    photoIndices: [7, 10, 17, 20, 21, 28, 32],
  },
  {
    title: "Mountains & Peaks",
    description: "Dramatic mountain photography from every continent",
    photoIndices: [2, 8, 23, 25, 26, 31, 33],
  },
  {
    title: "Water & Waterfalls",
    description: "Oceans, lakes, rivers, waterfalls, and the beauty of water",
    photoIndices: [14, 15, 24, 27, 31],
  },
  {
    title: "Forest & Woodland",
    description: "Enchanting forest scenes and woodland paths",
    photoIndices: [3, 18, 29, 30],
  },
  {
    title: "Golden Hour Collection",
    description: "Photos captured in the magical golden hour light",
    photoIndices: [0, 10, 12, 1],
  },
];

const CATEGORIES = [
  { name: "Nature", slug: "nature", cover: "_RBcxo9AU-U_green_grass_field_during_sunset_7932x5291.jpg" },
  { name: "Landscape", slug: "landscape", cover: "-G3rw6Y02D0_Hopeful_Horizons_4159x2773.jpg" },
  { name: "Flowers", slug: "flowers", cover: "6EfKUoRTe8I_selective_focus_photography_of_yellow_flowers_7360x4912.jpg" },
  { name: "Mountains", slug: "mountains", cover: "ndN00KmbJ1c_El_Capitan_on_a_sunny_afternoon_5616x3744.jpg" },
  { name: "Forest", slug: "forest", cover: "RwHv7LgeC7s_Mystery_Forest_Light_4368x2912.jpg" },
  { name: "Water", slug: "water", cover: "dXYE1d08BiY_Pooling_Water_4608x3456.jpg" },
  { name: "Travel", slug: "travel", cover: "Bkci_8qcdvQ_travelyukon_5760x3840.jpg" },
  { name: "Wildlife", slug: "wildlife", cover: "vUNQaTtZeOo_Perched_blue_and_orange_bird_4844x3234.jpg" },
];

async function main() {
  console.log("🌱 Seeding NepaLens with real stock images...\n");

  // Clean existing seed data (safe reset)
  // Fix polymorphic FK constraints (mediaId references both Photo and Video)
  // These must be dropped for polymorphic pattern to work correctly
  console.log("🔧 Fixing polymorphic FK constraints...");
  const fksToDrop = [
    'ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_photo_fkey',
    'ALTER TABLE collection_items DROP CONSTRAINT IF EXISTS collection_items_video_fkey',
    'ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_photo_fkey',
    'ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_video_fkey',
    'ALTER TABLE downloads DROP CONSTRAINT IF EXISTS downloads_photo_fkey',
    'ALTER TABLE downloads DROP CONSTRAINT IF EXISTS downloads_video_fkey',
  ];
  for (const sql of fksToDrop) {
    await prisma.$executeRawUnsafe(sql).catch(() => {});
  }
  console.log("✅ FK constraints fixed");

  console.log("🧹 Cleaning existing data...");
  await prisma.heroImage.deleteMany({});
  await prisma.collectionItem.deleteMany({});
  await prisma.photoTag.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.download.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.photo.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Database cleaned\n");

  // 1. Create admin user
  const adminPassword = await hashPassword("Admin123!");
  const admin = await prisma.user.create({
    data: {
      email: "admin@nepalens.app",
      username: "admin",
      displayName: "NepaLens Admin",
      passwordHash: adminPassword,
      isVerified: true,
      isContributor: true,
      isAdmin: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 2. Create photographer users
  const photographerPassword = await hashPassword("Photo123!");
  const photographers = [];
  for (const p of PHOTOGRAPHERS) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        username: p.username,
        displayName: p.displayName,
        bio: p.bio,
        passwordHash: photographerPassword,
        isVerified: true,
        isContributor: true,
      },
    });
    photographers.push(user);
    console.log(`✅ Photographer: ${user.displayName} (@${user.username})`);
  }

  // 3. Create categories with cover images
  for (const cat of CATEGORIES) {
    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        coverUrl: `/images/stock/${cat.cover}`,
      },
    });
  }
  console.log(`✅ ${CATEGORIES.length} categories created (with cover images)`);

  // 4. Create all tags first (dedup across photos)
  const allTagNames = new Set<string>();
  for (const sp of STOCK_PHOTOS) {
    for (const t of sp.tags) allTagNames.add(t);
  }
  const tagMap = new Map<string, string>();
  for (const tagName of allTagNames) {
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const tag = await prisma.tag.create({
      data: { name: tagName, slug: tagSlug },
    });
    tagMap.set(tagName, tag.id);
  }
  console.log(`✅ ${tagMap.size} tags created`);

  // 5. Create photos with real image files
  const createdPhotos: any[] = [];
  for (let i = 0; i < STOCK_PHOTOS.length; i++) {
    const sp = STOCK_PHOTOS[i];
    const photographer = photographers[i % photographers.length];
    const megapixels = (sp.width * sp.height) / 1_000_000;
    const orientation = sp.width > sp.height ? "landscape" : sp.width < sp.height ? "portrait" : "square";
    const sizeTier = megapixels > 20 ? "large" : megapixels > 8 ? "medium" : "small";

    const slug = sp.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const originalUrl = `/images/stock/${sp.filename}`;

    const viewsCount = Math.floor(Math.random() * 50000) + 500;
    const downloadsCount = Math.floor(Math.random() * 5000) + 50;
    const likesCount = Math.floor(Math.random() * 2000) + 10;

    const photo = await prisma.photo.create({
      data: {
        userId: photographer.id,
        slug,
        altText: sp.title,
        description: sp.description,
        width: sp.width,
        height: sp.height,
        megapixels,
        originalUrl,
        cdnKey: null,
        dominantColor: sp.color,
        colorBucket: sp.colorBucket,
        avgColor: sp.color,
        orientation,
        sizeTier,
        status: "approved",
        isFeatured: sp.isFeatured,
        isCurated: sp.isCurated,
        featuredAt: sp.isFeatured ? new Date() : null,
        curatedAt: sp.isCurated ? new Date() : null,
        approvedAt: new Date(),
        approvedBy: admin.id,
        viewsCount: BigInt(viewsCount),
        downloadsCount: BigInt(downloadsCount),
        likesCount,
      },
    });

    createdPhotos.push(photo);

    // Link tags
    for (const tagName of sp.tags) {
      const tagId = tagMap.get(tagName)!;
      await prisma.photoTag.create({
        data: { photoId: photo.id, tagId },
      });
    }
  }
  console.log(`✅ ${createdPhotos.length} photos created with real images`);

  // 5. Create HeroImage records for homepage hero rotation
  const heroPhotos = STOCK_PHOTOS
    .map((sp, idx) => ({ ...sp, photo: createdPhotos[idx] }))
    .filter((sp) => sp.isHero);

  for (let i = 0; i < heroPhotos.length; i++) {
    const displayDate = new Date();
    displayDate.setDate(displayDate.getDate() - i);
    displayDate.setHours(0, 0, 0, 0);

    await prisma.heroImage.upsert({
      where: { displayDate },
      update: { photoId: heroPhotos[i].photo.id, isActive: true },
      create: {
        photoId: heroPhotos[i].photo.id,
        userId: admin.id,
        displayDate,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${heroPhotos.length} hero images configured for homepage rotation`);

  // 6. Create collections
  for (const col of COLLECTIONS) {
    const colSlug = col.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    const owner = photographers[Math.floor(Math.random() * photographers.length)];

    let collection: any;
    const existing = await prisma.collection.findFirst({
      where: { title: col.title, userId: owner.id },
    });

    if (existing) {
      collection = existing;
    } else {
      collection = await prisma.collection.create({
        data: {
          userId: owner.id,
          title: col.title,
          description: col.description,
          isPrivate: false,
        },
      });
    }

    // Add photos to collection
    for (let i = 0; i < col.photoIndices.length; i++) {
      const photoIdx = col.photoIndices[i];
      if (photoIdx < createdPhotos.length) {
        const photo = createdPhotos[photoIdx];
        await prisma.collectionItem.create({
          data: {
            collectionId: collection.id,
            mediaType: "photo",
            mediaId: photo.id,
            position: i,
          },
        });
      }
    }

    console.log(`✅ Collection: "${col.title}" (${col.photoIndices.length} photos)`);
  }

  // 7. Create some likes from photographers on each other's photos
  for (const photographer of photographers) {
    const otherPhotos = createdPhotos.filter((p) => p.userId !== photographer.id);
    const shuffled = otherPhotos.sort(() => Math.random() - 0.5);
    const toLike = shuffled.slice(0, Math.min(8, shuffled.length));

    for (const photo of toLike) {
      await prisma.like.create({
        data: {
          userId: photographer.id,
          mediaType: "photo",
          mediaId: photo.id,
        },
      });
    }
  }
  console.log(`✅ Cross-photographer likes created`);

  // 8. Follow relationships between photographers
  for (let i = 0; i < photographers.length; i++) {
    for (let j = 0; j < photographers.length; j++) {
      if (i !== j) {
        await prisma.follow.create({
          data: {
            followerId: photographers[i].id,
            followingId: photographers[j].id,
          },
        });
      }
    }
  }
  console.log(`✅ Follow relationships created`);

  // 9. Update tag photosCount
  const tags = await prisma.tag.findMany();
  for (const tag of tags) {
    const count = await prisma.photoTag.count({ where: { tagId: tag.id } });
    await prisma.tag.update({
      where: { id: tag.id },
      data: { photosCount: count },
    });
  }
  console.log(`✅ Tag photo counts updated`);

  // 10. Update user followersCount
  for (const photographer of photographers) {
    const followersCount = await prisma.follow.count({ where: { followingId: photographer.id } });
    await prisma.user.update({
      where: { id: photographer.id },
      data: { followersCount },
    });
  }
  console.log(`✅ User follower counts updated`);

  console.log("\n🎉 Seed complete! Your NepaLens platform now has:");
  console.log(`   • ${createdPhotos.length} real stock photos`);
  console.log(`   • ${photographers.length} photographer profiles`);
  console.log(`   • ${COLLECTIONS.length} curated collections`);
  console.log(`   • ${heroPhotos.length} rotating hero images`);
  console.log(`   • ${CATEGORIES.length} categories`);
  console.log(`   • Cross-photographer likes and follows`);
  console.log("\n📸 Visit http://localhost:3000 to see your platform!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
