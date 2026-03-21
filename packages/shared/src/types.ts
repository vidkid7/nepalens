export interface PhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PhotoResponse {
  id: string;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: string;
  avg_color: string | null;
  liked: boolean;
  alt: string | null;
  src: PhotoSrc;
}

export interface VideoFileResponse {
  id: string;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps: number | null;
  link: string;
}

export interface VideoResponse {
  id: string;
  width: number;
  height: number;
  url: string;
  duration: number | null;
  user: {
    id: string;
    name: string;
    url: string;
  };
  video_files: VideoFileResponse[];
}

export interface PaginatedResponse<T> {
  total_results: number;
  page: number;
  per_page: number;
  photos?: T[];
  videos?: T[];
  next_page?: string;
  prev_page?: string;
}

export interface SearchFilters {
  query?: string;
  orientation?: string;
  size?: string;
  color?: string;
  locale?: string;
  page?: number;
  perPage?: number;
}
