import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy initialize Redis to avoid breaking compile-time checks or local development without Redis credentials
let redis: Redis | null = null;

interface RateLimiterMap {
  payment: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  pdf: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  admin: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  search: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  like: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
  comment: { limit: (id: string) => Promise<{ success: boolean; limit: number; remaining: number; reset: number }> };
}

let rateLimiters: RateLimiterMap | null = null;

function getRateLimiters() {
  if (rateLimiters) return rateLimiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Safe fallback if not set during build/compilation
  if (!url || !token || url.includes('dummy-url') || token.includes('dummy_token')) {
    const mockLimiter = {
      limit: async () => ({
        success: true,
        limit: 100,
        remaining: 100,
        reset: Date.now() + 60000,
      }),
    };
    rateLimiters = {
      payment: mockLimiter,
      pdf: mockLimiter,
      admin: mockLimiter,
      search: mockLimiter,
      like: mockLimiter,
      comment: mockLimiter,
    };
    return rateLimiters;
  }

  redis = new Redis({ url, token });

  rateLimiters = {
    // Payment routes — strict (5 attempts per minute)
    payment: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:payment',
    }),

    // PDF proxy — moderate (30 per minute)
    pdf: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'rl:pdf',
    }),

    // Admin routes — very strict (10 per minute)
    admin: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:admin',
    }),

    // Search — relaxed (60 per minute)
    search: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'rl:search',
    }),

    // Like — spam prevention (10 per minute)
    like: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'rl:like',
    }),

    // Comment — spam prevention (5 per minute)
    comment: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'rl:comment',
    }),
  };

  return rateLimiters;
}

// Reusable helper
export async function checkRateLimit(
  limiterName: 'payment' | 'pdf' | 'admin' | 'search' | 'like' | 'comment',
  identifier: string
): Promise<{ blocked: true; headers: Record<string, string> } | { blocked: false; headers?: undefined }> {
  const limiters = getRateLimiters();
  const limiter = limiters[limiterName];
  const { success, limit, reset } = await limiter.limit(identifier);

  if (!success) {
    return {
      blocked: true,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    };
  }

  return { blocked: false };
}
