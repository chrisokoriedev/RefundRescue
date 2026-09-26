import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection (#16)
 * 
 * For API-only backends using JWT (no cookies), CSRF is NOT needed.
 * This middleware is a no-op placeholder with documentation.
 * 
 * If you later add cookie-based auth, implement:
 *   - Double-submit cookie pattern, OR
 *   - Synchronizer token pattern
 * 
 * For now, CSRF protection is handled by:
 *   - JWT Authorization header (not cookie-based)
 *   - CORS whitelist (only allowed origins can make requests)
 *   - Helmet's Cross-Origin-Embedder-Policy
 */
export function csrfProtection(_req: Request, _res: Response, next: NextFunction) {
  // No-op: JWT auth + CORS whitelist handles CSRF protection
  next();
}
