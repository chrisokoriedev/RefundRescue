import { z } from 'zod';

// ── Shared constants ──
const SCENARIO_ENUM = z.enum(['payment_failed', 'subscription_canceled']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Create Playbook ──
export const createPlaybookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or fewer'),
  scenario: SCENARIO_ENUM,
  prompt_template: z
    .string()
    .min(10, 'Prompt template must be at least 10 characters')
    .max(10000, 'Prompt template must be 10,000 characters or fewer'),
  weight: z
    .number()
    .int('Weight must be an integer')
    .min(0, 'Weight must be between 0 and 100')
    .max(100, 'Weight must be between 0 and 100')
    .optional()
    .default(50),
  active: z.boolean().optional().default(true),
});

export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;

// ── Update Playbook (all fields optional) ──
export const updatePlaybookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must be 255 characters or fewer')
    .optional(),
  scenario: SCENARIO_ENUM.optional(),
  prompt_template: z
    .string()
    .min(10, 'Prompt template must be at least 10 characters')
    .max(10000, 'Prompt template must be 10,000 characters or fewer')
    .optional(),
  weight: z
    .number()
    .int('Weight must be an integer')
    .min(0, 'Weight must be between 0 and 100')
    .max(100, 'Weight must be between 0 and 100')
    .optional(),
  active: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;

// ── Route Params ──
export const playbookIdParamSchema = z.object({
  id: z.string().regex(UUID_REGEX, 'Invalid playbook ID format'),
});
