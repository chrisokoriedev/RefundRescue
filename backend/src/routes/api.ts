import express from 'express';
import { getMetrics, getLogs, getCalleStatus, previewPrompt, triggerCall } from '../controllers/apiController.js';
import { triggerBatchCall } from '../controllers/batchController.js';
import { validateBody, validateQuery } from '../validators/middleware.js';
import { previewPromptSchema, triggerCallSchema } from '../validators/api.schema.js';
import { logsQuerySchema } from '../validators/query.schema.js';

const router = express.Router();

router.get('/metrics', getMetrics);
router.get('/logs', validateQuery(logsQuerySchema), getLogs);
router.get('/calle-status', getCalleStatus);
router.post('/preview-prompt', validateBody(previewPromptSchema), previewPrompt);
router.post('/mock/trigger-call', validateBody(triggerCallSchema), triggerCall);
router.post('/mock/trigger-batch', triggerBatchCall);

export default router;
