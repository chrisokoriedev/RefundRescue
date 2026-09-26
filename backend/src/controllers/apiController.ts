import { Request, Response } from 'express';
import { store } from '../services/recoveryStore.js';
import { calleService } from '../services/calleService.js';
import { getPromptForScenario } from '../services/promptBuilder.js';
import { playbookService } from '../services/playbookService.js';
import { slackService } from '../services/slackService.js';
import { TriggerCallInput } from '../validators/api.schema.js';
import { asyncErrorWrapper, AppError } from '../middleware/errorHandler.js';
import { analyticsService } from '../services/analyticsService.js';
import { paginate, ALLOWED_LOG_SORT_FIELDS } from '../utils/pagination.js';

export const getMetrics = asyncErrorWrapper(async (req: Request, res: Response) => {
  const metrics = await store.getMetrics();
  res.status(200).json({ success: true, message: 'Metrics retrieved successfully', data: metrics });
});

export const getLogs = asyncErrorWrapper(async (req: Request, res: Response) => {
  const logs = await store.getLogs();

  // ── Filtering ──
  let filtered = [...logs];
  
  const { status, scenario, search, sortBy, order, dateFrom, dateTo } = req.query as any;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  if (status) {
    filtered = filtered.filter(log => log.status === status);
  }
  if (scenario) {
    filtered = filtered.filter(log => log.scenario === scenario);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(log =>
      (log.customerName || '').toLowerCase().includes(q) ||
      (log.companyName || '').toLowerCase().includes(q) ||
      (log.phone || '').includes(q)
    );
  }

  // ── Date range filtering ──
  if (dateFrom) {
    const from = new Date(dateFrom).getTime();
    filtered = filtered.filter(log => {
      const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0;
      return ts >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo).getTime();
    filtered = filtered.filter(log => {
      const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0;
      return ts <= to;
    });
  }

  // ── Sorting (whitelist prevents arbitrary field access) ──
  const sortKey = ALLOWED_LOG_SORT_FIELDS.includes(sortBy) ? sortBy : 'timestamp';
  
  filtered.sort((a, b) => {
    const aVal = a[sortKey as keyof typeof a];
    const bVal = b[sortKey as keyof typeof b];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  // ── Pagination ──
  const result = paginate(filtered, page, limit);

  res.status(200).json({
    success: true,
    message: 'Logs retrieved successfully',
    ...result,
  });
});

export const getCalleStatus = asyncErrorWrapper(async (req: Request, res: Response) => {
  const status = await calleService.getAuthStatus();
  res.status(200).json({ success: true, message: 'Call-E status retrieved successfully', data: status });
});

export const previewPrompt = asyncErrorWrapper(async (req: Request, res: Response) => {
  const { scenario, customerName, companyName, mrr, planName } = req.body;
  const prompt = getPromptForScenario(scenario, { customerName, companyName, mrr, planName });
  res.status(200).json({ success: true, message: 'Prompt preview generated', data: { prompt } });
});

// ── Simulator: Manually trigger a real CALL-E call (bypasses Stripe) ──
export const triggerCall = asyncErrorWrapper(async (req: Request, res: Response) => {
  const { customerName, phone, mrr, churnType, companyName } = req.body as TriggerCallInput;

  // Map churnType to scenario
  const scenario = churnType === 'voluntary' ? 'subscription_canceled' : 'payment_failed';

  // Select A/B test playbook
  const playbook = await playbookService.selectActivePlaybookVariant(scenario);

  const prompt = getPromptForScenario(scenario, {
    customerName,
    companyName,
    amount: mrr,
    mrr,
    planName: 'Enterprise SaaS',
  });

  const finalPrompt = playbook
    ? `${playbook.prompt_template}\\n\\nContext:\\n${prompt}`
    : prompt;

  // Persist log
  const logRecord = await store.addLog({
    customerName,
    companyName,
    phone,
    scenario,
    mrr,
    prompt: finalPrompt,
    variantId: playbook?.id,
  } as any);

  // Fire-and-forget: start real CALL-E call, then poll for completion
  if (process.env.NODE_ENV !== 'test') {
    (async () => {
      try {
        console.log(`[Simulator] Starting real CALL-E call to ${phone}...`);

        const startResult = await calleService.startCall({
          goal: finalPrompt,
          phone,
          language: 'English',
          region: 'NG',
          timezone: 'Africa/Lagos',
        });

        await store.updateLog(logRecord.id!, {
          callRunId: startResult.runId,
          status: 'in_progress',
          outcome: `Call initiated — run_id: ${startResult.runId}`,
        });

        // ── A/B analytics: record which playbook variant this call used (#18) ──
        await analyticsService.recordVariantForCall(playbook, {
          scenario,
          callId: startResult.runId,
          customerName,
          mrr: Number(mrr) || 0,
        });

        console.log(`[Simulator] Call started: ${startResult.runId}. Polling for completion...`);

        const finalStatus = await calleService.waitForCompletion(startResult.runId, {
          pollIntervalMs: 10000,
          maxWaitMs: 300000,
          timezone: 'Africa/Lagos',
        });

        const outcomeText = finalStatus.summary || finalStatus.message || finalStatus.status;
        const callCompleted = finalStatus.status === 'COMPLETED';
        await store.updateLog(logRecord.id!, {
          status: callCompleted ? 'completed' : 'failed',
          outcome: outcomeText,
          ...(finalStatus.transcript ? { prompt: finalStatus.transcript } : {}),
        });

        // ── A/B analytics: record the final outcome (#18) ──
        await analyticsService.recordVariantOutcome(startResult.runId, callCompleted ? 'recovered' : 'failed');

        await slackService.sendCallNotification({
          customerName,
          companyName,
          phone,
          scenario,
          mrr,
          outcome: callCompleted ? 'recovered' : 'failed',
          transcript: finalStatus.transcript || undefined,
          callId: startResult.runId,
        });

        console.log(`[Simulator] Call ${finalStatus.status}: ${outcomeText}`);
      } catch (err: any) {
        console.error(`[Simulator Pipeline Error]: ${err.message}`);
        await store.updateLog(logRecord.id!, { status: 'failed', outcome: `Error: ${err.message}` });
      }
    })();
  }

  res.status(202).json({
    success: true,
    message: 'Simulation started — real CALL-E call in progress',
    data: {
      logId: logRecord.id,
    }
  });
});
