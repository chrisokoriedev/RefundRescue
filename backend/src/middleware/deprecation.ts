import { Request, Response, NextFunction } from 'express';

/**
 * Deprecation Headers (#24)
 * 
 * Adds Deprecation and Sunset headers to API responses when
 * the client is using a deprecated API version.
 * 
 * Usage:
 *   app.use('/api', deprecationHeaders({ version: 'v1', sunsetDate: '2027-01-01' }));
 */

interface DeprecationOptions {
  /** The API version being deprecated (e.g., 'v1') */
  version: string;
  /** ISO date when the version will be removed */
  sunsetDate: string;
  /** Link to migration guide */
  migrationUrl?: string;
}

export function deprecationHeaders(options: DeprecationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only add headers for the deprecated version's routes
    if (req.path.startsWith(`/${options.version}`) || req.baseUrl.includes(`/${options.version}`)) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', new Date(options.sunsetDate).toUTCString());
      res.setHeader('Link', `</api/${options.version === 'v1' ? 'v2' : 'v2'}>; rel="successor-version"`);
      
      if (options.migrationUrl) {
        res.setHeader('X-Migration-Guide', options.migrationUrl);
      }
    }
    next();
  };
}
