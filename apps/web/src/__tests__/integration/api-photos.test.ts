import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @nepalens/database before imports
vi.mock('@nepalens/database', () => ({
  prisma: {
    photo: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    like: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    tag: {
      upsert: vi.fn(),
    },
    photoTag: {
      create: vi.fn(),
    },
    challengeSubmission: {
      create: vi.fn(),
    },
  },
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { prisma } from '@nepalens/database';
import { getServerSession } from 'next-auth';

// Import after mocks are set up
import { GET, POST } from '@/app/api/internal/photos/route';

function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options) as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.example.com';
});

describe('GET /api/internal/photos', () => {
  it('returns curated photos by default', async () => {
    const mockPhotos = [
      {
        id: 'photo-1',
        slug: 'sunset-photo',
        altText: 'A sunset',
        width: 1920,
        height: 1080,
        userId: 'user-1',
        dominantColor: '#ff6600',
        blurHash: 'LEHV6nWB2yk8',
        originalUrl: 'https://cdn.example.com/original.jpg',
        cdnKey: 'photos/photo-1',
        createdAt: new Date('2024-01-01'),
        user: { id: 'user-1', username: 'john', displayName: 'John Doe', avatarUrl: null },
        tags: [{ tag: { name: 'sunset' } }, { tag: { name: 'nature' } }],
      },
    ];

    vi.mocked(prisma.photo.findMany).mockResolvedValue(mockPhotos as any);
    vi.mocked(prisma.photo.count).mockResolvedValue(1);
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos');
    const response = await GET(request);
    const data = await response.json();

    expect(data.photos).toHaveLength(1);
    expect(data.photos[0].id).toBe('photo-1');
    expect(data.photos[0].photographer).toBe('John Doe');
    expect(data.photos[0].tags).toEqual(['sunset', 'nature']);
    expect(data.photos[0].src.original).toBe('https://cdn.example.com/original.jpg');
    expect(data.total_results).toBe(1);
  });

  it('returns 401 when liked filter requires auth and no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos?liked=true');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns liked photos for authenticated user', async () => {
    const mockSession = { user: { id: 'user-1', name: 'John' } };
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);

    vi.mocked(prisma.like.findMany).mockResolvedValue([
      { mediaId: 'photo-1' },
    ] as any);
    vi.mocked(prisma.like.count).mockResolvedValue(1);

    const mockPhotos = [
      {
        id: 'photo-1',
        slug: 'liked-photo',
        altText: 'Liked',
        width: 800,
        height: 600,
        userId: 'user-2',
        dominantColor: '#cccccc',
        blurHash: null,
        originalUrl: 'https://cdn.example.com/liked.jpg',
        cdnKey: 'photos/photo-1',
        createdAt: new Date('2024-01-01'),
        user: { id: 'user-2', username: 'jane', displayName: 'Jane', avatarUrl: null },
        tags: [],
      },
    ];

    vi.mocked(prisma.photo.findMany).mockResolvedValue(mockPhotos as any);

    const request = makeRequest('http://localhost/api/internal/photos?liked=true');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.photos).toHaveLength(1);
    expect(data.photos[0].liked).toBe(true);
  });

  it('returns empty list when user filter has no matching user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos?user=nonexistent');
    const response = await GET(request);
    const data = await response.json();

    expect(data.photos).toEqual([]);
    expect(data.total_results).toBe(0);
  });

  it('filters photos by username', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);
    vi.mocked(prisma.photo.findMany).mockResolvedValue([]);
    vi.mocked(prisma.photo.count).mockResolvedValue(0);
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos?user=john');
    const response = await GET(request);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'john' },
      select: { id: true },
    });
    expect(prisma.photo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      }),
    );
  });

  it('uses pagination parameters', async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([]);
    vi.mocked(prisma.photo.count).mockResolvedValue(0);
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos?page=2&per_page=10');
    const response = await GET(request);
    const data = await response.json();

    expect(data.page).toBe(2);
    expect(data.per_page).toBe(10);
  });

  it('caps per_page at 80', async () => {
    vi.mocked(prisma.photo.findMany).mockResolvedValue([]);
    vi.mocked(prisma.photo.count).mockResolvedValue(0);
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos?per_page=200');
    const response = await GET(request);
    const data = await response.json();

    expect(data.per_page).toBe(80);
  });
});

describe('POST /api/internal/photos', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = makeRequest('http://localhost/api/internal/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key: 'test.jpg', title: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when s3Key is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const request = makeRequest('http://localhost/api/internal/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('s3Key and title are required');
  });

  it('returns 400 when title is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const request = makeRequest('http://localhost/api/internal/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key: 'uploads/photo.jpg' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('s3Key and title are required');
  });

  it('creates a photo with correct fields', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const createdPhoto = {
      id: 'new-photo-1',
      slug: 'beautiful-sunset',
      userId: 'user-1',
      user: { id: 'user-1', username: 'john', displayName: 'John', avatarUrl: null },
    };

    vi.mocked(prisma.photo.create).mockResolvedValue(createdPhoto as any);
    vi.mocked(prisma.photo.findUnique).mockResolvedValue({
      ...createdPhoto,
      tags: [],
    } as any);

    const request = makeRequest('http://localhost/api/internal/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        s3Key: 'uploads/sunset.jpg',
        title: 'Beautiful Sunset',
        description: 'A photo of a sunset',
        altText: 'Sunset over ocean',
        location: 'Hawaii',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(prisma.photo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          slug: 'beautiful-sunset',
          originalUrl: 'https://cdn.example.com/uploads/sunset.jpg',
          cdnKey: 'uploads/sunset.jpg',
          status: 'pending',
          description: 'A photo of a sunset',
          altText: 'Sunset over ocean',
          locationName: 'Hawaii',
          width: 0,
          height: 0,
        }),
      }),
    );
  });

  it('creates tags and photo-tag relations', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const createdPhoto = {
      id: 'photo-with-tags',
      slug: 'tagged-photo',
      userId: 'user-1',
      user: { id: 'user-1', username: 'john', displayName: 'John', avatarUrl: null },
    };

    vi.mocked(prisma.photo.create).mockResolvedValue(createdPhoto as any);
    vi.mocked(prisma.tag.upsert).mockResolvedValueOnce({ id: 'tag-1', name: 'nature', slug: 'nature' } as any);
    vi.mocked(prisma.tag.upsert).mockResolvedValueOnce({ id: 'tag-2', name: 'sunset', slug: 'sunset' } as any);
    vi.mocked(prisma.photoTag.create).mockResolvedValue({} as any);
    vi.mocked(prisma.photo.findUnique).mockResolvedValue({
      ...createdPhoto,
      tags: [{ tag: { name: 'nature' } }, { tag: { name: 'sunset' } }],
    } as any);

    const request = makeRequest('http://localhost/api/internal/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        s3Key: 'uploads/nature.jpg',
        title: 'Tagged Photo',
        tags: ['Nature', 'Sunset'],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prisma.tag.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.photoTag.create).toHaveBeenCalledTimes(2);

    // Verify tag normalization (lowercase)
    expect(prisma.tag.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'nature' },
        create: { name: 'nature', slug: 'nature' },
      }),
    );
  });

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);

    const request = makeRequest('http://localhost/api/internal/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not valid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid JSON');
  });
});
