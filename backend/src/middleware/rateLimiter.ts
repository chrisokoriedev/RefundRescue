import { Request, Response, NextFunction } from 'express';

/**
 * Sliding-window rate limiter (in-memory, per IP).
 *
 * - Default budget for general endpoints.
 * - Tighter budget available for expensive endpoints (AI evaluations).
 * - Emits standard X-RateLimit-* headers on every response.
 */
interface Bucket {
  hits: number[]; // timestamps (ms) of recent hits
}

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  /** Override keying, e.g. to rate-limit by customerId+IP */
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export function rateLimiter(opts: RateLimiterOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 100;
  const message = opts.message ?? 'Too many requests — please slow down.';
  const buckets = new Map<string, Bucket>();

  // Periodic sweep so idle buckets don't leak memory
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, bucket] of buckets) {
      bucket.hits = bucket.hits.filter(t => t > cutoff);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
  }, windowMs);
  sweep.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = opts.keyGenerator
      ? opts.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const cutoff = now - windowMs;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { hits: [] };
      buckets.set(key, bucket);
    }
    bucket.hits = bucket.hits.filter(t => t > cutoff);
    bucket.hits.push(now);

    const remaining = Math.max(0, max - bucket.hits.length);
    const resetAt = bucket.hits.length > 0 ? bucket.hits[0] + windowMs : now + windowMs;

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (bucket.hits.length > max) {
      const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message,
        errors: { rateLimit: [`Limit of ${max} requests per ${windowMs / 1000}s exceeded. Retry after ${retryAfterSec}s.`] }
      });
    }

    next();
  };
}
