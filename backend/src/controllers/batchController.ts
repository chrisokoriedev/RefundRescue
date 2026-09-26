import { Request, Response } from 'express';
import { store } from '../services/recoveryStore.js';
import { calleService } from '../services/calleService.js';
import { asyncErrorWrapper } from '../middleware/errorHandler.js';
import { getPromptForScenario } from '../services/promptBuilder.js';
import { playbookService } from '../services/playbookService.js';

export interface BatchRecipientInput {
  customerName: string;
  phone: string;
  mrr: number;
  churnType: string;
  companyName: string;
}

export const triggerBatchCall = asyncErrorWrapper(async (req: Request, res: Response) => {
  const { recipients, goal } = req.body as { recipients: BatchRecipientInput[]; goal?: string };

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ success: false, message: 'Recipients array is required and must not be empty' });
  }

  // Common goal across the batch if not provided
  let batchGoal = goal || "Call these customers to resolve their recent billing or subscription issues.";

  // Pre-process recipients and add logs
  const calleRecipients = [];
  const logIds = [];

  for (const r of recipients) {
    const scenario = r.churnType === 'voluntary' ? 'subscription_canceled' : 'payment_failed';
    const playbook = await playbookService.selectActivePlaybookVariant(scenario);
    const prompt = getPromptForScenario(scenario, {
      customerName: r.customerName,
      companyName: r.companyName,
      amount: r.mrr,
      mrr: r.mrr,
      planName: 'Enterprise SaaS',
    });
    
    const finalPrompt = playbook ? `${playbook.prompt_template}\\n\\nContext:\\n${prompt}` : prompt;

    const logRecord = await store.addLog({
      customerName: r.customerName,
      companyName: r.companyName,
      phone: r.phone,
      scenario,
      mrr: r.mrr,
      prompt: finalPrompt,
      variantId: playbook?.id,
    } as any);

    logIds.push(logRecord.id);

    calleRecipients.push({
      phone: r.phone,
      language: 'English',
      region: 'US', // fallback to US or NG based on logic
    });
  }

  try {
    console.log(`[BatchController] Starting real CALL-E batch call for ${recipients.length} recipients...`);

    const startResult = await calleService.startBatchCall({
      goal: batchGoal,
      recipients: calleRecipients,
    });

    // Update all logs with the batch call Run ID
    for (const id of logIds) {
      await store.updateLog(id!, {
        callRunId: startResult.runId,
        status: 'in_progress',
        outcome: `Batch Call initiated — run_id: ${startResult.runId}`,
      });
    }

    res.status(202).json({
      success: true,
      message: 'Batch simulation started — CALL-E batch call in progress',
      data: {
        runId: startResult.runId,
        logIds,
      }
    });

  } catch (err: any) {
    console.error(`[BatchController Pipeline Error]: ${err.message}`);
    for (const id of logIds) {
      await store.updateLog(id!, { status: 'failed', outcome: `Error: ${err.message}` });
    }
    return res.status(500).json({ success: false, message: `Batch call failed: ${err.message}` });
  }
});
