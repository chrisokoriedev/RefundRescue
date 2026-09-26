import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Adds a unique X-Request-Id to every request and response.
 * If the client sends one, use it; otherwise generate a new UUID.
 * This enables tracing a request through logs, services, and dashboards.
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  
  // Store on request for downstream handlers
  (req as any).requestId = id;
  
  // Send back in response headers
  res.setHeader('X-Request-Id', id);
  
  next();
}
