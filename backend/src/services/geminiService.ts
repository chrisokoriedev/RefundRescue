import { GoogleGenAI } from '@google/genai';
import { PolicyContext, PolicyPreCheckResult } from './policyEngine.js';
import { GuardrailScanResult, isUnintelligible } from './guardrailService.js';
import { CircuitBreaker, retryWithBackoff, withTimeout, TimeoutError } from '../utils/resilience.js';

// Model is configurable so a Gemini deprecation never breaks the app silently:
// set GEMINI_MODEL in .env to override the default.
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const CANDIDATE_MODELS = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));

// ── Resilience configuration for the Gemini downstream ──
const LLM_TIMEOUT_MS = 15_000;      // 15s deadline per Gemini call
const LLM_RETRY_ATTEMPTS = 2;      // retries per model

// Circuit breaker: 5 failures within 60s opens the circuit for 20s.
const geminiBreaker = new CircuitBreaker({
  name: 'gemini-flash',
  failureThreshold: 5,
  windowMs: 60_000,
  cooldownMs: 20_000,
  onStateChange: (from, to) => {
    console.warn(`[CircuitBreaker] gemini-flash: ${from} → ${to}${to === 'OPEN' ? ' — falling back to heuristic engine' : ''}`);
  }
});

/** Exposed for health/metrics endpoints */
export function getGeminiCircuitStats() {
  return geminiBreaker.getStats();
}

export interface AIDeliberationOutput {
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedPolicies: string[];
  reasoning: string;
  customerResponse: string;
  actionItems: string[];
  engineUsed: 'GEMINI_FLASH' | 'HEURISTIC_FALLBACK';
  adminAlert?: string;
}

export interface DeliberationInput {
  customerInput: string;
  context: PolicyContext;
  preCheck: PolicyPreCheckResult;
  guardrail: GuardrailScanResult;
  dialogueHistory?: string;
  isAutoResume?: boolean;
}

export async function deliberateRefundWithAI(input: DeliberationInput): Promise<AIDeliberationOutput> {
  const { customerInput, context, preCheck, guardrail, dialogueHistory } = input;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. If guardrail detected prompt injection, force escalate with high risk immediately
  if (guardrail.isFlagged) {
    return {
      decision: 'ESCALATED',
      confidenceScore: 0.99,
      riskLevel: 'HIGH',
      matchedPolicies: ['POL-005'],
      reasoning: `Prompt injection / adversarial pattern detected in customer input: [${guardrail.matchedPatterns.join(', ')}]. Blocked automated approval.`,
      customerResponse: 'Your refund request has been received and escalated to our human security and support supervisor team for manual verification. A specialist will follow up with you via email within 24 hours.',
      actionItems: ['FLAG_SECURITY_AUDIT', 'NOTIFY_SUPERVISOR_QUEUE', 'HOLD_TRANSACTION'],
      engineUsed: 'HEURISTIC_FALLBACK',
      adminAlert: 'Security Guardrail Flag: Prompt injection attempt detected. Blocked automated processing.'
    };
  }

  // 2. If in unit test environment, bypass live network call to avoid quota consumption and test timeouts
  if (process.env.NODE_ENV === 'test') {
    return generateHeuristicDeliberation(customerInput, context, preCheck, dialogueHistory);
  }

  // 2. Try Gemini Live API across candidate models if key is present AND the circuit allows it
  if (apiKey && apiKey !== 'mock_key_not_set' && geminiBreaker.canCall()) {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildGeminiPrompt(customerInput, context, preCheck, dialogueHistory);

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await geminiBreaker.execute(() =>
          retryWithBackoff(
            () => withTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: prompt,
                config: {
                  responseMimeType: 'application/json',
                  temperature: 0.2
                }
              }),
              LLM_TIMEOUT_MS,
              `gemini-${modelName}`
            ),
            {
              attempts: LLM_RETRY_ATTEMPTS,
              baseDelayMs: 250,
              onRetry: (err, attempt, delayMs) => {
                console.warn(`[LLM] Gemini (${modelName}) attempt ${attempt} failed, retrying in ${delayMs}ms: ${err instanceof Error ? err.message : err}`);
              }
            }
          )
        );

        const responseText = response.text?.trim() || '';
        if (responseText) {
          const parsed = JSON.parse(responseText);
          const confidence = typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.90;
          const decision = parsed.decision || (preCheck.outcome === 'POTENTIAL_APPROVAL' ? 'APPROVED' : preCheck.outcome);

          let adminAlert = parsed.adminAlert;
          if (!adminAlert && (confidence < 0.75 || decision === 'ESCALATED')) {
            adminAlert = `I'm not confident about this one: ${parsed.reasoning || 'Requires manual review'}. Can you take a look at it?`;
          }

          return {
            decision,
            confidenceScore: confidence,
            riskLevel: parsed.riskLevel || (decision === 'ESCALATED' ? 'MEDIUM' : 'LOW'),
            matchedPolicies: Array.isArray(parsed.matchedPolicies) ? parsed.matchedPolicies : (preCheck.matchedPolicies || []),
            reasoning: parsed.reasoning || `Evaluated via Google Gemini (${modelName}) reasoning against store policy.`,
            customerResponse: parsed.customerResponse || 'Your request has been processed.',
            actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : ['NOTIFY_CUSTOMER'],
            adminAlert,
            engineUsed: 'GEMINI_FLASH'
          };
        }
      } catch (err: any) {
        const detail = err instanceof TimeoutError
          ? `timed out after ${LLM_TIMEOUT_MS}ms`
          : err instanceof Error ? err.message : String(err);
        console.warn(`[LLM] Gemini deliberation with ${modelName} unavailable (${detail}). Trying next candidate model...`);
      }
    }
  }

  // 3. Smart Heuristic Fallback (Guarantees zero-failure and test reliability)
  return generateHeuristicDeliberation(customerInput, context, preCheck, dialogueHistory);
}

function buildGeminiPrompt(
  customerInput: string,
  context: PolicyContext,
  preCheck: PolicyPreCheckResult,
  dialogueHistory?: string
): string {
  return `You are RefundRescue's Senior AI Customer Support Specialist.
Evaluate the following customer message against store policies and order context.
${dialogueHistory ? `\nPREVIOUS CONVERSATION HISTORY SO FAR:\n${dialogueHistory}\n` : ''}
STORE POLICIES:
- POL-001: Final Sale items (is_final_sale = 1) CANNOT be refunded under any circumstance (Result: DENIED).
- POL-002: Orders older than 30 days cannot be refunded (Result: DENIED).
- POL-003: Requests exceeding $500 require human supervisor review (Result: ESCALATED).
- POL-004: Damaged, defective, or incorrect items within 30 days and <=$500 are eligible for APPROVAL.
- POL-005: Contradictory, suspicious, or unclear claims must be ESCALATED.

PRE-CHECK CODE STATUS: ${preCheck.outcome} (Matched: ${preCheck.matchedPolicies.join(', ') || 'None'})
${preCheck.reason ? `Pre-check failure reason: ${preCheck.reason}` : ''}

CUSTOMER: ${context.customer?.name || 'Customer'} (Loyalty: ${context.customer?.loyalty_tier || 'Standard'}, Past Refunds: ${context.customer?.past_refunds_count || 0})
ORDER ID: ${context.order.id} | Date: ${context.order.order_date} | Total: $${context.order.total_amount}
ORDER ITEMS: ${JSON.stringify(context.items.map(i => ({ name: i.product_name, price: i.unit_price, final_sale: i.is_final_sale })))}
CUSTOMER'S LATEST MESSAGE: "${customerInput}"

INSTRUCTIONS:
You must output strict JSON matching:
{
  "decision": "APPROVED" | "DENIED" | "ESCALATED",
  "confidenceScore": number between 0.0 and 1.0,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "matchedPolicies": string[],
  "reasoning": "Clear explanation citing policies for internal support staff",
  "customerResponse": "Compassionate, empathetic, professional response explaining outcome to customer",
  "actionItems": string[],
  "adminAlert": "Private note for admin if not fully confident: 'I\\'m not confident about this one: [reason]. Can you take a look at it?'"
}
- PRODUCT & AMOUNT INTEGRITY (CRITICAL):
  - Check whether the item the customer is complaining about actually exists in ORDER ITEMS: ${JSON.stringify(context.items.map(i => ({ name: i.product_name, price: i.unit_price, final_sale: i.is_final_sale })))}.
  - If the customer complains about a product that was NEVER purchased in this order (for example, customer claims a "TV display", "laptop", or "screen" when this order is for "Italian Wool Overcoat" or "Cookware"), this is an UNMATCHED / SUSPICIOUS claim. You MUST set decision: "ESCALATED", confidenceScore: 0.95, riskLevel: "HIGH", matchedPolicies: ["POL-005"], and explain that the claimed product does not match order #${context.order.id}.
  - If the customer claims an amount exceeding $500, or exceeding the order total ($${context.order.total_amount}), you MUST set decision: "ESCALATED" under POL-003.
  - If the customer makes contradictory statements (e.g. claiming box was sealed and empty, but also tore the lining, or never opened but broken inside), you MUST set decision: "ESCALATED" under POL-005.
- If customer gives a greeting (e.g. "hey", "hello", "hi", "heyye") or asks an inquiry without an explicit refund claim:
  Greet them warmly and helpfully! Do NOT approve a refund or reject them. Set decision: "ESCALATED", confidenceScore: 0.70, riskLevel: "LOW", and adminAlert: "I'm not confident about this one: Customer sent a general greeting/inquiry without an explicit refund claim yet. Can you take a look at it?".
- If code pre-check is DENIED or ESCALATED, you MUST NOT APPROVE. Explain the reason gently and empathetically.
- If genuine damage or defect is described for the actual ordered items within policy, approve with high empathy (POL-004).
- If you are ever not confident or the claim requires human review, set decision: "ESCALATED", confidenceScore < 0.75, and populate adminAlert with a private note for the admin explaining why you need their review.`;
}

function generateHeuristicDeliberation(
  customerInput: string,
  context: PolicyContext,
  preCheck: PolicyPreCheckResult,
  dialogueHistory?: string
): AIDeliberationOutput {
  const lowerMsg = customerInput.toLowerCase();
  const lowerHistory = (dialogueHistory || '').toLowerCase();

  // If deterministic pre-check denied (Final Sale or >30 Days)
  if (preCheck.outcome === 'DENIED') {
    if (preCheck.matchedPolicies.includes('POL-001')) {
      return {
        decision: 'DENIED',
        confidenceScore: 0.98,
        riskLevel: 'LOW',
        matchedPolicies: ['POL-001'],
        reasoning: 'Item is marked as Final Sale on clearance. Policy POL-001 explicitly bars cash refunds.',
        customerResponse: `We appreciate you reaching out! Because the item was purchased as a Final Sale clearance piece under our policy (POL-001), we are unable to process a direct refund. However, our customer care team is happy to provide care guidance or explore a 15% discount toward your next purchase.`,
        actionItems: ['SEND_FINAL_SALE_NOTICE', 'OFFER_LOYALTY_DISCOUNT'],
        engineUsed: 'HEURISTIC_FALLBACK'
      };
    }
    if (preCheck.matchedPolicies.includes('POL-002')) {
      return {
        decision: 'DENIED',
        confidenceScore: 0.95,
        riskLevel: 'LOW',
        matchedPolicies: ['POL-002'],
        reasoning: 'Order age exceeds 30-day policy return window (POL-002).',
        customerResponse: `Thank you for contacting us. We noticed this order was placed more than 30 days ago. Per our return policy (POL-002), orders outside this window cannot be refunded. We value your business and hope to assist you on future orders.`,
        actionItems: ['SEND_POLICY_EXPIRATION_NOTICE'],
        engineUsed: 'HEURISTIC_FALLBACK'
      };
    }
  }

  // If deterministic pre-check escalated (High-Value or Frequent Return Abuse)
  if (preCheck.outcome === 'ESCALATED') {
    if (preCheck.matchedPolicies.includes('POL-003')) {
      return {
        decision: 'ESCALATED',
        confidenceScore: 0.96,
        riskLevel: 'MEDIUM',
        matchedPolicies: ['POL-003'],
        reasoning: `High-value order ($${context.order.total_amount.toFixed(2)}) exceeds the $500 threshold under POL-003. Requires supervisor review.`,
        customerResponse: `Thank you for bringing this issue to our attention. Because this order total ($${context.order.total_amount.toFixed(2)}) is over $500.00, your case has been transferred to a senior customer support supervisor (POL-003) for expedited personal handling. A supervisor will review the details and reach out within 2-4 business hours.`,
        actionItems: ['ROUTE_TO_SENIOR_SUPERVISOR', 'SEND_PRIORITY_ESCALATION_EMAIL'],
        engineUsed: 'HEURISTIC_FALLBACK',
        adminAlert: `High-value order ($${context.order.total_amount.toFixed(2)}) requires human supervisor review per POL-003.`
      };
    }
    if (preCheck.matchedPolicies.includes('POL-005')) {
      return {
        decision: 'ESCALATED',
        confidenceScore: 0.91,
        riskLevel: 'HIGH',
        matchedPolicies: ['POL-005'],
        reasoning: `Account has excessive refund frequency (${context.customer?.past_refunds_count} refunds) or suspicious history under POL-005.`,
        customerResponse: `Your request has been routed to our accounts and review team for verification. We will review your account history and get back to you shortly.`,
        actionItems: ['FLAG_FRAUD_REVIEW', 'SUPERVISOR_QUEUE'],
        engineUsed: 'HEURISTIC_FALLBACK',
        adminAlert: `Account flagged for high refund velocity (${context.customer?.past_refunds_count} prior refunds).`
      };
    }
  }

  // Check for semantic damage / defect / incorrect item in message (POL-004)
  const isDamageOrDefect = /(shatter|broken|crack|chip|damage|defective|faulty|won't turn on|artifact|leak|wrong size|missing)/i.test(lowerMsg) || /(shatter|broken|crack|chip|damage|defective|faulty)/i.test(lowerHistory);

  // 1. Check for conversational greetings or general questions
  const isGreeting = /^(hey+|heyy+|heyye|hello+|hi+|good\s*(morning|afternoon|evening)|howdy)\b/i.test(customerInput.trim()) || /^(hey+|hi+|hello+)$/i.test(customerInput.trim());
  const isGeneralInquiry = /(how|what|tell me|info|information|know about|status|tracking|deliver|filter)/i.test(lowerMsg);

  if (isGreeting || (isGeneralInquiry && !isDamageOrDefect && !lowerMsg.includes('refund') && !lowerMsg.includes('return'))) {
    const custFirstName = context.customer?.name ? context.customer.name.split(' ')[0] : 'there';
    return {
      decision: 'ESCALATED',
      confidenceScore: 0.70,
      riskLevel: 'LOW',
      matchedPolicies: ['POL-005'],
      reasoning: 'Customer provided a greeting or general inquiry without an explicit refund claim yet.',
      customerResponse: `Hello ${custFirstName}! Thank you for contacting RefundRescue support. How can I assist you with order #${context.order.id} today?`,
      actionItems: ['AWAIT_CUSTOMER_DETAILS'],
      engineUsed: 'HEURISTIC_FALLBACK',
      adminAlert: "I'm not confident about this one: Customer sent a general greeting/inquiry without an explicit claim yet. Can you take a look at it?"
    };
  }

  // 2. Check for explicit amount in message > $500 (POL-003)
  const claimedAmtMatch = customerInput.match(/\$?(\d{3,}(?:\.\d{2})?)/);
  if (claimedAmtMatch) {
    const claimedVal = parseFloat(claimedAmtMatch[1]);
    if (claimedVal > 500) {
      return {
        decision: 'ESCALATED',
        confidenceScore: 0.95,
        riskLevel: 'HIGH',
        matchedPolicies: ['POL-003'],
        reasoning: `Claimed amount of $${claimedVal.toFixed(2)} exceeds the $500 automated threshold under POL-003.`,
        customerResponse: `Because your claimed amount ($${claimedVal.toFixed(2)}) exceeds our automated threshold of $500.00, your request has been routed to a human support specialist for personal review.`,
        actionItems: ['SUPERVISOR_QUEUE', 'HOLD_TRANSACTION'],
        engineUsed: 'HEURISTIC_FALLBACK',
        adminAlert: `High-value claim ($${claimedVal.toFixed(2)} > $500). Supervisor review required.`
      };
    }
  }

  // 3. Check for product mismatch against order line items (POL-005)
  const orderProductNames = (context.items || []).map(i => i.product_name.toLowerCase()).join(' ');
  const commonMismatches = [
    { name: 'TV / Display', keywords: ['tv', 'television', 'oled', 'screen', 'display'], orderHas: ['tv', 'oled', 'screen', 'display'] },
    { name: 'Cookware set', keywords: ['cookware', 'ceramic pot', 'pan lid'], orderHas: ['cookware', 'ceramic', 'pan'] },
    { name: 'Laptop / Computer', keywords: ['laptop', 'macbook', 'computer'], orderHas: ['laptop', 'macbook', 'computer'] },
    { name: 'Espresso machine', keywords: ['espresso', 'coffee maker'], orderHas: ['espresso', 'coffee'] },
    { name: 'Smartwatch', keywords: ['watch', 'smartwatch'], orderHas: ['watch'] },
    { name: 'Apparel / Coat', keywords: ['coat', 'jacket', 'overcoat', 'scarf', 'dress'], orderHas: ['coat', 'jacket', 'overcoat', 'scarf', 'dress'] }
  ];

  for (const mismatch of commonMismatches) {
    const claimedThis = mismatch.keywords.some(k => lowerMsg.includes(k));
    const orderHasThis = mismatch.orderHas.some(k => orderProductNames.includes(k));
    if (claimedThis && !orderHasThis) {
      return {
        decision: 'ESCALATED',
        confidenceScore: 0.94,
        riskLevel: 'HIGH',
        matchedPolicies: ['POL-005'],
        reasoning: `Customer claim refers to "${mismatch.name}", which is not among order #${context.order.id} items (${context.items.map(i => i.product_name).join(', ')}). Mismatched claim escalated under POL-005.`,
        customerResponse: `We noticed you mentioned an issue with ${mismatch.name}, but order #${context.order.id} contains ${context.items.map(i => i.product_name).join(', ')}. A support specialist is reviewing your account to ensure we assist with the correct purchase.`,
        actionItems: ['VERIFY_ORDER_ITEMS', 'SUPERVISOR_QUEUE'],
        engineUsed: 'HEURISTIC_FALLBACK',
        adminAlert: `Product mismatch: Customer claimed ${mismatch.name} but order contains ${context.items.map(i => i.product_name).join(', ')}.`
      };
    }
  }

  // 4. Check for contradiction (POL-005)
  const isContradiction = /(never opened.*broken|sealed.*shattered inside|empty box.*lining|box was empty.*tore|sealed.*empty.*tore|empty.*damaged inside|empty.*lining)/i.test(lowerMsg) ||
    (lowerMsg.includes('empty') && (lowerMsg.includes('tore') || lowerMsg.includes('torn') || lowerMsg.includes('lining') || lowerMsg.includes('broken')));

  if (isContradiction) {
    return {
      decision: 'ESCALATED',
      confidenceScore: 0.92,
      riskLevel: 'HIGH',
      matchedPolicies: ['POL-005'],
      reasoning: 'Customer statement contains conflicting or contradictory assertions regarding product and package state (e.g. box empty but item lining torn).',
      customerResponse: 'We have received your claim. Due to conflicting details regarding the packaging and item condition, we have forwarded your ticket to our senior customer relations team for review.',
      actionItems: ['REQUEST_ADDITIONAL_PHOTOS', 'SUPERVISOR_REVIEW'],
      engineUsed: 'HEURISTIC_FALLBACK',
      adminAlert: 'Contradictory claim: Conflicting statements regarding product condition and packaging.'
    };
  }

  const looksLikeGibberish = isUnintelligible(customerInput);

  if (looksLikeGibberish) {
    return {
      decision: 'ESCALATED',
      confidenceScore: 0.85,
      riskLevel: 'MEDIUM',
      matchedPolicies: ['POL-005'],
      reasoning: 'Customer message is unintelligible or unrelated to a refund request. Routed to human review under POL-005 rather than auto-approving an unclear claim.',
      customerResponse: 'We received your message but were not able to understand the details of your request. Could you describe the issue with your order in a little more detail? I have also flagged your ticket for a support specialist to review personally, just in case.',
      actionItems: ['REQUEST_CLARIFICATION', 'SUPERVISOR_QUEUE'],
      engineUsed: 'HEURISTIC_FALLBACK',
      adminAlert: "I'm not confident about this one: Message appears unintelligible or incomplete. Can you take a look at it?"
    };
  }

  // 5. Genuine damage or defect within policy window
  if (isDamageOrDefect) {
    return {
      decision: 'APPROVED',
      confidenceScore: 0.94,
      riskLevel: 'LOW',
      matchedPolicies: ['POL-004'],
      reasoning: 'Customer reported genuine product damage/defect on eligible order within 30-day window under POL-004.',
      customerResponse: `We are so sorry for the inconvenience! We have approved your refund request under policy POL-004. A prepaid return shipping label and confirmation details have been sent to your email. Your refund of $${context.order.total_amount.toFixed(2)} will be credited back to your original payment method upon drop-off.`,
      actionItems: ['GENERATE_PREPAID_LABEL', 'ISSUE_STORE_REFUND_CREDIT'],
      engineUsed: 'HEURISTIC_FALLBACK'
    };
  }

  // 6. Default when no clear damage/defect claim is stated: request clarification, DO NOT default-approve
  return {
    decision: 'ESCALATED',
    confidenceScore: 0.72,
    riskLevel: 'LOW',
    matchedPolicies: ['POL-005'],
    reasoning: 'Customer inquiry does not contain a specific defect or refund claim. Awaiting clarification from customer.',
    customerResponse: `Hello! How can I assist you with order #${context.order.id}? If you are experiencing an issue with your purchase, please describe the condition or reason for return so we can help.`,
    actionItems: ['AWAIT_CUSTOMER_DETAILS'],
    engineUsed: 'HEURISTIC_FALLBACK',
    adminAlert: "I'm not confident about this one: Customer message lacks a specific return/refund reason. Can you take a look at it?"
  };
}
