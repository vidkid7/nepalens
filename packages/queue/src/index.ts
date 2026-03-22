import { Queue, Worker } from "bullmq";

// Use URL string for connection to avoid ioredis version mismatch
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function getQueueOpts() {
  return { connection: { url: REDIS_URL } as any };
}

// Queue names
export const QUEUE_NAMES = {
  PROCESS_IMAGE: "process-image",
  PROCESS_VIDEO: "process-video",
  TAG_IMAGE: "tag-image",
  SEARCH_INDEX: "search-index",
  EMAIL: "email",
} as const;

// Queue instances (lazy-initialized)
let _processImageQueue: Queue | null = null;
let _processVideoQueue: Queue | null = null;
let _tagImageQueue: Queue | null = null;
let _searchIndexQueue: Queue | null = null;
let _emailQueue: Queue | null = null;

export function getProcessImageQueue() { return _processImageQueue ??= new Queue(QUEUE_NAMES.PROCESS_IMAGE, getQueueOpts()); }
export function getProcessVideoQueue() { return _processVideoQueue ??= new Queue(QUEUE_NAMES.PROCESS_VIDEO, getQueueOpts()); }
export function getTagImageQueue() { return _tagImageQueue ??= new Queue(QUEUE_NAMES.TAG_IMAGE, getQueueOpts()); }
export function getSearchIndexQueue() { return _searchIndexQueue ??= new Queue(QUEUE_NAMES.SEARCH_INDEX, getQueueOpts()); }
export function getEmailQueue() { return _emailQueue ??= new Queue(QUEUE_NAMES.EMAIL, getQueueOpts()); }

// Backward-compatible exports (use getXxxQueue() for full type safety)
export const processImageQueue = { add: (name: string, data: any, opts?: any) => getProcessImageQueue().add(name, data, opts) } as any;
export const processVideoQueue = { add: (name: string, data: any, opts?: any) => getProcessVideoQueue().add(name, data, opts) } as any;
export const tagImageQueue = { add: (name: string, data: any, opts?: any) => getTagImageQueue().add(name, data, opts) } as any;
export const searchIndexQueue = { add: (name: string, data: any, opts?: any) => getSearchIndexQueue().add(name, data, opts) } as any;
export const emailQueue = { add: (name: string, data: any, opts?: any) => getEmailQueue().add(name, data, opts) } as any;

// Job type definitions
export interface ProcessImageJob {
  photoId: string;
}

export interface ProcessVideoJob {
  videoId: string;
}

export interface TagImageJob {
  photoId: string;
}

export interface SearchIndexJob {
  mediaType: "photo" | "video";
  mediaId: string;
  action: "index" | "delete";
}

export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Helper to create workers
export function createWorker<T>(
  queueName: string,
  processor: (job: { data: T }) => Promise<void>
): Worker {
  return new Worker(queueName, processor as any, {
    connection: { url: REDIS_URL } as any,
    concurrency: 3,
  });
}

export { Queue, Worker };
