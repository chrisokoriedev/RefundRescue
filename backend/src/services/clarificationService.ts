import { GoogleGenAI } from '@google/genai';
import { isUnintelligible } from './guardrailService.js';

// Model is configurable so a Gemini deprecation never breaks the app silently.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const CLARIFY_TIMEOUT_MS = 6_000;

export interface ClarificationResult {
  needsClarification: boolean;
  question?: string;
}

/**
 * Multi-turn stage 1: when the message is refund-related but too vague to judge
 * fairly (e.g. "it broke", "not happy"), ask ONE follow-up question instead of
 * escalating immediately. Hard-capped: after MAX_CLARIFICATIONS the flow must
 * decide — no endless back-and-forth.
 *
 * Deterministic short-circuit: flagrantly unintelligible input (gibberish,
 * injection-adjacent) skips the LLM and escalates via the normal pipeline.
 * Any LLM failure falls back to the heuristic rule below, so this stage can
 * never take the pipeline down.
 */
export const MAX_CLARIFICATIONS = 1;

export async function maybeAskClarification(
  message: string,
  clarificationCount: number
): Promise<ClarificationResult> {
  // Cap reached, or message is clearly out-of-bounds: let the main pipeline decide.
  if (clarificationCount >= MAX_CLARIFICATIONS) {
    return { needsClarification: false };
  }

  // Gibberish / unrelated: no clarification — escalate in the main evaluation.
  if (isUnintelligible(message)) {
    return { needsClarification: false };
  }

  // Vagueness heuristic: refund-related (passed isUnintelligible) but too thin
  // to evaluate — very short or no specifics beyond a generic complaint.
  const vague =
    message.trim().length < 25 ||
    /^(i want (a )?refund|i need (a )?refund|refund please|it broke|not happy|does not work|doesn't work|it is broken|item broken)$/i.test(message.trim());

  if (!vague) {
    return { needsClarification: false };
  }

  // Try Gemini for a natural, contextual follow-up question.
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'mock_key_not_set') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `A customer submitted this refund request: "${message}"
Write ONE short, friendly follow-up question (max 2 sentences) asking for the specific detail you would need to process this refund (what happened, when, what condition the item arrived in, etc.).
Output strict JSON: {"question": "..."}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      });

      const text = response.text?.trim() || '';
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.question && typeof parsed.question === 'string') {
          return { needsClarification: true, question: parsed.question };
        }
      }
    }
  } catch {
    // Fall through to deterministic question — never block the pipeline.
  }

  // Deterministic fallback question.
  return {
    needsClarification: true,
    question: 'Could you tell me a little more about what happened with your order? For example, what went wrong and when did you first notice it?'
  };
}
