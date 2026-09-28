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
  skipCustomerMessagePersist?: boolean;
  dialogueHistory?: string;
  isAutoResumeHandover?: boolean;
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
  adminAlert?: string;
  isHumanTakeover?: boolean;
  humanTakeoverActive?: boolean;
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

  // If a human specialist has taken over this conversation, do NOT run AI evaluation!
  const chatSession = getChatSession(request.orderId, request.customerId);
  if (!request.isAutoResumeHandover && chatSession.takeoverActive) {
    const savedCustMsg = sendCustomerChatMessage(request.orderId, request.customerId, request.message, chatSession.ticketId || undefined);
    return {
      ticketId: chatSession.ticketId || '',
      orderId: order.id,
      customerId: customer.id,
      decision: 'ESCALATED' as const,
      confidenceScore: 1.0,
      riskLevel: 'LOW' as const,
      matchedPolicies: [],
      policyClauses: [],
      reasoningSummary: 'Human specialist is currently managing this conversation directly. Message dispatched directly to specialist.',
      customerResponse: '',
      promptInjectionDetected: false,
      isHumanTakeover: true,
      humanTakeoverActive: true,
      actionItems: ['Human specialist active on live conversation'],
      engineUsed: 'human_specialist',
      createdAt: savedCustMsg.created_at
    };
  }

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
    guardrail,
    dialogueHistory: request.dialogueHistory,
    isAutoResume: request.isAutoResumeHandover
  });

  // 6. Stage 4: Post-Deliberation Verification Gate (Immutable Business Constraints)
  let finalDecision = aiResult.decision;
  if (preCheck.outcome === 'DENIED' && finalDecision === 'APPROVED') {
    finalDecision = 'DENIED';
  } else if (preCheck.outcome === 'ESCALATED' && finalDecision === 'APPROVED') {
    finalDecision = 'ESCALATED';
  }

  const matchedPolicies = Array.from(new Set([...preCheck.matchedPolicies, ...aiResult.matchedPolicies]));
  const existingTicket = db.prepare('SELECT id FROM refund_tickets WHERE order_id = ?').get(order.id) as any;
  const ticketId = existingTicket ? existingTicket.id : `TICK-${uuidv4().substring(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  const adminAlert = aiResult.adminAlert || (
    aiResult.confidenceScore < 0.75 || finalDecision === 'ESCALATED'
      ? "I'm not confident about this one. Can you take a look at it?"
      : undefined
  );

  const reasoningToStore = adminAlert
    ? `${aiResult.reasoning}\n\n[Private Admin Alert]: ${adminAlert}`
    : aiResult.reasoning;

  // 7. Stage 5: Save to SQLite Database
  if (existingTicket) {
    db.prepare(`
      UPDATE refund_tickets
      SET requested_amount = ?, reason = ?, decision = ?, confidence_score = ?,
          customer_response = ?, reasoning_summary = ?, risk_level = ?,
          prompt_injection_detected = ?, policy_clauses = ?, updated_at = ?
      WHERE id = ?
    `).run(
      requestedAmount,
      request.message,
      finalDecision,
      aiResult.confidenceScore,
      aiResult.customerResponse,
      reasoningToStore,
      aiResult.riskLevel,
      guardrail.isFlagged ? 1 : 0,
      JSON.stringify(matchedPolicies),
      now,
      ticketId
    );
  } else {
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
      reasoningToStore,
      aiResult.riskLevel,
      guardrail.isFlagged ? 1 : 0,
      JSON.stringify(matchedPolicies),
      now,
      now
    );
  }

  // 8. Stage 6: Audit Log Entry
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const auditAction = request.isAutoResumeHandover ? 'AUTO_RESUME_RESOLVE' : 'AUTO_EVALUATE';
  const auditNote = request.isAutoResumeHandover
    ? `AI auto-resumed conversation following specialist handover. Deliberated by ${aiResult.engineUsed} with outcome: ${finalDecision}`
    : guardrail.isFlagged
      ? `Flagged by Security Guardrail: ${guardrail.matchedPatterns.join(', ')}`
      : adminAlert
        ? `[Private Admin Alert] ${adminAlert}`
        : `Deliberated by ${aiResult.engineUsed} with outcome: ${finalDecision}`;

  insertAudit.run(`AUD-${uuidv4().substring(0, 8).toUpperCase()}`, ticketId, 'AI_SYSTEM', auditAction, auditNote, now);

  // 9. Stage 7: Persist Dialogue to chat_messages Table
  const insertChat = db.prepare(`
    INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (!request.skipCustomerMessagePersist) {
    insertChat.run(
      `MSG-${uuidv4().substring(0, 8).toUpperCase()}`,
      ticketId,
      order.id,
      customer.id,
      'customer',
      request.message,
      null,
      null,
      now
    );
  }

  insertChat.run(
    `MSG-${uuidv4().substring(0, 8).toUpperCase()}`,
    ticketId,
    order.id,
    customer.id,
    'ai',
    aiResult.customerResponse,
    finalDecision,
    aiResult.confidenceScore,
    new Date(Date.now() + 100).toISOString()
  );

  return {
    ticketId,
    orderId: order.id,
    customerId: customer.id,
    decision: finalDecision,
    confidenceScore: aiResult.confidenceScore,
    riskLevel: aiResult.riskLevel,
    matchedPolicies,
    policyClauses: matchedPolicies,
    reasoningSummary: reasoningToStore,
    customerResponse: aiResult.customerResponse,
    promptInjectionDetected: guardrail.isFlagged,
    actionItems: aiResult.actionItems,
    engineUsed: aiResult.engineUsed,
    adminAlert,
    createdAt: now
  };
}

export function getChatHistory(orderId: string, customerId?: string) {
  const db = getDb();
  let query = 'SELECT * FROM chat_messages WHERE order_id = ?';
  const params: any[] = [orderId];
  if (customerId) {
    query += ' AND customer_id = ?';
    params.push(customerId);
  }
  query += ' ORDER BY created_at ASC';
  return db.prepare(query).all(...params);
}

export function getRecentChats(limit: number = 20) {
  const db = getDb();
  return db.prepare(`
    SELECT m.order_id, m.customer_id, c.name as customer_name,
           MAX(m.created_at) as last_activity,
           COUNT(*) as message_count,
           (SELECT text FROM chat_messages WHERE order_id = m.order_id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT decision FROM chat_messages WHERE order_id = m.order_id AND decision IS NOT NULL ORDER BY created_at DESC LIMIT 1) as last_decision
    FROM chat_messages m
    JOIN customers c ON m.customer_id = c.id
    GROUP BY m.order_id, m.customer_id, c.name
    ORDER BY last_activity DESC
    LIMIT ?
  `).all(limit);
}

export interface ChatSessionRecord {
  orderId: string;
  customerId: string;
  ticketId?: string | null;
  takeoverActive: boolean;
  takenOverBy?: string | null;
  takenOverAt?: string | null;
  updatedAt?: string | null;
}

export function getChatSession(orderId: string, customerId?: string): ChatSessionRecord {
  const db = getDb();
  try {
    const row = db.prepare('SELECT * FROM chat_sessions WHERE order_id = ?').get(orderId) as any;
    if (row) {
      return {
        orderId: row.order_id,
        customerId: row.customer_id,
        ticketId: row.ticket_id,
        takeoverActive: Boolean(row.takeover_active),
        takenOverBy: row.taken_over_by,
        takenOverAt: row.taken_over_at,
        updatedAt: row.updated_at
      };
    }
  } catch {
    // Graceful fallback if table is newly migrated
  }
  return {
    orderId,
    customerId: customerId || '',
    takeoverActive: false
  };
}

export function setChatTakeover(
  orderId: string,
  customerId: string,
  active: boolean,
  actor: string = 'HUMAN_SPECIALIST',
  ticketId?: string
): ChatSessionRecord {
  const db = getDb();
  const now = new Date().toISOString();
  try {
    const existing = db.prepare('SELECT * FROM chat_sessions WHERE order_id = ?').get(orderId) as any;
    if (existing) {
      db.prepare(`
        UPDATE chat_sessions
        SET customer_id = ?, ticket_id = COALESCE(?, ticket_id), takeover_active = ?, taken_over_by = ?, taken_over_at = ?, updated_at = ?
        WHERE order_id = ?
      `).run(customerId, ticketId || null, active ? 1 : 0, active ? actor : null, active ? now : null, now, orderId);
    } else {
      db.prepare(`
        INSERT INTO chat_sessions (order_id, customer_id, ticket_id, takeover_active, taken_over_by, taken_over_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, customerId, ticketId || null, active ? 1 : 0, active ? actor : null, active ? now : null, now, now);
    }
  } catch {
    // Graceful fallback
  }

  return getChatSession(orderId, customerId);
}

export function sendCustomerChatMessage(orderId: string, customerId: string, message: string, ticketId?: string) {
  const db = getDb();
  const msgId = `MSG-${uuidv4().substring(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  const insertChat = db.prepare(`
    INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertChat.run(
    msgId,
    ticketId || null,
    orderId,
    customerId,
    'customer',
    message,
    null,
    null,
    now
  );

  return {
    id: msgId,
    ticket_id: ticketId || null,
    order_id: orderId,
    customer_id: customerId,
    sender: 'customer' as const,
    text: message,
    decision: null,
    confidence_score: null,
    created_at: now
  };
}

export async function handoverToAi(orderId: string, customerId: string, ticketId?: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const msgId = `MSG-${uuidv4().substring(0, 8).toUpperCase()}`;

  // Resolve ticketId if not explicitly provided
  let resolvedTicketId = ticketId;
  if (!resolvedTicketId) {
    const existingTicket = db.prepare('SELECT id FROM refund_tickets WHERE order_id = ?').get(orderId) as any;
    if (existingTicket) {
      resolvedTicketId = existingTicket.id;
    }
  }

  // 1. Release takeover in chat_sessions
  setChatTakeover(orderId, customerId, false, undefined, resolvedTicketId);

  // 2. Post announcement message directly to the conversation
  const handoffText = 'Support specialist has handed the conversation back to RefundRescue AI Assistant. AI is now active and ready to assist you.';
  db.prepare(`
    INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    msgId,
    resolvedTicketId || null,
    orderId,
    customerId,
    'agent',
    handoffText,
    null,
    1.0,
    now
  );

  // 3. Log audit event if ticket exists
  if (resolvedTicketId) {
    db.prepare(`
      INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `AUD-${uuidv4().substring(0, 8).toUpperCase()}`,
      resolvedTicketId,
      'HUMAN_SUPERVISOR',
      'HANDOVER_TO_AI',
      'Support specialist handed chat control back to AI Assistant.',
      now
    );
  }

  // 4. Auto-resume: AI inspects chat dialogue and customer's message to auto-resolve
  let autoResumed = false;
  let evaluation: RefundEvaluationResult | null = null;

  try {
    const history = db.prepare(`
      SELECT sender, text, created_at FROM chat_messages
      WHERE order_id = ? AND customer_id = ?
      ORDER BY created_at ASC
    `).all(orderId, customerId) as Array<{ sender: string; text: string; created_at: string }>;

    const customerMessages = history.filter(m => m.sender === 'customer');

    if (customerMessages.length > 0) {
      const lastCustMsg = customerMessages[customerMessages.length - 1];

      const dialogueHistory = history
        .map(m => {
          const role = m.sender === 'customer' ? 'Customer' : m.sender === 'ai' ? 'AI Assistant' : 'Support Specialist';
          return `${role}: ${m.text}`;
        })
        .join('\n');

      evaluation = await evaluateRefundRequest({
        orderId,
        customerId,
        message: lastCustMsg.text,
        skipCustomerMessagePersist: true,
        dialogueHistory,
        isAutoResumeHandover: true
      });

      autoResumed = true;
    }
  } catch (err) {
    console.error('[HandoverToAI] Auto-resume deliberation error:', err);
  }

  return {
    success: true,
    takeoverActive: false,
    message: handoffText,
    autoResumed,
    evaluation,
    created_at: now
  };
}

export function sendAdminChatMessage(orderId: string, customerId: string, message: string, ticketId?: string) {
  const db = getDb();
  const msgId = `MSG-${uuidv4().substring(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  // Mark chat session as active human takeover
  setChatTakeover(orderId, customerId, true, 'HUMAN_SPECIALIST', ticketId);

  const insertChat = db.prepare(`
    INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertChat.run(
    msgId,
    ticketId || null,
    orderId,
    customerId,
    'agent',
    message,
    null,
    1.0,
    now
  );

  // If a ticket exists, log this takeover in audit_logs!
  if (ticketId) {
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run(
      `AUD-${uuidv4().substring(0, 8).toUpperCase()}`,
      ticketId,
      'HUMAN_SUPERVISOR',
      'LIVE_TAKEOVER_REPLY',
      `Support Specialist replied directly: "${message.length > 80 ? message.substring(0, 77) + '...' : message}"`,
      now
    );
  }

  return {
    id: msgId,
    ticket_id: ticketId || null,
    order_id: orderId,
    customer_id: customerId,
    sender: 'agent' as const,
    text: message,
    decision: null,
    confidence_score: 1.0,
    created_at: now
  };
}
