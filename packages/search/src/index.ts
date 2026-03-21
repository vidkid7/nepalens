export { getElasticsearchClient, PHOTO_INDEX, VIDEO_INDEX } from "./client";
export {
  initIndices,
  buildSearchQuery,
  buildVideoSearchQuery,
  searchPhotos,
  searchVideos,
  indexPhoto,
  indexVideo,
  deleteFromIndex,
} from "./queries";
