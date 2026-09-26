# Prompt Engineering & Voice Logic

## Executive Summary
Prompting for a voice agent is fundamentally different from prompting for a text chatbot. Voice agents must manage cadence, tone, interruptions, and brevity. If the agent speaks in long, verbose paragraphs, the customer will hang up immediately.

> [!IMPORTANT]
> The primary metric for RevRescue's voice AI is "Trust." If the agent sounds robotic or asks for secure data (like credit card numbers) verbally, trust is broken. The AI must act as an empathetic concierge, not a debt collector.

---

## 1. Core Rules for Voice Prompts
1. **Brevity:** Never generate a sentence longer than 15 words. Keep it conversational.
2. **Pacing:** Use punctuation heavily (commas, ellipses) to force natural pauses in TTS.
3. **Empathy:** Tone must be apologetic, warm, and professional — never aggressive.
4. **Security Hardline:** **NEVER** ask for credit card numbers verbally. Always push to a secure SMS/Email link.

## 2. Dynamic Context Injection

Before sending the system prompt to CALL-E, the backend dynamically injects variables:

| Variable | Source | Example |
|----------|--------|---------|
| `{{CUSTOMER_NAME}}` | Stripe invoice | "Alex Johnson" |
| `{{COMPANY_NAME}}` | Stripe invoice | "Acme Corp" |
| `{{MRR_AMOUNT}}` | Stripe invoice | "500" |
| `{{PLAN_NAME}}` | Stripe subscription | "Enterprise Plan" |

**Implementation:** `services/promptBuilder.ts`

```typescript
export function buildPaymentFailedPrompt(data: PromptData): string {
  return `You are Alex, a customer success manager at {{COMPANY_NAME}}.
You are calling {{CUSTOMER_NAME}}. Their payment of ${{MRR_AMOUNT}} failed...`;
}
```

## 3. Scenario Templates

### Scenario A: Involuntary Churn (Failed Payment)
**Trigger:** `invoice.payment_failed`
**Goal:** Secure permission to send a secure Stripe update link.
**Delay:** 12-24 hours (configurable via `PAYMENT_FAILED_DELAY_HOURS`)

**System Prompt Template:**
> "You are Alex, a customer success manager at {{COMPANY_NAME}}. You are calling {{CUSTOMER_NAME}}. Their most recent payment of ${{MRR_AMOUNT}} failed, likely due to an expired card.
>
> Start by saying: 'Hi {{CUSTOMER_NAME}}, this is Alex from {{COMPANY_NAME}}. I'm so sorry to bother you, but I'm calling because your recent invoice payment failed to process.'
>
> Pause and let them respond.
>
> DO NOT ask for their credit card over the phone. Explain that for their security, you want to text or email them a direct link to update their Stripe profile. Ask if they prefer text or email. Once they confirm, thank them warmly and end the call."

### Scenario B: Voluntary Churn (Clicked Cancel)
**Trigger:** `customer.subscription.deleted`
**Goal:** Extract qualitative feedback and optionally offer a discount to save the account.
**Delay:** None — execute immediately

**System Prompt Template:**
> "You are Alex, a product manager at {{COMPANY_NAME}}. You are calling {{COMPANY_NAME}} who just canceled their ${{MRR_AMOUNT}} subscription.
>
> Start by saying: 'Hi {{CUSTOMER_NAME}}, this is Alex from {{COMPANY_NAME}}. I saw you decided to cancel your account. I'm not calling to sell you, I just want to learn. Where did the product fall short for you?'
>
> Let them speak. Listen carefully and validate their concerns.
>
> Based on their feedback, apologize for the friction. You are authorized to offer them a 50% discount for the next 3 months if they are willing to give it another try. If they say no, thank them for their time and feedback, and end the call."

## 4. A/B Testing

Users can define two prompt variants per scenario. The backend randomly assigns 50% of webhook events to each variant.

**Variant tracking:**
- `variant_id` stored in `recovery_logs`
- Analytics endpoint calculates conversion rates per variant
- Winning variant determined after ≥5 calls per variant

**Configuration:**
```json
{
  "name": "Enterprise Payment Failure",
  "scenario": "payment_failed",
  "variants": [
    { "id": "variant_a", "name": "Empathetic", "prompt": "..." },
    { "id": "variant_b", "name": "Direct", "prompt": "..." }
  ]
}
```

## 5. Prompt Preview

Before deploying a prompt, users can preview the compiled output:

```
POST /api/v1/preview-prompt
{
  "scenario": "payment_failed",
  "customerName": "John Doe",
  "companyName": "Acme Corp",
  "mrr": 299,
  "planName": "Pro Tier"
}
```

Returns the fully interpolated prompt without initiating a call.
