import { getDb } from '../db/sqlite.js';
import { scanForPromptInjection } from './guardrailService.js';
import { evaluateDeterministicPolicy } from './policyEngine.js';
import { deliberateRefundWithAI } from './geminiService.js';
import { v4 as uuidv4 } from 'uuid';

export interface RefundEvaluationRequest {
  customerId: string;
  orderId: string;
  message: string;
  requestedAmount?: number;
}

export interface RefundEvaluationResult {
  ticketId: string;
  orderId: string;
  customerId: string;
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedPolicies: string[];
  policyClauses: string[];
  reasoningSummary: string;
  customerResponse: string;
  promptInjectionDetected: boolean;
  actionItems: string[];
  engineUsed: string;
  createdAt: string;
}

export async function evaluateRefundRequest(request: RefundEvaluationRequest): Promise<RefundEvaluationResult> {
  const db = getDb();

  // 1. Fetch Customer
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(request.customerId) as any;
  if (!customer) {
    throw new Error(`Customer not found with id: ${request.customerId}`);
  }

  // 2. Fetch Order and Items
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(request.orderId) as any;
  if (!order) {
    throw new Error(`Order not found with id: ${request.orderId}`);
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(request.orderId) as any[];

  // 3. Stage 1: Security Guardrail Scanner
  const guardrail = scanForPromptInjection(request.message);

  // 4. Stage 2: Deterministic Policy Engine Pre-Check
  const requestedAmount = request.requestedAmount || order.total_amount;
  const preCheck = evaluateDeterministicPolicy({
    order,
    items,
    customer,
    requestedAmount
  });

  // 5. Stage 3: AI Deliberation (Gemini Flash or Heuristic Fallback)
  const aiResult = await deliberateRefundWithAI({
    customerInput: guardrail.sanitizedInput,
    context: {
      order,
      items,
      customer,
      requestedAmount
    },
    preCheck,
    guardrail
  });

  // 6. Stage 4: Post-Deliberation Verification Gate (Immutable Business Constraints)
  let finalDecision = aiResult.decision;
  if (preCheck.outcome === 'DENIED' && finalDecision === 'APPROVED') {
    finalDecision = 'DENIED';
  } else if (preCheck.outcome === 'ESCALATED' && finalDecision === 'APPROVED') {
    finalDecision = 'ESCALATED';
  }

  const matchedPolicies = Array.from(new Set([...preCheck.matchedPolicies, ...aiResult.matchedPolicies]));
  const ticketId = `TICK-${uuidv4().substring(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  // 7. Stage 5: Save to SQLite Database
  const insertTicket = db.prepare(`
    INSERT INTO refund_tickets (
      id, order_id, customer_id, requested_amount, reason, decision,
      confidence_score, customer_response, reasoning_summary, risk_level,
      prompt_injection_detected, policy_clauses, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTicket.run(
    ticketId,
    order.id,
    customer.id,
    requestedAmount,
    request.message,
    finalDecision,
    aiResult.confidenceScore,
    aiResult.customerResponse,
    aiResult.reasoning,
    aiResult.riskLevel,
    guardrail.isFlagged ? 1 : 0,
    JSON.stringify(matchedPolicies),
    now,
    now
  );

  // 8. Stage 6: Audit Log Entry
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const auditNote = guardrail.isFlagged
    ? `Flagged by Security Guardrail: ${guardrail.matchedPatterns.join(', ')}`
    : `Deliberated by ${aiResult.engineUsed} with outcome: ${finalDecision}`;

  insertAudit.run(`AUD-${uuidv4().substring(0, 8).toUpperCase()}`, ticketId, 'AI_SYSTEM', 'AUTO_EVALUATE', auditNote, now);

  return {
    ticketId,
    orderId: order.id,
    customerId: customer.id,
    decision: finalDecision,
    confidenceScore: aiResult.confidenceScore,
    riskLevel: aiResult.riskLevel,
    matchedPolicies,
    policyClauses: matchedPolicies,
    reasoningSummary: aiResult.reasoning,
    customerResponse: aiResult.customerResponse,
    promptInjectionDetected: guardrail.isFlagged,
    actionItems: aiResult.actionItems,
    engineUsed: aiResult.engineUsed,
    createdAt: now
  };
}
