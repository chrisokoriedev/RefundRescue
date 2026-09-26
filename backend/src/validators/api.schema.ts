import { z } from 'zod';

// ── Preview Prompt Request Body ──
export const previewPromptSchema = z.object({
  scenario: z.enum(['payment_failed', 'subscription_canceled'], {
    message: 'Scenario must be either "payment_failed" or "subscription_canceled"',
  }),
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name must be 255 characters or fewer'),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be 255 characters or fewer'),
  mrr: z
    .number()
    .positive('MRR must be a positive number')
    .max(1_000_000, 'MRR seems unreasonably high')
    .optional()
    .default(500),
  planName: z
    .string()
    .min(1, 'Plan name is required')
    .max(100, 'Plan name must be 100 characters or fewer')
    .optional()
    .default('Enterprise SaaS'),
});

export type PreviewPromptInput = z.infer<typeof previewPromptSchema>;

// ── Trigger Call (Simulator) Request Body ──
export const triggerCallSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name must be 255 characters or fewer'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(50, 'Phone number must be 50 characters or fewer'),
  mrr: z
    .number()
    .positive('MRR must be a positive number')
    .max(1_000_000, 'MRR seems unreasonably high')
    .optional()
    .default(500),
  churnType: z.enum(['involuntary', 'voluntary'], {
    message: 'Churn type must be either "involuntary" or "voluntary"',
  }),
  companyName: z
    .string()
    .max(255, 'Company name must be 255 characters or fewer')
    .optional()
    .default('RevRescue Client'),
});

export type TriggerCallInput = z.infer<typeof triggerCallSchema>;

// ── CALL-E Webhook Callback Body ──
export const calleWebhookSchema = z.object({
  call_id: z.string().min(1, 'call_id is required'),
  run_id: z.string().optional(),
  status: z.enum([
    'COMPLETED', 'FAILED', 'NO_ANSWER', 'DECLINED',
    'CANCELED', 'CANCELLED', 'VOICEMAIL', 'BUSY', 'EXPIRED',
    'completed', 'failed', 'no_answer', 'declined',
    'canceled', 'cancelled', 'voicemail', 'busy', 'expired',
  ], {
    message: 'Invalid call status',
  }),
  duration_seconds: z.number().nonnegative().optional(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  outcome: z.object({
    task_completed: z.boolean().optional(),
    completion_confidence: z.object({
      score: z.number().min(0).max(1).optional(),
      label: z.string().optional(),
    }).optional(),
    evidence: z.array(z.string()).optional(),
  }).optional(),
  extracted_data: z.object({
    outcome: z.string().optional(),
    churn_reason: z.string().optional(),
  }).optional(),
  customer_name: z.string().optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  scenario: z.string().optional(),
  mrr: z.number().optional(),
});

export type CalleWebhookInput = z.infer<typeof calleWebhookSchema>;
