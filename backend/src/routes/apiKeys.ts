import express, { Request, Response } from 'express';
import { apiKeyService } from '../services/apiKeyService.js';
import { asyncErrorWrapper, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();

const generateKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  scopes: z.array(z.enum(['read', 'write', 'admin'])).optional().default(['read']),
  expiresAt: z.string().datetime().optional(),
});

/**
 * POST /api-keys — Generate a new API key
 */
router.post('/', asyncErrorWrapper(async (req: Request, res: Response) => {
  const parsed = generateKeySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400, true, parsed.error.flatten().fieldErrors as any);
  }

  const { key, plaintext } = await apiKeyService.generateKey(parsed.data);

  res.status(201).json({
    success: true,
    message: 'API key generated. Save the key — it won\'t be shown again.',
    data: {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      scopes: key.scopes,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      key: plaintext, // Only shown on creation
    },
  });
}));

/**
 * GET /api-keys — List all API keys
 */
router.get('/', asyncErrorWrapper(async (_req: Request, res: Response) => {
  const keys = await apiKeyService.listKeys();
  res.status(200).json({ success: true, message: 'API keys', data: keys });
}));

/**
 * DELETE /api-keys/:id — Revoke an API key
 */
router.delete('/:id', asyncErrorWrapper(async (req: Request, res: Response) => {
  const revoked = await apiKeyService.revokeKey(req.params.id as string);
  if (!revoked) {
    throw new AppError('API key not found', 404);
  }
  res.status(200).json({ success: true, message: 'API key revoked' });
}));

/**
 * POST /api-keys/validate — Validate an API key
 */
router.post('/validate', asyncErrorWrapper(async (req: Request, res: Response) => {
  const { key } = req.body as { key?: string };
  if (!key) {
    throw new AppError('Key is required', 400);
  }
  const result = await apiKeyService.validateKey(key);
  res.status(200).json({
    success: true,
    message: result.valid ? 'Key is valid' : result.error,
    data: { valid: result.valid, scopes: result.keyData?.scopes },
  });
}));

export default router;
