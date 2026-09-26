import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// ── Custom Operational Error ──
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number = 500, isOperational = true, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ── Async Error Wrapper ──
// Wraps async route handlers so unhandled rejections are forwarded to Express
// instead of crashing the process with an unhandled promise rejection.
export function asyncErrorWrapper(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ── 404 Not Found Handler ──
// Mount AFTER all routes to catch unmatched requests.
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Not Found - ${req.method} ${req.originalUrl}`, 404));
}

// ── Global Error Handler ──
// Must be the LAST middleware (4-arg signature).
// In production, operational errors return safe messages.
// Programming errors are logged but hidden from the client.
export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Always log the full error
  console.error(`[Error Handler] ${statusCode} ${isOperational ? '(Operational)' : '(Programming)'}: ${err.message}`);
  if (!isOperational && process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  // In production, hide programming error details from the client
  const message = isOperational || process.env.NODE_ENV !== 'production'
    ? err.message
    : 'Internal Server Error';

  const errors = err instanceof AppError ? err.errors : undefined;

  const response: any = {
    success: false,
    message: message,
  };

  if (errors) {
    response.errors = errors;
  } else if (process.env.NODE_ENV !== 'production' && !isOperational) {
    response.errors = { server: [err.message] };
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
