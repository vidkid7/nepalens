import { describe, it, expect } from 'vitest';
import {
  CONTENT_STATES,
  STATE_TRANSITIONS,
  isValidTransition,
  IMAGE_SIZES,
  COLOR_BUCKETS,
  ORIENTATIONS,
  SIZE_TIERS,
  MEDIA_TYPES,
  PHOTO_STATUSES,
  VIDEO_QUALITIES,
  API_TIERS,
} from '@pixelstock/shared';

describe('CONTENT_STATES', () => {
  const expectedStates = [
    'draft', 'uploaded', 'processing', 'processing_failed',
    'pending_review', 'approved', 'rejected', 'needs_changes',
    'published', 'hidden', 'removed', 'reported',
  ];

  it('defines all 12 content states', () => {
    expect(Object.keys(CONTENT_STATES)).toHaveLength(12);
  });

  it.each(expectedStates)('includes "%s" as a state value', (state) => {
    expect(Object.values(CONTENT_STATES)).toContain(state);
  });

  it('maps uppercase keys to lowercase values', () => {
    expect(CONTENT_STATES.DRAFT).toBe('draft');
    expect(CONTENT_STATES.UPLOADED).toBe('uploaded');
    expect(CONTENT_STATES.PROCESSING).toBe('processing');
    expect(CONTENT_STATES.PROCESSING_FAILED).toBe('processing_failed');
    expect(CONTENT_STATES.PENDING_REVIEW).toBe('pending_review');
    expect(CONTENT_STATES.APPROVED).toBe('approved');
    expect(CONTENT_STATES.REJECTED).toBe('rejected');
    expect(CONTENT_STATES.NEEDS_CHANGES).toBe('needs_changes');
    expect(CONTENT_STATES.PUBLISHED).toBe('published');
    expect(CONTENT_STATES.HIDDEN).toBe('hidden');
    expect(CONTENT_STATES.REMOVED).toBe('removed');
    expect(CONTENT_STATES.REPORTED).toBe('reported');
  });
});

describe('STATE_TRANSITIONS', () => {
  it('defines transitions for all 12 states', () => {
    expect(Object.keys(STATE_TRANSITIONS)).toHaveLength(12);
  });

  it('draft can transition to uploaded', () => {
    expect(STATE_TRANSITIONS.draft).toContain('uploaded');
    expect(STATE_TRANSITIONS.draft).toHaveLength(1);
  });

  it('uploaded can transition to processing', () => {
    expect(STATE_TRANSITIONS.uploaded).toContain('processing');
  });

  it('processing can transition to processing_failed or pending_review', () => {
    expect(STATE_TRANSITIONS.processing).toContain('processing_failed');
    expect(STATE_TRANSITIONS.processing).toContain('pending_review');
  });

  it('processing_failed can only retry to processing', () => {
    expect(STATE_TRANSITIONS.processing_failed).toEqual(['processing']);
  });

  it('processing_failed cannot transition to published', () => {
    expect(STATE_TRANSITIONS.processing_failed).not.toContain('published');
  });

  it('pending_review can transition to approved, rejected, or needs_changes', () => {
    expect(STATE_TRANSITIONS.pending_review).toContain('approved');
    expect(STATE_TRANSITIONS.pending_review).toContain('rejected');
    expect(STATE_TRANSITIONS.pending_review).toContain('needs_changes');
  });

  it('approved can transition to published, hidden, removed, or reported', () => {
    expect(STATE_TRANSITIONS.approved).toContain('published');
    expect(STATE_TRANSITIONS.approved).toContain('hidden');
    expect(STATE_TRANSITIONS.approved).toContain('removed');
    expect(STATE_TRANSITIONS.approved).toContain('reported');
  });

  it('published can transition to hidden, removed, or reported', () => {
    expect(STATE_TRANSITIONS.published).toContain('hidden');
    expect(STATE_TRANSITIONS.published).toContain('removed');
    expect(STATE_TRANSITIONS.published).toContain('reported');
  });

  it('hidden can transition to published or removed', () => {
    expect(STATE_TRANSITIONS.hidden).toContain('published');
    expect(STATE_TRANSITIONS.hidden).toContain('removed');
  });

  it('rejected can resubmit to pending_review', () => {
    expect(STATE_TRANSITIONS.rejected).toEqual(['pending_review']);
  });

  it('needs_changes can resubmit to pending_review', () => {
    expect(STATE_TRANSITIONS.needs_changes).toEqual(['pending_review']);
  });

  it('removed can be restored to pending_review', () => {
    expect(STATE_TRANSITIONS.removed).toEqual(['pending_review']);
  });

  it('reported can lead to approved or removed', () => {
    expect(STATE_TRANSITIONS.reported).toContain('approved');
    expect(STATE_TRANSITIONS.reported).toContain('removed');
  });

  it('all transition targets are valid state values', () => {
    const validStates = Object.values(CONTENT_STATES) as string[];
    for (const [source, targets] of Object.entries(STATE_TRANSITIONS)) {
      for (const target of targets) {
        expect(validStates).toContain(target);
      }
    }
  });
});

describe('isValidTransition', () => {
  it('returns true for valid transitions', () => {
    expect(isValidTransition('draft', 'uploaded')).toBe(true);
    expect(isValidTransition('approved', 'published')).toBe(true);
    expect(isValidTransition('published', 'hidden')).toBe(true);
  });

  it('returns false for invalid transitions', () => {
    expect(isValidTransition('draft', 'published')).toBe(false);
    expect(isValidTransition('processing_failed', 'published')).toBe(false);
    expect(isValidTransition('rejected', 'published')).toBe(false);
  });

  it('returns false for unknown source state', () => {
    expect(isValidTransition('nonexistent', 'published')).toBe(false);
  });

  it('returns false for unknown target state', () => {
    expect(isValidTransition('draft', 'nonexistent')).toBe(false);
  });
});

describe('IMAGE_SIZES', () => {
  it('defines 8 image size variants', () => {
    expect(IMAGE_SIZES).toHaveLength(8);
  });

  it('includes original, large2x, large, medium, small, portrait, landscape, tiny', () => {
    const names = IMAGE_SIZES.map((s) => s.name);
    expect(names).toEqual(['original', 'large2x', 'large', 'medium', 'small', 'portrait', 'landscape', 'tiny']);
  });
});

describe('COLOR_BUCKETS', () => {
  it('defines 12 color buckets', () => {
    expect(Object.keys(COLOR_BUCKETS)).toHaveLength(12);
  });

  it('includes standard color names', () => {
    const colors = Object.keys(COLOR_BUCKETS);
    expect(colors).toContain('red');
    expect(colors).toContain('blue');
    expect(colors).toContain('green');
    expect(colors).toContain('black');
    expect(colors).toContain('white');
  });
});

describe('ORIENTATIONS', () => {
  it('defines landscape, portrait, and square', () => {
    expect([...ORIENTATIONS]).toEqual(['landscape', 'portrait', 'square']);
  });
});

describe('MEDIA_TYPES', () => {
  it('defines photo and video', () => {
    expect([...MEDIA_TYPES]).toEqual(['photo', 'video']);
  });
});

describe('PHOTO_STATUSES', () => {
  it('defines 5 statuses', () => {
    expect([...PHOTO_STATUSES]).toEqual(['pending', 'processed', 'approved', 'rejected', 'removed']);
  });
});

describe('VIDEO_QUALITIES', () => {
  it('defines hd, fhd, and 4k', () => {
    expect([...VIDEO_QUALITIES]).toEqual(['hd', 'fhd', '4k']);
  });
});

describe('API_TIERS', () => {
  it('defines free and unlimited tiers', () => {
    expect(API_TIERS.free.rateLimitHour).toBe(200);
    expect(API_TIERS.free.rateLimitMonth).toBe(20000);
    expect(API_TIERS.unlimited.rateLimitHour).toBe(10000);
    expect(API_TIERS.unlimited.rateLimitMonth).toBe(1000000);
  });
});
