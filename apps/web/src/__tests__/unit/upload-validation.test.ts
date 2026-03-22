import { describe, it, expect } from 'vitest';
import {
  validateUploadFile,
  generateSlug,
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/upload-validation';

describe('ACCEPTED_TYPES', () => {
  it('accepts JPEG, PNG, WebP, and AVIF', () => {
    expect(ACCEPTED_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  });
});

describe('MAX_FILE_SIZE', () => {
  it('is 50 MB', () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });
});

describe('validateUploadFile', () => {
  const makeFile = (type: string, size: number, name = 'test.jpg') => ({ type, size, name });

  describe('valid files', () => {
    it('accepts JPEG files', () => {
      expect(validateUploadFile(makeFile('image/jpeg', 1024, 'photo.jpg'))).toBeNull();
    });

    it('accepts PNG files', () => {
      expect(validateUploadFile(makeFile('image/png', 1024, 'photo.png'))).toBeNull();
    });

    it('accepts WebP files', () => {
      expect(validateUploadFile(makeFile('image/webp', 1024, 'photo.webp'))).toBeNull();
    });

    it('accepts AVIF files', () => {
      expect(validateUploadFile(makeFile('image/avif', 1024, 'photo.avif'))).toBeNull();
    });

    it('accepts a file at exactly 50 MB', () => {
      expect(validateUploadFile(makeFile('image/jpeg', MAX_FILE_SIZE, 'large.jpg'))).toBeNull();
    });
  });

  describe('invalid file types', () => {
    it('rejects PDF files', () => {
      const result = validateUploadFile(makeFile('application/pdf', 1024, 'doc.pdf'));
      expect(result).toBe('Unsupported format. Use JPEG, PNG, WebP, or AVIF.');
    });

    it('rejects GIF files', () => {
      const result = validateUploadFile(makeFile('image/gif', 1024, 'anim.gif'));
      expect(result).toBe('Unsupported format. Use JPEG, PNG, WebP, or AVIF.');
    });

    it('rejects SVG files', () => {
      const result = validateUploadFile(makeFile('image/svg+xml', 1024, 'icon.svg'));
      expect(result).toBe('Unsupported format. Use JPEG, PNG, WebP, or AVIF.');
    });

    it('rejects empty type', () => {
      const result = validateUploadFile(makeFile('', 1024, 'unknown'));
      expect(result).toBe('Unsupported format. Use JPEG, PNG, WebP, or AVIF.');
    });

    it('rejects video files', () => {
      const result = validateUploadFile(makeFile('video/mp4', 1024, 'video.mp4'));
      expect(result).toBe('Unsupported format. Use JPEG, PNG, WebP, or AVIF.');
    });
  });

  describe('file size limits', () => {
    it('rejects files over 50 MB', () => {
      const result = validateUploadFile(makeFile('image/jpeg', MAX_FILE_SIZE + 1, 'huge.jpg'));
      expect(result).toBe('File too large. Max 50 MB.');
    });

    it('rejects very large files', () => {
      const result = validateUploadFile(makeFile('image/png', 200 * 1024 * 1024, 'giant.png'));
      expect(result).toBe('File too large. Max 50 MB.');
    });
  });

  describe('type error takes precedence over size', () => {
    it('reports format error even if file is also too large', () => {
      const result = validateUploadFile(makeFile('application/pdf', MAX_FILE_SIZE + 1, 'big.pdf'));
      expect(result).toBe('Unsupported format. Use JPEG, PNG, WebP, or AVIF.');
    });
  });
});

describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('My Photo Title')).toBe('my-photo-title');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello & World!')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('too   many   spaces')).toBe('too-many-spaces');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('hello---world')).toBe('hello-world');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  padded title  ')).toBe('padded-title');
  });

  it('handles numbers', () => {
    expect(generateSlug('Photo 2024 Sunset')).toBe('photo-2024-sunset');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles string with only special characters', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('');
  });

  it('preserves hyphens', () => {
    expect(generateSlug('well-known-title')).toBe('well-known-title');
  });
});
