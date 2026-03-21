import type { SearchFilters } from "@pixelstock/shared";
import {
  getElasticsearchClient,
  PHOTO_INDEX,
  VIDEO_INDEX,
  PHOTO_INDEX_MAPPING,
  VIDEO_INDEX_MAPPING,
} from "./client";

export async function initIndices(): Promise<void> {
  const client = getElasticsearchClient();

  const photoExists = await client.indices.exists({ index: PHOTO_INDEX });
  if (!photoExists) {
    await client.indices.create({
      index: PHOTO_INDEX,
      ...PHOTO_INDEX_MAPPING,
    });
    console.log(`Created index: ${PHOTO_INDEX}`);
  }

  const videoExists = await client.indices.exists({ index: VIDEO_INDEX });
  if (!videoExists) {
    await client.indices.create({
      index: VIDEO_INDEX,
      ...VIDEO_INDEX_MAPPING,
    });
    console.log(`Created index: ${VIDEO_INDEX}`);
  }
}

export function buildSearchQuery(params: SearchFilters) {
  const { query, orientation, size, color, page = 1, perPage = 30 } = params;

  const must: any[] = [];
  const filter: any[] = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["tags^3", "altText^2", "description^1", "photographer"],
        fuzziness: "AUTO",
        prefix_length: 2,
      },
    });
  }

  filter.push({ term: { status: "approved" } });

  if (orientation) filter.push({ term: { orientation } });
  if (color) filter.push({ term: { colorBucket: color } });
  if (size) filter.push({ term: { sizeTier: size } });

  return {
    index: PHOTO_INDEX,
    from: (page - 1) * perPage,
    size: perPage,
    body: {
      query: {
        function_score: {
          query: { bool: { must: must.length > 0 ? must : [{ match_all: {} }], filter } },
          functions: [
            {
              field_value_factor: {
                field: "engagementScore",
                factor: 0.3,
                missing: 0,
              },
            },
            { filter: { term: { isFeatured: true } }, weight: 3 },
            { filter: { term: { isCurated: true } }, weight: 2 },
            {
              gauss: {
                createdAt: { origin: "now", scale: "30d", decay: 0.5 },
              },
            },
          ],
          score_mode: "sum",
          boost_mode: "multiply",
        },
      },
      sort: [{ _score: "desc" }, { createdAt: "desc" }],
    },
  };
}

export function buildVideoSearchQuery(params: SearchFilters) {
  const { query, orientation, page = 1, perPage = 30 } = params;

  const must: any[] = [];
  const filter: any[] = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["tags^3", "altText^2", "description^1", "videographer"],
        fuzziness: "AUTO",
        prefix_length: 2,
      },
    });
  }

  filter.push({ term: { status: "approved" } });
  if (orientation) filter.push({ term: { orientation } });

  return {
    index: VIDEO_INDEX,
    from: (page - 1) * perPage,
    size: perPage,
    body: {
      query: {
        bool: { must: must.length > 0 ? must : [{ match_all: {} }], filter },
      },
      sort: [{ _score: "desc" }, { createdAt: "desc" }],
    },
  };
}

export async function searchPhotos(params: SearchFilters) {
  const client = getElasticsearchClient();
  const query = buildSearchQuery(params);
  return client.search(query);
}

export async function searchVideos(params: SearchFilters) {
  const client = getElasticsearchClient();
  const query = buildVideoSearchQuery(params);
  return client.search(query);
}

export async function indexPhoto(doc: Record<string, any>) {
  const client = getElasticsearchClient();
  return client.index({
    index: PHOTO_INDEX,
    id: doc.id,
    document: doc,
  });
}

export async function indexVideo(doc: Record<string, any>) {
  const client = getElasticsearchClient();
  return client.index({
    index: VIDEO_INDEX,
    id: doc.id,
    document: doc,
  });
}

export async function deleteFromIndex(
  index: string,
  id: string
): Promise<void> {
  const client = getElasticsearchClient();
  await client.delete({ index, id }).catch(() => {});
}
