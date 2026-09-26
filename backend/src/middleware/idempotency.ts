import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Idempotency-Key middleware for mutating endpoints.
 *
 * Clients send `Idempotency-Key: <uuid>`; the server stores the response
 * keyed by (method + path + key) and replays the stored response on
 * duplicate submissions — guaranteeing no duplicate side effects
 * (e.g. duplicate refund tickets) on client retries.
 *
 * Keys are held for 24h and capped to prevent unbounded memory growth.
 */
interface StoredResponse {
  status: number;
  body: unknown;
  storedAt: number;
}

const STORE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const STORE_MAX_ENTRIES = 10_000;

const store = new Map<string, StoredResponse>();

// Periodic sweep of expired keys
const sweep = setInterval(() => {
  const cutoff = Date.now() - STORE_TTL_MS;
  for (const [key, entry] of store) {
    if (entry.storedAt < cutoff) store.delete(key);
  }
}, 60 * 60 * 1000);
sweep.unref?.();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only meaningful for mutating requests
  if (req.method !== 'POST') return next();

  const key = req.headers['idempotency-key'];
  if (!key || typeof key !== 'string') {
    // No key provided — process normally (idempotency is opt-in)
    return next();
  }

  const storeKey = `${req.method}:${req.originalUrl}:${key}`;

  // Replay a stored response if we've seen this exact operation before
  const cached = store.get(storeKey);
  if (cached) {
    res.setHeader('Idempotency-Replayed', 'true');
    return res.status(cached.status).json(cached.body);
  }

  // Cap memory usage
  if (store.size >= STORE_MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  // Intercept the response and store it before it flushes
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (!res.headersSent || !res.getHeader('Idempotency-Replayed')) {
      store.set(storeKey, {
        status: res.statusCode,
        body,
        storedAt: Date.now()
      });
    }
    return originalJson(body);
  };

  next();
}

/** Generate a fresh idempotency key (helper for clients/tests) */
export function newIdempotencyKey(): string {
  return uuidv4();
}
