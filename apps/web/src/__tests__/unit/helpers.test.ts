import { describe, it, expect } from 'vitest';
import { formatCount, slugify, randomSlug, timeAgo, truncate } from '@/lib/helpers';

describe('formatCount', () => {
  it('returns "0" for zero', () => {
    expect(formatCount(0)).toBe('0');
  });

  it('returns plain number for values under 1000', () => {
    expect(formatCount(1)).toBe('1');
    expect(formatCount(999)).toBe('999');
    expect(formatCount(500)).toBe('500');
  });

  it('formats thousands with one decimal as K', () => {
    expect(formatCount(1000)).toBe('1.0K');
    expect(formatCount(1500)).toBe('1.5K');
    expect(formatCount(9999)).toBe('10.0K');
    expect(formatCount(12345)).toBe('12.3K');
    expect(formatCount(999999)).toBe('1000.0K');
  });

  it('formats millions with one decimal as M', () => {
    expect(formatCount(1000000)).toBe('1.0M');
    expect(formatCount(1500000)).toBe('1.5M');
    expect(formatCount(25600000)).toBe('25.6M');
  });

  it('handles bigint values', () => {
    expect(formatCount(BigInt(0))).toBe('0');
    expect(formatCount(BigInt(500))).toBe('500');
    expect(formatCount(BigInt(2500))).toBe('2.5K');
    expect(formatCount(BigInt(3000000))).toBe('3.0M');
  });

  it('handles negative numbers', () => {
    expect(formatCount(-1)).toBe('-1');
    expect(formatCount(-500)).toBe('-500');
  });
});

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello & World!')).toBe('hello-world');
  });

  it('collapses multiple spaces/hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('truncates to 100 characters', () => {
    const longText = 'a'.repeat(200);
    expect(slugify(longText).length).toBeLessThanOrEqual(100);
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('randomSlug', () => {
  it('returns a non-empty string', () => {
    const slug = randomSlug();
    expect(slug.length).toBeGreaterThan(0);
  });

  it('returns different values on each call', () => {
    const a = randomSlug();
    const b = randomSlug();
    // Statistically almost always different
    expect(typeof a).toBe('string');
    expect(typeof b).toBe('string');
  });
});

describe('timeAgo', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date();
    expect(timeAgo(now)).toBe('just now');
  });

  it('returns minutes for < 1 hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(date)).toBe('5m ago');
  });

  it('returns hours for < 1 day', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe('3h ago');
  });

  it('returns days for < 1 month', () => {
    const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(timeAgo(date)).toBe('7d ago');
  });

  it('accepts ISO string input', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(date)).toBe('2h ago');
  });
});

describe('truncate', () => {
  it('returns text unchanged if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 5)).toBe('hello\u2026');
  });

  it('returns original when length equals maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});
