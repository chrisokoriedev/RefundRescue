import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getPromptForScenario } from '../services/promptBuilder.js';
import { calleService } from '../services/calleService.js';
import { store } from '../services/recoveryStore.js';
import { playbookService, type PlaybookVariant } from '../services/playbookService.js';
import { slackService } from '../services/slackService.js';
import { config } from '../config/index.js';
import { asyncErrorWrapper, AppError } from '../middleware/errorHandler.js';
import { CalleWebhookInput } from '../validators/api.schema.js';
import { retryQueue } from '../services/retryQueue.js';
import { analyticsService } from '../services/analyticsService.js';
import { createPaymentLink, updateCustomerMetadata, updateInvoiceMetadata } from '../services/stripeMetrics.js';
import { smsService } from '../services/smsService.js';
import { emitCallStarted, emitCallCompleted, emitCallStatusUpdate, emitMetricsUpdate, emitVariantResult } from '../services/websocketService.js';

// Lazy-init Stripe client — overridable for tests via _overrideStripeClient
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }
  return stripeClient;
}

/** Allow tests to inject a mock Stripe client */
export function _overrideStripeClient(client: Stripe) {
  stripeClient = client;
}

/** Execute the voice recovery pipeline for a given log record */
async function executeRecoveryPipeline(logRecord: any, customerName: string, companyName: string, phone: string, scenario: string, mrr: number, finalPrompt: string, playbook: PlaybookVariant | null = null) {
  try {
    console.log(`[RevRescue Pipeline] Starting real CALL-E call to ${phone}...`);

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
      mrr,
    });

    const metrics = await store.getMetrics();
    emitMetricsUpdate({
      totalCalls: metrics.totalCalls,
      recovered: metrics.successfulRecoveries,
      failed: metrics.failedRecoveries,
      recoveredMRR: metrics.recoveredRevenue,
    });

    console.log(`[RevRescue Pipeline] Call started: ${startResult.runId}. Webhook will handle completion.`);
  } catch (err: any) {
    console.error(`[RevRescue Pipeline Error]: ${err.message}`);
    await store.updateLog(logRecord.id!, { status: 'failed', outcome: `Error: ${err.message}` });

    // Enqueue for retry (#7)
    retryQueue.enqueue(logRecord.id!, { goal: finalPrompt, phone, language: 'English', region: 'NG', timezone: 'Africa/Lagos' }, err.message);
  }
}

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ success: false, message: 'Webhook Error: Missing stripe-signature header' });
  }

  // ── Step 1: Cryptographic signature verification ──
  let event: Stripe.Event;
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error(`[Webhook Signature Verification FAILED]: ${err.message}`);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook Verified]: Event ID: ${event.id} | Type: ${event.type}`);

  // ── Step 2: Idempotency check ──
  const alreadyProcessed = await store.hasEventBeenProcessed(event.id);
  if (alreadyProcessed) {
    console.log(`[Idempotency] Event ${event.id} already processed. Returning 200 OK.`);
    return res.status(200).json({ success: true, message: 'Event already processed', data: { received: true } });
  }

  // ── Step 3: Route to the correct churn workflow ──
  let customerName = 'Valued Customer';
  let companyName = 'RevRescue Client';
  let phone = '+1 (555) 019-2831';
  let mrr = 500;
  let scenario = 'payment_failed';
  let isPaymentFailed = false;
  let stripeCustomerId: string | undefined;
  let stripeInvoiceId: string | undefined;

  if (event.type === 'invoice.payment_failed') {
    isPaymentFailed = true;
    scenario = 'payment_failed';
    const invoice = event.data?.object as Stripe.Invoice;
    customerName = invoice.customer_name || invoice.customer_email || customerName;
    mrr = invoice.amount_due ? invoice.amount_due / 100 : mrr;
    if (invoice.customer_phone) phone = invoice.customer_phone;
    stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
    stripeInvoiceId = invoice.id;
  } else if (event.type === 'customer.subscription.deleted') {
    scenario = 'subscription_canceled';
    const sub = event.data?.object as Stripe.Subscription;
    customerName = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || customerName;
    const firstItem = sub.items?.data?.[0];
    mrr = firstItem?.plan?.amount ? firstItem.plan.amount / 100 : mrr;
    stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer as any)?.id;
  }

  // ── Step 4: Fetch missing phone from Stripe API (#2) ──
  if (phone === '+1 (555) 019-2831' && event.type === 'invoice.payment_failed') {
    try {
      const invoice = event.data?.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
      if (customerId) {
        const customer = await getStripe().customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.deleted && customer.phone) {
          phone = customer.phone;
        }
      }
    } catch (err: any) {
      console.warn(`[Stripe] Failed to fetch customer phone: ${err.message}`);
    }
  }

  // ── Step 5: A/B Test Playbook Selection ──
  const playbook = await playbookService.selectActivePlaybookVariant(scenario);

  const prompt = getPromptForScenario(scenario, {
    customerName,
    companyName,
    amount: mrr,
    planName: 'Enterprise SaaS',
    mrr
  });

  const finalPrompt = playbook
    ? `${playbook.prompt_template}\\n\\nContext:\\n${prompt}`
    : prompt;

  // ── Step 6: Persist log with timestamps (#10) ──
  const logRecord = await store.addLog({
    customerName,
    companyName,
    phone,
    scenario,
    mrr,
    prompt: finalPrompt,
    variantId: playbook?.id,
    stripeEventId: event.id,
    stripeCustomerId,
    stripeInvoiceId
  } as any);

  // ── Step 7: Delay payment_failed calls by 12-24 hours (#1) ──
  if (isPaymentFailed && process.env.NODE_ENV !== 'test') {
    const delayMs = config.paymentFailedDelayHours * 60 * 60 * 1000;
    console.log(`[RevRescue Pipeline] Payment failed — delaying call by ${config.paymentFailedDelayHours} hours. Event: ${event.id}`);

    await store.updateLog(logRecord.id!, {
      status: 'scheduled',
      outcome: `Call scheduled in ${config.paymentFailedDelayHours} hours`,
    });

    setTimeout(() => {
      executeRecoveryPipeline(logRecord, customerName, companyName, phone, scenario, mrr, finalPrompt, playbook);
    }, delayMs);
  } else if (process.env.NODE_ENV !== 'test') {
    // ── Subscription canceled: execute immediately ──
    executeRecoveryPipeline(logRecord, customerName, companyName, phone, scenario, mrr, finalPrompt, playbook);
  }

  // ── Always return 200 immediately ──
  res.status(200).json({
    success: true,
    message: isPaymentFailed
      ? `RevRescue Voice Agent scheduled for ${customerName} (delay: ${config.paymentFailedDelayHours}h)`
      : `RevRescue Voice Agent triggered for ${customerName}`,
    data: {
      received: true,
      recordId: logRecord.id,
      scheduled: isPaymentFailed,
      delayHours: isPaymentFailed ? config.paymentFailedDelayHours : 0,
    }
  });
};

// ── CALL-E Webhook ──
export const handleCalleWebhook = asyncErrorWrapper(async (req: Request, res: Response) => {
  const payload = req.body as CalleWebhookInput;

  console.log(`[CALL-E Webhook] Received: call_id=${payload.call_id} status=${payload.status}`);

  const logs = await store.getLogs();
  const logRecord = logs.find(
    (log) => log.callRunId === payload.call_id || log.callRunId === payload.run_id
  );

  if (!logRecord) {
    console.warn(`[CALL-E Webhook] No log found for call_id=${payload.call_id}. Skipping update.`);
    return res.status(200).json({ success: true, message: 'No matching log found', data: { received: true } });
  }

  const terminalStatuses = ['COMPLETED', 'FAILED', 'NO_ANSWER', 'DECLINED', 'CANCELED', 'CANCELLED', 'VOICEMAIL', 'BUSY', 'EXPIRED'];
  const upperStatus = payload.status.toUpperCase();
  const isTerminal = terminalStatuses.includes(upperStatus);

  const isSuccess = upperStatus === 'COMPLETED';
  const outcomeText = payload.summary || payload.extracted_data?.outcome || payload.status;

  await store.updateLog(logRecord.id!, {
    status: isSuccess ? 'recovered' : isTerminal ? 'failed' : 'in_progress',
    outcome: outcomeText,
    ...(payload.transcript ? { prompt: payload.transcript } : {}),
  });

  if (isTerminal) {
    const outcome = isSuccess ? 'recovered' : 'failed';

    // ── A/B analytics: record the final outcome for the tracked variant (#18) ──
    const trackedCallIds = [logRecord.callRunId, payload.call_id, payload.run_id].filter(Boolean) as string[];
    for (const callId of new Set(trackedCallIds)) {
      await analyticsService.recordVariantOutcome(callId, outcome);
    }

    // ── Live A/B result: push the winner signal to the dashboard (#18) ──
    if (logRecord.variantId) {
      const variant = await playbookService.getPlaybook(logRecord.variantId);
      emitVariantResult({
        variantId: logRecord.variantId,
        variantName: variant?.name || 'Unknown Variant',
        scenario: logRecord.scenario,
        outcome,
        callId: logRecord.callRunId || payload.call_id,
      });
    }

    // ── Stripe metrics export: push the recovery outcome back to Stripe (#19) ──
    if (logRecord.stripeCustomerId) {
      await updateCustomerMetadata(logRecord.stripeCustomerId, {
        totalRecoveries: 1,
        recoveredMRR: isSuccess ? logRecord.mrr : 0,
        lastRecoveryDate: isSuccess ? new Date().toISOString() : undefined,
        churnPreventionScore: isSuccess ? 95 : 55,
      });
    }
    if (logRecord.stripeInvoiceId) {
      await updateInvoiceMetadata(logRecord.stripeInvoiceId, {
        recovered: isSuccess,
        recoveryMethod: 'voice_agent',
        callDuration: payload.duration_seconds,
        callId: payload.call_id,
      });
    }

    // ── SMS fallback: text the customer a one-click payment link on failure (#13) ──
    if (!isSuccess && logRecord.scenario === 'payment_failed' && logRecord.phone) {
      const paymentUrl = await createPaymentLink({
        customerId: logRecord.stripeCustomerId,
        invoiceId: logRecord.stripeInvoiceId,
        amount: logRecord.mrr,
      });
      await smsService.sendPaymentLink(logRecord.phone, logRecord.mrr, paymentUrl, {
        customerName: logRecord.customerName,
        scenario: logRecord.scenario,
      });
    }

    await slackService.sendCallNotification({
      customerName: logRecord.customerName,
      companyName: logRecord.companyName,
      phone: logRecord.phone,
      scenario: logRecord.scenario,
      mrr: logRecord.mrr,
      outcome,
      transcript: payload.transcript || undefined,
      callDuration: payload.duration_seconds || undefined,
      callId: payload.call_id,
    });

    console.log(`[CALL-E Webhook] Call ${payload.status}: ${outcomeText}`);
    
    emitCallCompleted({
      callId: payload.call_id,
      customerName: logRecord.customerName,
      phone: logRecord.phone,
      scenario: logRecord.scenario,
      mrr: logRecord.mrr,
      status: outcome,
      outcome: outcomeText,
      transcript: payload.transcript || undefined,
      timestamp: new Date().toISOString()
    });
  } else {
    emitCallStatusUpdate({
      callId: payload.call_id,
      customerName: logRecord.customerName,
      phone: logRecord.phone,
      scenario: logRecord.scenario,
      mrr: logRecord.mrr,
      status: 'in_progress',
      outcome: outcomeText,
      timestamp: new Date().toISOString()
    });
  }

  const metrics = await store.getMetrics();
  emitMetricsUpdate({
    totalCalls: metrics.totalCalls,
    recovered: metrics.successfulRecoveries,
    failed: metrics.failedRecoveries,
    recoveredMRR: metrics.recoveredRevenue,
  });

  res.status(200).json({
    success: true,
    message: `Call ${payload.status} for ${logRecord.customerName}`,
    data: {
      received: true
    }
  });
});
