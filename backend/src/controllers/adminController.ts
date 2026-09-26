import { Request, Response } from 'express';
import { getDb } from '../db/sqlite.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../middleware/errorHandler.js';

export function getMetrics(req: Request, res: Response) {
  try {
    const db = getDb();

    const totalTicketsRow = db.prepare('SELECT count(*) as count FROM refund_tickets').get() as { count: number };
    const totalTickets = totalTicketsRow?.count || 0;

    const approvedRow = db.prepare("SELECT count(*) as count FROM refund_tickets WHERE decision = 'APPROVED'").get() as { count: number };
    const deniedRow = db.prepare("SELECT count(*) as count FROM refund_tickets WHERE decision = 'DENIED'").get() as { count: number };
    const escalatedRow = db.prepare("SELECT count(*) as count FROM refund_tickets WHERE decision = 'ESCALATED'").get() as { count: number };
    const injectionRow = db.prepare('SELECT count(*) as count FROM refund_tickets WHERE prompt_injection_detected = 1').get() as { count: number };

    const sumAmountRow = db.prepare("SELECT SUM(requested_amount) as total FROM refund_tickets WHERE decision = 'APPROVED'").get() as { total: number | null };
    const totalRefunded = sumAmountRow?.total || 0;

    const avgAmountRow = db.prepare('SELECT AVG(requested_amount) as avg FROM refund_tickets').get() as { avg: number | null };
    const avgAmount = avgAmountRow?.avg || 0;

    const overridesRow = db.prepare("SELECT count(*) as count FROM audit_logs WHERE actor = 'HUMAN_SUPERVISOR'").get() as { count: number };

    const approvalRate = totalTickets > 0
      ? Math.round(((approvedRow?.count || 0) / totalTickets) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        totalTickets,
        approvedCount: approvedRow?.count || 0,
        deniedCount: deniedRow?.count || 0,
        escalatedCount: escalatedRow?.count || 0,
        injectionAttempts: injectionRow?.count || 0,
        totalRefundedAmount: Number(totalRefunded.toFixed(2)),
        averageTicketAmount: Number(avgAmount.toFixed(2)),
        supervisorOverrides: overridesRow?.count || 0,
        approvalRate
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getTickets(req: Request, res: Response) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const status = req.query.status ? String(req.query.status) : undefined;
    const riskLevel = req.query.riskLevel ? String(req.query.riskLevel) : undefined;
    const db = getDb();

    let query = `
      SELECT t.*, c.name as customer_name, c.loyalty_tier, o.total_amount as order_total
      FROM refund_tickets t
      JOIN customers c ON t.customer_id = c.id
      JOIN orders o ON t.order_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND t.decision = ?';
      params.push(status);
    }

    if (riskLevel) {
      query += ' AND t.risk_level = ?';
      params.push(riskLevel);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const tickets = db.prepare(query).all(...params) as any[];

    // Parse JSON policy clauses
    const formatted = tickets.map(t => ({
      ...t,
      policy_clauses: t.policy_clauses ? JSON.parse(t.policy_clauses) : [],
      prompt_injection_detected: Boolean(t.prompt_injection_detected)
    }));

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getTicketById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const db = getDb();

    const ticket = db.prepare(`
      SELECT t.*, c.name as customer_name, c.email as customer_email, c.loyalty_tier,
             o.total_amount as order_total, o.order_date, o.shipping_address
      FROM refund_tickets t
      JOIN customers c ON t.customer_id = c.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.id = ?
    `).get(String(id)) as any;

    if (!ticket) {
      throw new NotFoundError('Ticket', String(id));
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ticket.order_id);
    const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE ticket_id = ? ORDER BY created_at ASC').all(String(id));

    return res.json({
      success: true,
      data: {
        ...ticket,
        policy_clauses: ticket.policy_clauses ? JSON.parse(ticket.policy_clauses) : [],
        prompt_injection_detected: Boolean(ticket.prompt_injection_detected),
        items,
        auditLogs
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function overrideTicket(req: Request, res: Response) {
  const id = String(req.params.id);
  // decision + notes validated by Zod middleware
  const { decision, notes } = req.body;

  const db = getDb();
  const existing = db.prepare('SELECT * FROM refund_tickets WHERE id = ?').get(id) as any;
  if (!existing) {
    throw new NotFoundError('Ticket', id);
  }

  const now = new Date().toISOString();

  // Update ticket
  db.prepare(`
    UPDATE refund_tickets
    SET decision = ?, updated_at = ?
    WHERE id = ?
  `).run(decision, now, id);

  // Insert audit log
  const auditId = `AUD-${uuidv4().substring(0, 8).toUpperCase()}`;
  const action = `OVERRIDE_${decision}`;
  const formattedNotes = `Human supervisor override from ${existing.decision} to ${decision}. Reason: ${notes.trim()}`;

  db.prepare(`
    INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(auditId, id, 'HUMAN_SUPERVISOR', action, formattedNotes, now);

  return res.json({
    success: true,
    message: `Ticket successfully overridden to ${decision}`,
    data: {
      ticketId: id,
      previousDecision: existing.decision,
      newDecision: decision,
      notes: formattedNotes,
      updatedAt: now
    }
  });
}
