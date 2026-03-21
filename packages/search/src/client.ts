import { Client } from "@elastic/elasticsearch";

let client: Client | null = null;

export function getElasticsearchClient(): Client {
  if (!client) {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    });
  }
  return client;
}

export const PHOTO_INDEX = "photos";
export const VIDEO_INDEX = "videos";

export const PHOTO_INDEX_MAPPING = {
  mappings: {
    properties: {
      id: { type: "keyword" as const },
      userId: { type: "keyword" as const },
      slug: { type: "keyword" as const },
      altText: { type: "text" as const, analyzer: "standard", boost: 2 },
      description: { type: "text" as const, analyzer: "standard" },
      tags: {
        type: "text" as const,
        analyzer: "standard",
        boost: 3,
        fields: { keyword: { type: "keyword" as const } },
      },
      photographer: { type: "text" as const, analyzer: "standard" },
      photographerUsername: { type: "keyword" as const },
      colorBucket: { type: "keyword" as const },
      dominantColor: { type: "keyword" as const },
      orientation: { type: "keyword" as const },
      sizeTier: { type: "keyword" as const },
      megapixels: { type: "float" as const },
      width: { type: "integer" as const },
      height: { type: "integer" as const },
      isFeatured: { type: "boolean" as const },
      isCurated: { type: "boolean" as const },
      viewsCount: { type: "long" as const },
      downloadsCount: { type: "long" as const },
      likesCount: { type: "integer" as const },
      engagementScore: { type: "float" as const },
      status: { type: "keyword" as const },
      createdAt: { type: "date" as const },
    },
  },
  settings: {
    analysis: {
      analyzer: {
        tag_analyzer: {
          type: "custom" as const,
          tokenizer: "whitespace",
          filter: ["lowercase", "synonym_filter"],
        },
      },
      filter: {
        synonym_filter: {
          type: "synonym" as const,
          synonyms: [
            "car,automobile,vehicle",
            "person,people,human",
            "building,architecture,structure",
            "photo,photograph,image,picture",
            "ocean,sea,water",
            "forest,woods,woodland",
          ],
        },
      },
    },
  },
};

export const VIDEO_INDEX_MAPPING = {
  mappings: {
    properties: {
      id: { type: "keyword" as const },
      userId: { type: "keyword" as const },
      slug: { type: "keyword" as const },
      altText: { type: "text" as const, analyzer: "standard", boost: 2 },
      description: { type: "text" as const, analyzer: "standard" },
      tags: {
        type: "text" as const,
        analyzer: "standard",
        boost: 3,
        fields: { keyword: { type: "keyword" as const } },
      },
      videographer: { type: "text" as const },
      orientation: { type: "keyword" as const },
      durationSeconds: { type: "integer" as const },
      width: { type: "integer" as const },
      height: { type: "integer" as const },
      isFeatured: { type: "boolean" as const },
      viewsCount: { type: "long" as const },
      downloadsCount: { type: "long" as const },
      likesCount: { type: "integer" as const },
      status: { type: "keyword" as const },
      createdAt: { type: "date" as const },
    },
  },
};
