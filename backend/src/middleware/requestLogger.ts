import { Request, Response, NextFunction } from 'express';

// ── Colors for terminal output (disabled in production) ──
const useColor = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
const c = {
  reset: useColor ? '\x1b[0m' : '',
  dim: useColor ? '\x1b[2m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  red: useColor ? '\x1b[31m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  bold: useColor ? '\x1b[1m' : '',
};

function statusColor(status: number): string {
  if (status >= 500) return c.red;
  if (status >= 400) return c.yellow;
  if (status >= 300) return c.cyan;
  return c.green;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Structured request logger middleware.
 * Logs: [timestamp] [request-id] METHOD /path STATUS duration
 *
 * Skips logging for /health in production to reduce noise.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip health checks in production
  if (process.env.NODE_ENV === 'production' && req.path === '/health') {
    return next();
  }

  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Hook into response finish to capture status and duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.originalUrl || req.url;
    const reqId = (req as any).requestId || '-';

    const color = statusColor(status);
    const durationStr = formatDuration(duration);

    console.log(
      `${c.dim}[${timestamp}]${c.reset} ` +
      `${c.cyan}${reqId.substring(0, 8)}${c.reset} ` +
      `${c.bold}${method}${c.reset} ` +
      `${path} ` +
      `${color}${status}${c.reset} ` +
      `${c.dim}${durationStr}${c.reset}`
    );
  });

  next();
}
