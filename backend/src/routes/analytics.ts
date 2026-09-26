import express, { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { asyncErrorWrapper } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /analytics — Overall analytics summary
 */
router.get('/', asyncErrorWrapper(async (_req: Request, res: Response) => {
  const summary = await analyticsService.getOverallSummary();
  res.status(200).json({ success: true, message: 'Analytics summary', data: summary });
}));

/**
 * GET /analytics/variants — Get variant performance stats
 * Query params: scenario (optional)
 */
router.get('/variants', asyncErrorWrapper(async (req: Request, res: Response) => {
  const stats = await analyticsService.getVariantStats(req.query.scenario as string);
  res.status(200).json({ success: true, message: 'Variant stats', data: stats });
}));

/**
 * GET /analytics/winner/:scenario — Get winning variant for a scenario
 */
router.get('/winner/:scenario', asyncErrorWrapper(async (req: Request, res: Response) => {
  const winner = await analyticsService.getWinningVariant(req.params.scenario as string);
  if (!winner) {
    return res.status(404).json({
      success: false,
      message: 'No winning variant found (need at least 5 calls per variant)',
    });
  }
  res.status(200).json({ success: true, message: 'Winning variant', data: winner });
}));

export default router;
