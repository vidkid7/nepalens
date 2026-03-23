import Redis from "ioredis";

// Redis client singleton with graceful fallback
let redis: Redis | null = null;
let connectionFailed = false;
let retryTimeout: NodeJS.Timeout | null = null;

const RETRY_INTERVAL = 30_000; // Retry connection every 30s if failed

function getRedis(): Redis | null {
  if (connectionFailed) return null;
  if (redis) return redis;

  try {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    // Parse URL with WHATWG URL API to avoid url.parse() deprecation warning
    const parsed = new URL(url);
    redis = new Redis({
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) || 0 : 0,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      connectTimeout: 3000,
      commandTimeout: 2000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on("error", () => {
      connectionFailed = true;
      redis?.disconnect();
      redis = null;
      // Schedule retry
      if (!retryTimeout) {
        retryTimeout = setTimeout(() => {
          connectionFailed = false;
          retryTimeout = null;
        }, RETRY_INTERVAL);
      }
    });

    redis.on("connect", () => {
      connectionFailed = false;
    });

    redis.connect().catch(() => {
      connectionFailed = true;
      redis = null;
    });

    return redis;
  } catch {
    connectionFailed = true;
    return null;
  }
}

// In-memory fallback cache (LRU-like with max entries)
const memCache = new Map<string, { data: string; expiresAt: number }>();
const MAX_MEM_ENTRIES = 500;

function memGet(key: string): string | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data;
}

function memSet(key: string, value: string, ttlSeconds: number): void {
  // Evict oldest entries if over limit
  if (memCache.size >= MAX_MEM_ENTRIES) {
    const firstKey = memCache.keys().next().value;
    if (firstKey) memCache.delete(firstKey);
  }
  memCache.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memDel(pattern: string): void {
  if (pattern.includes("*")) {
    const prefix = pattern.replace("*", "");
    for (const key of memCache.keys()) {
      if (key.startsWith(prefix)) memCache.delete(key);
    }
  } else {
    memCache.delete(pattern);
  }
}

// ─── Public API ───

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (client) {
    try {
      const data = await client.get(key);
      if (data) return JSON.parse(data) as T;
      return null;
    } catch {
      // Fall through to memory cache
    }
  }

  const memData = memGet(key);
  if (memData) return JSON.parse(memData) as T;
  return null;
}

export async function cacheSet(key: string, data: unknown, ttlSeconds: number = 300): Promise<void> {
  const serialized = JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value
  );

  const client = getRedis();
  if (client) {
    try {
      await client.setex(key, ttlSeconds, serialized);
      return;
    } catch {
      // Fall through to memory cache
    }
  }

  memSet(key, serialized, ttlSeconds);
}

export async function cacheDel(pattern: string): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      if (pattern.includes("*")) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) await client.del(...keys);
      } else {
        await client.del(pattern);
      }
    } catch {
      // Fall through
    }
  }

  memDel(pattern);
}

/**
 * Cache-aside pattern: get from cache or compute and store.
 * This is the primary helper for all cached queries.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;

  const result = await compute();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

// ─── Cache Key Builders ───

export const CacheKeys = {
  photoFeed: (sort: string, page: number, perPage: number) =>
    `photos:feed:${sort}:${page}:${perPage}`,
  photoDetail: (slugOrId: string) =>
    `photos:detail:${slugOrId}`,
  photoSearch: (query: string, filters: string) =>
    `photos:search:${query}:${filters}`,
  heroImage: () => "home:hero",
  curatedPhotos: () => "home:curated",
  trendingPhotos: () => "home:trending",
  featuredCollections: () => "home:collections",
  categories: () => "discover:categories",
  featuredPhotographers: () => "discover:photographers",
  trendingTags: () => "discover:tags",
  autocomplete: (prefix: string) => `autocomplete:${prefix}`,
  leaderboard: () => "leaderboard:data",
  userProfile: (username: string) => `user:profile:${username}`,
  collectionDetail: (id: string) => `collection:${id}`,
};

// ─── Cache TTLs (seconds) ───

export const CacheTTL = {
  FEED: 60,            // 1 min — photo feeds
  DETAIL: 300,         // 5 min — individual photo/collection
  HOME: 120,           // 2 min — homepage sections
  DISCOVER: 300,       // 5 min — discover page
  AUTOCOMPLETE: 600,   // 10 min — search suggestions
  LEADERBOARD: 3600,   // 1 hour
  PROFILE: 120,        // 2 min
};

export function isRedisConnected(): boolean {
  return !connectionFailed && redis?.status === "ready";
}

// ─── Batch Invalidation Helpers ───

/** Invalidate all feed-related caches (after upload, delete, approval, etc.) */
export async function invalidateFeeds(): Promise<void> {
  await Promise.all([
    cacheDel("photos:feed:*"),
    cacheDel("photos:search:*"),
    cacheDel("home:*"),
    cacheDel("discover:*"),
  ]).catch(() => {});
}

/** Invalidate a specific photo's detail cache */
export async function invalidatePhotoDetail(slugOrId: string): Promise<void> {
  await cacheDel(`photos:detail:${slugOrId}`).catch(() => {});
}

/** Invalidate a specific collection cache */
export async function invalidateCollection(id: string): Promise<void> {
  await cacheDel(`collection:${id}`).catch(() => {});
}

/** Invalidate a user's profile cache */
export async function invalidateUserProfile(username: string): Promise<void> {
  await cacheDel(`user:profile:${username}`).catch(() => {});
}

/** Invalidate leaderboard cache */
export async function invalidateLeaderboard(): Promise<void> {
  await cacheDel("leaderboard:*").catch(() => {});
}

/** Invalidate everything (nuclear option — used by admin clear-caches) */
export async function invalidateAll(): Promise<void> {
  await Promise.all([
    cacheDel("photos:*"),
    cacheDel("home:*"),
    cacheDel("discover:*"),
    cacheDel("autocomplete:*"),
    cacheDel("leaderboard:*"),
    cacheDel("user:*"),
    cacheDel("collection:*"),
  ]).catch(() => {});
}

// ─── Graceful Shutdown ───

export function shutdownRedis(): Promise<void> {
  if (redis) {
    return redis.quit().catch(() => {}).then(() => { redis = null; });
  }
  return Promise.resolve();
}

if (typeof process !== "undefined") {
  const cleanup = () => { shutdownRedis(); };
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}
