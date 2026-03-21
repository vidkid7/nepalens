import { Queue, Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

const getConnectionOpts = (): ConnectionOptions => ({
  connection: getRedisConnection(),
});

// Queue names
export const QUEUE_NAMES = {
  PROCESS_IMAGE: "process-image",
  PROCESS_VIDEO: "process-video",
  TAG_IMAGE: "tag-image",
  SEARCH_INDEX: "search-index",
  EMAIL: "email",
} as const;

// Queue instances
export const processImageQueue = new Queue(QUEUE_NAMES.PROCESS_IMAGE, getConnectionOpts());
export const processVideoQueue = new Queue(QUEUE_NAMES.PROCESS_VIDEO, getConnectionOpts());
export const tagImageQueue = new Queue(QUEUE_NAMES.TAG_IMAGE, getConnectionOpts());
export const searchIndexQueue = new Queue(QUEUE_NAMES.SEARCH_INDEX, getConnectionOpts());
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, getConnectionOpts());

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

// Helper to create workers (used in Phase 2)
export function createWorker<T>(
  queueName: string,
  processor: (job: { data: T }) => Promise<void>
): Worker {
  return new Worker(queueName, processor as any, {
    ...getConnectionOpts(),
    concurrency: 3,
  });
}

export { Queue, Worker };
