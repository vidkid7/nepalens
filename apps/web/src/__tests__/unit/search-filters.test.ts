import { describe, it, expect } from 'vitest';
import {
  filtersToSearchParams,
  searchParamsToFilters,
  type SearchFilters,
} from '@/lib/search-utils';

describe('filtersToSearchParams', () => {
  it('sets query as "q" parameter', () => {
    const params = filtersToSearchParams({ query: 'sunset', type: 'photos' });
    expect(params.get('q')).toBe('sunset');
  });

  it('omits type param when type is "photos" (default)', () => {
    const params = filtersToSearchParams({ query: 'nature', type: 'photos' });
    expect(params.has('type')).toBe(false);
  });

  it('sets type param for non-default types', () => {
    const params = filtersToSearchParams({ query: 'beach', type: 'videos' });
    expect(params.get('type')).toBe('videos');

    const params2 = filtersToSearchParams({ query: 'john', type: 'users' });
    expect(params2.get('type')).toBe('users');
  });

  it('sets orientation when provided', () => {
    const params = filtersToSearchParams({ query: 'test', type: 'photos', orientation: 'landscape' });
    expect(params.get('orientation')).toBe('landscape');
  });

  it('omits orientation when not provided', () => {
    const params = filtersToSearchParams({ query: 'test', type: 'photos' });
    expect(params.has('orientation')).toBe(false);
  });

  it('sets size when provided', () => {
    const params = filtersToSearchParams({ query: 'test', type: 'photos', size: 'large' });
    expect(params.get('size')).toBe('large');
  });

  it('sets color when provided', () => {
    const params = filtersToSearchParams({ query: 'test', type: 'photos', color: 'red' });
    expect(params.get('color')).toBe('red');
  });

  it('sets sort when provided', () => {
    const params = filtersToSearchParams({ query: 'test', type: 'photos', sort: 'newest' });
    expect(params.get('sort')).toBe('newest');
  });

  it('sets all optional params together', () => {
    const filters: SearchFilters = {
      query: 'mountain',
      type: 'videos',
      orientation: 'portrait',
      size: 'medium',
      color: 'blue',
      sort: 'popular',
    };
    const params = filtersToSearchParams(filters);
    expect(params.get('q')).toBe('mountain');
    expect(params.get('type')).toBe('videos');
    expect(params.get('orientation')).toBe('portrait');
    expect(params.get('size')).toBe('medium');
    expect(params.get('color')).toBe('blue');
    expect(params.get('sort')).toBe('popular');
  });

  it('omits query if empty string', () => {
    const params = filtersToSearchParams({ query: '', type: 'photos' });
    expect(params.has('q')).toBe(false);
  });
});

describe('searchParamsToFilters', () => {
  it('extracts query from "q" parameter', () => {
    const params = new URLSearchParams('q=sunset');
    const filters = searchParamsToFilters(params);
    expect(filters.query).toBe('sunset');
  });

  it('defaults query to empty string when missing', () => {
    const params = new URLSearchParams('');
    const filters = searchParamsToFilters(params);
    expect(filters.query).toBe('');
  });

  it('defaults type to "photos" when missing', () => {
    const params = new URLSearchParams('q=test');
    const filters = searchParamsToFilters(params);
    expect(filters.type).toBe('photos');
  });

  it('reads type parameter', () => {
    const params = new URLSearchParams('q=test&type=videos');
    const filters = searchParamsToFilters(params);
    expect(filters.type).toBe('videos');
  });

  it('returns undefined for missing optional params', () => {
    const params = new URLSearchParams('q=test');
    const filters = searchParamsToFilters(params);
    expect(filters.orientation).toBeUndefined();
    expect(filters.size).toBeUndefined();
    expect(filters.color).toBeUndefined();
    expect(filters.sort).toBeUndefined();
  });

  it('reads all optional parameters', () => {
    const params = new URLSearchParams('q=test&type=users&orientation=landscape&size=large&color=red&sort=newest');
    const filters = searchParamsToFilters(params);
    expect(filters.orientation).toBe('landscape');
    expect(filters.size).toBe('large');
    expect(filters.color).toBe('red');
    expect(filters.sort).toBe('newest');
  });
});

describe('roundtrip encoding/decoding', () => {
  it('preserves all fields through encode → decode', () => {
    const original: SearchFilters = {
      query: 'beautiful sunset',
      type: 'videos',
      orientation: 'landscape',
      size: 'large',
      color: 'orange',
      sort: 'popular',
    };

    const params = filtersToSearchParams(original);
    const decoded = searchParamsToFilters(params);

    expect(decoded).toEqual(original);
  });

  it('preserves minimal filters through roundtrip', () => {
    const original: SearchFilters = { query: 'cat', type: 'photos' };
    const params = filtersToSearchParams(original);
    const decoded = searchParamsToFilters(params);

    expect(decoded.query).toBe('cat');
    expect(decoded.type).toBe('photos');
    expect(decoded.orientation).toBeUndefined();
    expect(decoded.size).toBeUndefined();
    expect(decoded.color).toBeUndefined();
    expect(decoded.sort).toBeUndefined();
  });

  it('handles special characters in query', () => {
    const original: SearchFilters = { query: 'red & blue + green', type: 'photos' };
    const params = filtersToSearchParams(original);
    const decoded = searchParamsToFilters(params);

    expect(decoded.query).toBe('red & blue + green');
  });

  it('handles unicode in query', () => {
    const original: SearchFilters = { query: '日本の桜', type: 'photos' };
    const params = filtersToSearchParams(original);
    const decoded = searchParamsToFilters(params);

    expect(decoded.query).toBe('日本の桜');
  });
});

describe('edge cases', () => {
  it('empty URLSearchParams returns all defaults', () => {
    const filters = searchParamsToFilters(new URLSearchParams());
    expect(filters).toEqual({
      query: '',
      type: 'photos',
      orientation: undefined,
      size: undefined,
      color: undefined,
      sort: undefined,
    });
  });

  it('extra params in URL are ignored', () => {
    const params = new URLSearchParams('q=test&unknown=value&page=2');
    const filters = searchParamsToFilters(params);
    expect(filters.query).toBe('test');
    expect(filters.type).toBe('photos');
    expect((filters as any).unknown).toBeUndefined();
  });
});
