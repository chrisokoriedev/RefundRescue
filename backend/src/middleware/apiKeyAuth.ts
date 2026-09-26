import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../services/apiKeyService.js';

/**
 * API Key Authentication Middleware (#22)
 * 
 * Validates API key from X-API-Key header.
 * Used for programmatic access (Flutter app, scripts, etc.).
 * 
 * Usage:
 *   router.get('/data', requireApiKey('read'), handler);
 *   router.post('/data', requireApiKey('write'), handler);
 */

export function requireApiKey(requiredScope: string = 'read') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string | undefined;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Missing X-API-Key header',
      });
    }

    const result = await apiKeyService.validateKey(apiKey);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        message: `Invalid API key: ${result.error}`,
      });
    }

    // Check scope
    if (result.keyData && !result.keyData.scopes.includes(requiredScope) && !result.keyData.scopes.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: `Insufficient scope: requires '${requiredScope}'`,
      });
    }

    // Attach key info to request for downstream use
    (req as any).apiKey = result.keyData;
    next();
  };
}
