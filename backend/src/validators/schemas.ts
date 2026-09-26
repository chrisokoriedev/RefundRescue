import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodTypeAny } from 'zod';

// ── Shared schema fragments ──
export const idParamSchema = z.object({
  id: z.string().min(1)
});

export const evaluateRefundSchema = z.object({
  customerId: z.string()
    .regex(/^CUST-\d+$/, 'customerId must match CUST-<number> format'),
  orderId: z.string()
    .regex(/^ORD-\d+$/, 'orderId must match ORD-<number> format'),
  message: z.string()
    .min(1, 'message is required')
    .max(5000, 'message must be 5000 characters or fewer'),
  requestedAmount: z.number()
    .positive('requestedAmount must be positive')
    .max(1_000_000, 'requestedAmount exceeds maximum allowed')
    .optional()
});

export const overrideTicketSchema = z.object({
  decision: z.enum(['APPROVED', 'DENIED', 'ESCALATED']),
  notes: z.string().min(1, 'audit notes are required').max(2000)
});

export const ticketsQuerySchema = z.object({
  status: z.enum(['APPROVED', 'DENIED', 'ESCALATED']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// ── 422 response builder (consistent error envelope) ──
function formatZodError(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

type Source = 'body' | 'query' | 'params';

/**
 * Validate middleware — declarative edge validation for any route.
 * Returns 422 with per-field error arrays on failure.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formatZodError(result.error)
      });
    }
    // Replace with parsed/coerced values
    (req as any)[source] = result.data;
    next();
  };
}

export const validateBody = (schema: ZodTypeAny) => validate(schema, 'body');
export const validateQuery = (schema: ZodTypeAny) => validate(schema, 'query');
export const validateParams = (schema: ZodTypeAny) => validate(schema, 'params');
