import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Express middleware factory that validates req.body, req.params, or req.query
 * against a Zod schema. Returns 400 with structured error details on failure.
 *
 * Usage:
 *   router.post('/', validateBody(createPlaybookSchema), handler);
 *   router.get('/:id', validateParams(playbookIdParamSchema), handler);
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.issues.forEach(e => {
          const field = e.path?.join('.') || 'root';
          if (!errors[field]) errors[field] = [];
          errors[field].push(e.message);
        });
        return next(new AppError('Validation failed', 400, true, errors));
      }
      next(err);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.issues.forEach(e => {
          const field = e.path?.join('.') || 'root';
          if (!errors[field]) errors[field] = [];
          errors[field].push(e.message);
        });
        return next(new AppError('Invalid route parameters', 400, true, errors));
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        err.issues.forEach(e => {
          const field = e.path?.join('.') || 'root';
          if (!errors[field]) errors[field] = [];
          errors[field].push(e.message);
        });
        return next(new AppError('Invalid query parameters', 400, true, errors));
      }
      next(err);
    }
  };
}
