import express, { Request, Response } from 'express';
import { store } from '../services/recoveryStore.js';
import { calleService } from '../services/calleService.js';
import { getPromptForScenario } from '../services/promptBuilder.js';
import { playbookService } from '../services/playbookService.js';
import { slackService } from '../services/slackService.js';
import { analyticsService } from '../services/analyticsService.js';
import { smsService } from '../services/smsService.js';
import { config } from '../config/index.js';
import { asyncErrorWrapper } from '../middleware/errorHandler.js';
import { emitCallStarted, emitCallCompleted, emitMetricsUpdate, emitCallStatusUpdate } from '../services/websocketService.js';

const router = express.Router();

router.post('/webhook/stripe', asyncErrorWrapper(async (req: Request, res: Response) => {
  const { customerName, phone, email, mrr, hasSavedCard, eventType } = req.body;
  
  const scenario = eventType === 'customer.subscription.deleted' ? 'subscription_canceled' : 'payment_failed';
  
  const playbook = await playbookService.selectActivePlaybookVariant(scenario);
  const prompt = getPromptForScenario(scenario, {
    customerName,
    companyName: 'RevRescue Client',
    amount: mrr,
    mrr,
    planName: 'Enterprise SaaS',
    phone,
    hasSavedCard
  });

  const finalPrompt = playbook
    ? `${playbook.prompt_template}\\n\\nContext:\\n${prompt}`
    : prompt;

  const logRecord = await store.addLog({
    customerName,
    companyName: 'RevRescue Client',
    phone,
    scenario,
    mrr,
    prompt: finalPrompt,
    variantId: playbook?.id,
    stripeEventId: `mock_evt_${Date.now()}`
  } as any);

  // For testing mock, we won't delay by 12 hours. We will execute immediately.
  res.status(202).json({
    success: true,
    message: 'Mock webhook received, executing call immediately...',
    data: { logId: logRecord.id }
  });

  // Execute async
  try {
    console.log(`[Mock Pipeline] Starting CALL-E call to ${phone}...`);
    
    // Simulate email if no saved card
    if (!hasSavedCard) {
      const checkoutUrl = `${config.frontendUrl}/mock/checkout/${logRecord.id}`;
      console.log(`[Mock Email] 📧 Sending mock checkout link to ${email}: ${checkoutUrl}`);
      // ── SMS fallback: also text the customer the payment link (#13) ──
      await smsService.sendPaymentLink(phone, Number(mrr) || 0, checkoutUrl, {
        customerName,
        scenario,
      });
    }

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
    
    emitCallStarted({
      callId: startResult.runId,
      customerName,
      phone,
      scenario,
      mrr,
      status: 'in_progress',
      timestamp: new Date().toISOString()
    });

    // ── A/B analytics: record which playbook variant this call used (#18) ──
    await analyticsService.recordVariantForCall(playbook, {
      scenario,
      callId: startResult.runId,
      customerName,
      mrr: Number(mrr) || 0,
    });

  } catch (err: any) {
    console.error(`[Mock Pipeline Error]: ${err.message}`);
    await store.updateLog(logRecord.id!, { status: 'failed', outcome: `Error: ${err.message}` });
  }
}));

router.post('/checkout/complete', asyncErrorWrapper(async (req: Request, res: Response) => {
  const { logId } = req.body;
  const logs = await store.getLogs();
  const logRecord = logs.find(l => l.id === logId);

  if (!logRecord) {
    return res.status(404).json({ success: false, message: 'Log not found' });
  }

  await store.updateLog(logId, {
    status: 'recovered',
    outcome: 'Paid via Mock Checkout Page'
  });

  // ── A/B analytics: mark the variant call as recovered (#18) ──
  if (logRecord.callRunId) {
    await analyticsService.recordVariantOutcome(logRecord.callRunId, 'recovered');
  }

  await slackService.sendCallNotification({
    customerName: logRecord.customerName,
    companyName: logRecord.companyName,
    phone: logRecord.phone,
    scenario: logRecord.scenario,
    mrr: logRecord.mrr,
    outcome: 'recovered',
    callId: 'mock_checkout',
  });

  emitCallCompleted({
    callId: 'mock_checkout',
    customerName: logRecord.customerName,
    phone: logRecord.phone,
    scenario: logRecord.scenario,
    mrr: logRecord.mrr,
    status: 'recovered',
    outcome: 'Paid via Mock Checkout Page',
    timestamp: new Date().toISOString()
  });

  const metrics = await store.getMetrics();
  emitMetricsUpdate({
    totalCalls: metrics.totalCalls,
    recovered: metrics.successfulRecoveries,
    failed: metrics.failedRecoveries,
    recoveredMRR: metrics.recoveredRevenue,
  });

  res.status(200).json({ success: true, message: 'Mock payment successful' });
}));

export default router;
