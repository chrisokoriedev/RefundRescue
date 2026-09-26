import express, { Request, Response } from 'express';
import { exportService } from '../services/exportService.js';
import { asyncErrorWrapper } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /exports/csv — Export logs as CSV
 * Query params: status, scenario, dateFrom, dateTo
 */
router.get('/csv', asyncErrorWrapper(async (req: Request, res: Response) => {
  const csvData = await exportService.generateRecoveryLogs({
    format: 'csv',
    status: req.query.status as string,
    scenario: req.query.scenario as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=recovery-logs.csv');
  res.status(200).json({ success: true, message: 'CSV export generated', data: csvData });
}));

/**
 * GET /exports/json — Export logs as JSON
 * Query params: status, scenario, dateFrom, dateTo
 */
router.get('/json', asyncErrorWrapper(async (req: Request, res: Response) => {
  const jsonData = await exportService.generateRecoveryLogs({
    format: 'json',
    status: req.query.status as string,
    scenario: req.query.scenario as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
  });
  res.setHeader('Content-Disposition', 'attachment; filename=recovery-logs.json');
  res.status(200).json({ success: true, message: 'JSON export generated', data: jsonData });
}));

/**
 * GET /exports/summary — Get export summary statistics
 */
router.get('/summary', asyncErrorWrapper(async (_req: Request, res: Response) => {
  const summary = await exportService.getExportSummary();
  res.status(200).json({ success: true, message: 'Export summary', data: summary });
}));

export default router;
