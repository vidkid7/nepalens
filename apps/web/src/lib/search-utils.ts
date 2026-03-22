export interface SearchFilters {
  query: string;
  type: 'photos' | 'videos' | 'users';
  orientation?: string;
  size?: string;
  color?: string;
  sort?: string;
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.type !== 'photos') params.set('type', filters.type);
  if (filters.orientation) params.set('orientation', filters.orientation);
  if (filters.size) params.set('size', filters.size);
  if (filters.color) params.set('color', filters.color);
  if (filters.sort) params.set('sort', filters.sort);
  return params;
}

export function searchParamsToFilters(params: URLSearchParams): SearchFilters {
  return {
    query: params.get('q') || '',
    type: (params.get('type') as SearchFilters['type']) || 'photos',
    orientation: params.get('orientation') || undefined,
    size: params.get('size') || undefined,
    color: params.get('color') || undefined,
    sort: params.get('sort') || undefined,
  };
}
