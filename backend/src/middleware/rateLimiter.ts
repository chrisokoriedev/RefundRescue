import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory sliding window rate limiter.
 * For production, use Redis-backed limiter (e.g. express-rate-limit + Redis store).
 * 
 * Usage:
 *   app.use('/api', rateLimiter({ windowMs: 60_000, max: 100 }));
 */

interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60 seconds) */
  windowMs: number;
  /** Max requests per window per IP (default: 100) */
  max: number;
  /** Custom message on rate limit hit */
  message?: string;
}

interface WindowData {
  count: number;
  resetTime: number;
}

const DEFAULTS: RateLimiterOptions = {
  windowMs: 60_000,
  max: 100,
};

export function rateLimiter(options?: Partial<RateLimiterOptions>) {
  const opts = { ...DEFAULTS, ...options };
  const windows = new Map<string, WindowData>();

  // Cleanup expired windows every 5 minutes
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of windows) {
      if (now > data.resetTime) {
        windows.delete(key);
      }
    }
  }, 5 * 60_000);
  
  // Prevent memory leak if server shuts down
  if (process.env.NODE_ENV === 'test') {
    clearInterval(cleanup);
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in test mode
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    let window = windows.get(key);
    
    if (!window || now > window.resetTime) {
      window = { count: 0, resetTime: now + opts.windowMs };
      windows.set(key, window);
    }

    window.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', opts.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.max - window.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(window.resetTime / 1000));

    if (window.count > opts.max) {
      res.setHeader('Retry-After', Math.ceil((window.resetTime - now) / 1000));
      return res.status(429).json({
        success: false,
        message: opts.message || 'Too many requests. Please try again later.',
      });
    }

    next();
  };
}
