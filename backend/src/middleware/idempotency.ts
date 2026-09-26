import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Idempotency-Key Middleware (#25)
 * 
 * For POST endpoints, clients can send an Idempotency-Key header.
 * If the same key is seen twice, the server returns the cached response
 * instead of re-processing the request.
 * 
 * Usage:
 *   router.post('/payments', idempotencyMiddleware, handler);
 * 
 * Storage: In-memory for hackathon. For production, use Redis.
 */

interface IdempotencyEntry {
  key: string;
  statusCode: number;
  body: any;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup stale entries every 10 minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of idempotencyStore) {
      if (now - entry.timestamp > IDEMPOTENCY_TTL_MS) {
        idempotencyStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Idempotency middleware for POST endpoints.
 * 
 * Intercepts the response to cache it, and on repeat requests,
 * returns the cached response instead of re-executing the handler.
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['idempotency-key'] as string | undefined;

  // If no idempotency key, proceed normally
  if (!key) {
    return next();
  }

  // Validate key format (UUID or string up to 255 chars)
  if (key.length > 255) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key must be 255 characters or fewer',
    });
  }

  // Check if we've seen this key before
  const existing = idempotencyStore.get(key);
  if (existing) {
    console.log(`[Idempotency] Replaying cached response for key: ${key}`);
    return res.status(existing.statusCode).json(existing.body);
  }

  // Intercept res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    // Only cache successful responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(key, {
        key,
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      });
      console.log(`[Idempotency] Cached response for key: ${key}`);
    }
    return originalJson(body);
  };

  next();
}

/**
 * Clear all idempotency entries (for testing).
 */
export function clearIdempotencyStore() {
  idempotencyStore.clear();
}
