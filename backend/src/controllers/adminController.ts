import { Request, Response } from 'express';
import { getDb } from '../db/sqlite.js';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../middleware/errorHandler.js';
import { setChatTakeover } from '../services/refundService.js';

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
    const { limit = 10, offset = 0 } = req.query;
    const status = req.query.status ? String(req.query.status) : undefined;
    const riskLevel = req.query.riskLevel ? String(req.query.riskLevel) : undefined;
    const db = getDb();

    let countQuery = `
      SELECT count(*) as count
      FROM refund_tickets t
      JOIN customers c ON t.customer_id = c.id
      JOIN orders o ON t.order_id = o.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    if (status) {
      countQuery += ' AND t.decision = ?';
      countParams.push(status);
    }
    if (riskLevel) {
      countQuery += ' AND t.risk_level = ?';
      countParams.push(riskLevel);
    }
    const totalRow = db.prepare(countQuery).get(...countParams) as { count: number };
    const total = totalRow?.count || 0;

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

    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        page: Math.floor(parsedOffset / parsedLimit) + 1,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
        hasMore: parsedOffset + parsedLimit < total
      },
      data: formatted
    });
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

  // Post official supervisor response directly to customer chat session
  const chatMsgId = `MSG-${uuidv4().substring(0, 8).toUpperCase()}`;
  let customerNotice = '';
  if (decision === 'APPROVED') {
    customerNotice = `Your refund request has been manually reviewed and APPROVED by a support supervisor. Reason: ${notes.trim()}`;
  } else if (decision === 'DENIED') {
    customerNotice = `Your refund request has been manually reviewed by a support supervisor and was DENIED. Reason: ${notes.trim()}`;
  } else {
    customerNotice = `Your request has been escalated for high-priority specialist review by a support supervisor. Note: ${notes.trim()}`;
  }

  db.prepare(`
    INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    chatMsgId,
    id,
    existing.order_id,
    existing.customer_id,
    'agent',
    customerNotice,
    decision,
    1.0,
    now
  );

  // Activate human takeover so AI does not interfere after supervisor intervention
  try {
    setChatTakeover(existing.order_id, existing.customer_id, true, 'HUMAN_SUPERVISOR', id);
  } catch {
    // Non-blocking
  }

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

export async function resetDatabase(req: Request, res: Response) {
  try {
    const { resetAndSeedDatabase } = await import('../db/sqlite.js');
    resetAndSeedDatabase();
    return res.json({
      success: true,
      message: 'Database has been cleanly reset to default demo seed data.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProductsHandler(req: Request, res: Response) {
  try {
    const { getPredefinedProducts } = await import('../services/productCatalog.js');
    const products = getPredefinedProducts();
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function createSimulatedTicket(req: Request, res: Response) {
  try {
    const {
      customerName,
      customerEmail,
      loyaltyTier = 'Silver',
      productId,
      reason,
      requestedAmount,
      orderAgeDays = 5,
      mode = 'evaluate'
    } = req.body;

    const { getProductById } = await import('../services/productCatalog.js');
    const { evaluateRefundRequest } = await import('../services/refundService.js');
    const db = getDb();

    const product = getProductById(productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        error: `Product not found with id or SKU: ${productId}`
      });
    }

    const email = customerEmail || `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`;

    // 1. Check or create customer
    let customer = db.prepare('SELECT * FROM customers WHERE email = ? OR name = ?').get(email, customerName) as any;
    if (!customer) {
      const customerId = `CUST-${Math.floor(200 + Math.random() * 800)}`;
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO customers (id, name, email, loyalty_tier, past_orders_count, past_refunds_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(customerId, customerName, email, loyaltyTier, 1, 0, now);
      customer = { id: customerId, name: customerName, email, loyalty_tier: loyaltyTier, past_orders_count: 1, past_refunds_count: 0, created_at: now };
    }

    // 2. Create order
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderDate = new Date(Date.now() - Number(orderAgeDays) * 24 * 60 * 60 * 1000).toISOString();
    const finalAmount = requestedAmount !== undefined ? Number(requestedAmount) : product.unitPrice;

    db.prepare(`
      INSERT INTO orders (id, customer_id, total_amount, currency, status, order_date, shipping_address, scenario_description, expected_outcome)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      customer.id,
      finalAmount,
      'USD',
      'DELIVERED',
      orderDate,
      '100 Innovation Way, San Francisco, CA',
      reason,
      null
    );

    // 3. Create order item
    const itemId = `ITEM-${uuidv4().substring(0, 8).toUpperCase()}`;
    db.prepare(`
      INSERT INTO order_items (id, order_id, product_name, sku, quantity, unit_price, is_final_sale, category)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      itemId,
      orderId,
      product.name,
      product.sku,
      1,
      product.unitPrice,
      product.isFinalSale ? 1 : 0,
      product.category
    );

    // If chat mode: create initial ticket in ESCALATED review state so user can test in live chat
    if (mode === 'chat') {
      const ticketId = `TICK-${uuidv4().substring(0, 8).toUpperCase()}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO refund_tickets (
          id, order_id, customer_id, requested_amount, reason, decision,
          confidence_score, customer_response, reasoning_summary, risk_level,
          prompt_injection_detected, policy_clauses, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ticketId,
        orderId,
        customer.id,
        finalAmount,
        reason,
        'ESCALATED',
        0.5,
        'Ticket created. Ready for conversational claim evaluation in customer chat.',
        'Ticket initialized for interactive customer portal testing. Ready for chat deliberation.',
        'LOW',
        0,
        JSON.stringify([]),
        now,
        now
      );

      const auditId = `AUD-${uuidv4().substring(0, 8).toUpperCase()}`;
      db.prepare(`
        INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        auditId,
        ticketId,
        'HUMAN_SUPERVISOR',
        'MANUAL_ESCALATE',
        'Ticket created for live chat testing in customer portal.',
        now
      );

      const ticket = db.prepare(`
        SELECT t.*, c.name as customer_name, c.loyalty_tier, o.total_amount as order_total
        FROM refund_tickets t
        JOIN customers c ON t.customer_id = c.id
        JOIN orders o ON t.order_id = o.id
        WHERE t.id = ?
      `).get(ticketId) as any;

      if (ticket && ticket.policy_clauses) {
        try {
          ticket.policy_clauses = JSON.parse(ticket.policy_clauses);
        } catch {
          // ignore
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Ticket created for chat testing',
        data: {
          mode: 'chat',
          ticket,
          customer,
          order: {
            id: orderId,
            customer_id: customer.id,
            total_amount: finalAmount,
            order_date: orderDate,
            product_name: product.name,
            sku: product.sku
          },
          reason
        }
      });
    }

    // 4. Run the full evaluation pipeline (evaluate mode)
    const evaluation = await evaluateRefundRequest({
      customerId: customer.id,
      orderId,
      message: reason,
      requestedAmount: finalAmount
    });

    // 5. Fetch full ticket record
    const ticket = db.prepare(`
      SELECT t.*, c.name as customer_name, c.loyalty_tier, o.total_amount as order_total
      FROM refund_tickets t
      JOIN customers c ON t.customer_id = c.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.id = ?
    `).get(evaluation.ticketId) as any;

    if (ticket && ticket.policy_clauses) {
      try {
        ticket.policy_clauses = JSON.parse(ticket.policy_clauses);
      } catch {
        // ignore
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Ticket created and evaluated successfully',
      data: {
        mode: 'evaluate',
        ticket: ticket || evaluation,
        evaluation,
        customer,
        order: {
          id: orderId,
          customer_id: customer.id,
          total_amount: finalAmount,
          order_date: orderDate,
          product_name: product.name,
          sku: product.sku
        },
        reason
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

