// lib/rate-limit.ts

interface RateLimitOptions {
    interval: number;
    maxRequests: number;
  }
  
  class RateLimiter {
    private requests: Map<string, number[]>;
  
    constructor() {
      this.requests = new Map();
    }
  
    async check(key: string, { interval, maxRequests }: RateLimitOptions): Promise<boolean> {
      const now = Date.now();
      const windowStart = now - interval;
  
      if (!this.requests.has(key)) {
        this.requests.set(key, [now]);
        return true;
      }
  
      const requestTimestamps = this.requests.get(key)!;
      const recentRequests = requestTimestamps.filter(timestamp => timestamp > windowStart);
  
      if (recentRequests.length < maxRequests) {
        recentRequests.push(now);
        this.requests.set(key, recentRequests);
        return true;
      }
  
      return false;
    }
  }
  
  const limiter = new RateLimiter();
  
  export async function rateLimit(key: string, options: RateLimitOptions): Promise<void> {
    const allowed = await limiter.check(key, options);
    if (!allowed) {
      throw new Error('Rate limit exceeded');
    }
  }