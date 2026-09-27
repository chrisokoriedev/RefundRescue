import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedCustomers, seedOrders } from './seedData.js';

let dbInstance: DatabaseSync | null = null;

export function initDatabase(dbPath: string = './data/revrescue.db'): DatabaseSync {
  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new DatabaseSync(dbPath);

  // Enable foreign keys
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      loyalty_tier TEXT NOT NULL,
      past_orders_count INTEGER NOT NULL DEFAULT 0,
      past_refunds_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      order_date TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      scenario_description TEXT,
      expected_outcome TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      is_final_sale INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refund_tickets (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      requested_amount REAL NOT NULL,
      reason TEXT NOT NULL,
      decision TEXT NOT NULL, -- 'APPROVED' | 'DENIED' | 'ESCALATED'
      confidence_score REAL NOT NULL,
      customer_response TEXT NOT NULL,
      reasoning_summary TEXT NOT NULL,
      risk_level TEXT NOT NULL, -- 'LOW' | 'MEDIUM' | 'HIGH'
      prompt_injection_detected INTEGER NOT NULL DEFAULT 0,
      policy_clauses TEXT, -- JSON array of matched policy codes
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      actor TEXT NOT NULL, -- 'AI_SYSTEM' | 'HUMAN_SUPERVISOR'
      action TEXT NOT NULL, -- 'AUTO_EVALUATE' | 'OVERRIDE_APPROVE' | 'OVERRIDE_DENY' | 'MANUAL_ESCALATE'
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES refund_tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT,
      order_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'customer' | 'ai' | 'agent' | 'system'
      text TEXT NOT NULL,
      decision TEXT,
      confidence_score REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      order_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      ticket_id TEXT,
      takeover_active INTEGER NOT NULL DEFAULT 0,
      taken_over_by TEXT,
      taken_over_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  return dbInstance;
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function seedDatabase(): void {
  const db = getDb();

  const countRow = db.prepare('SELECT count(*) as count FROM customers').get() as { count: number };
  if (countRow && countRow.count >= 15) {
    // Already seeded
    return;
  }

  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (id, name, email, loyalty_tier, past_orders_count, past_refunds_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of seedCustomers) {
    insertCustomer.run(c.id, c.name, c.email, c.loyalty_tier, c.past_orders_count, c.past_refunds_count, c.created_at);
  }

  const insertOrder = db.prepare(`
    INSERT OR REPLACE INTO orders (id, customer_id, total_amount, currency, status, order_date, shipping_address, scenario_description, expected_outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT OR REPLACE INTO order_items (id, order_id, product_name, sku, quantity, unit_price, is_final_sale, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const o of seedOrders) {
    insertOrder.run(o.id, o.customer_id, o.total_amount, o.currency, o.status, o.order_date, o.shipping_address, o.scenarioDescription, o.expectedOutcome);
    for (const item of o.items) {
      insertOrderItem.run(item.id, item.order_id, item.product_name, item.sku, item.quantity, item.unit_price, item.is_final_sale, item.category);
    }
  }

  seedBaselineTickets(db);
}

export function seedBaselineTickets(db: DatabaseSync): void {
  const countRow = db.prepare('SELECT count(*) as count FROM refund_tickets').get() as { count: number };
  if (countRow && countRow.count > 0) return;

  const now = new Date().toISOString();
  const insertTicket = db.prepare(`
    INSERT INTO refund_tickets (
      id, order_id, customer_id, requested_amount, reason, decision,
      confidence_score, customer_response, reasoning_summary, risk_level,
      prompt_injection_detected, policy_clauses, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, ticket_id, actor, action, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertChat = db.prepare(`
    INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Baseline Ticket 1: Approved Damaged Cookware Set
  insertTicket.run(
    'TICK-901-APP',
    'ORD-901',
    'CUST-101',
    180.00,
    'Cookware set arrived with shattered lids and chipped ceramic during shipping.',
    'APPROVED',
    0.98,
    'Hi Sarah, thank you for reaching out to us. We apologize for the damaged cookware set. Under our Damaged Goods Policy (POL-004), we have approved your full refund of $180.00 for order #ORD-901.',
    'Order ORD-901 delivered 5 days ago. Shattered lid falls under POL-004 (Damaged Goods within 30 days, amount <= $500). Customer has clean history with 8 orders. Approved.',
    'LOW',
    0,
    JSON.stringify(['POL-004']),
    now,
    now
  );
  insertAudit.run(
    'AUD-001',
    'TICK-901-APP',
    'AI_SYSTEM',
    'AUTO_EVALUATE',
    'Automated approval under policy POL-004: Damaged in transit within 30 days window.',
    now
  );
  insertChat.run(
    'MSG-001-CUST',
    'TICK-901-APP',
    'ORD-901',
    'CUST-101',
    'customer',
    'Cookware set arrived with shattered lids and chipped ceramic during shipping.',
    null,
    null,
    now
  );
  insertChat.run(
    'MSG-001-AI',
    'TICK-901-APP',
    'ORD-901',
    'CUST-101',
    'ai',
    'Hi Sarah, thank you for reaching out to us. We apologize for the damaged cookware set. Under our Damaged Goods Policy (POL-004), we have approved your full refund of $180.00 for order #ORD-901.',
    'APPROVED',
    0.98,
    now
  );

  // Baseline Ticket 2: Escalated High-Value OLED TV
  insertTicket.run(
    'TICK-904-ESC',
    'ORD-904',
    'CUST-104',
    850.00,
    'TV display arrived with a cracked screen ($850 > $500 threshold).',
    'ESCALATED',
    0.74,
    'Hello David, thank you for reaching out regarding your OLED TV. Because your order total exceeds our automated threshold of $500, we have routed your claim directly to a support specialist for manual review.',
    'Claim amount $850.00 exceeds $500 threshold under POL-003. Flagged for supervisor review.\n\n[Private Admin Alert]: "I\'m not confident about this high-value asset claim without visual serial check. Please review."',
    'MEDIUM',
    0,
    JSON.stringify(['POL-003']),
    now,
    now
  );
  insertAudit.run(
    'AUD-002',
    'TICK-904-ESC',
    'AI_SYSTEM',
    'AUTO_EVALUATE',
    'Automated escalation under policy POL-003: Exceeds $500 threshold. Dispatched private alert to supervisor.',
    now
  );
  insertChat.run(
    'MSG-002-CUST',
    'TICK-904-ESC',
    'ORD-904',
    'CUST-104',
    'customer',
    'TV display arrived with a cracked screen ($850 > $500 threshold).',
    null,
    null,
    now
  );
  insertChat.run(
    'MSG-002-AI',
    'TICK-904-ESC',
    'ORD-904',
    'CUST-104',
    'ai',
    'Hello David, thank you for reaching out regarding your OLED TV. Because your order total exceeds our automated threshold of $500, we have routed your claim directly to a support specialist for manual review.',
    'ESCALATED',
    0.74,
    now
  );

  // Baseline Ticket 3: Denied Final Sale Scarf
  insertTicket.run(
    'TICK-903-DEN',
    'ORD-903',
    'CUST-103',
    95.00,
    'Customer wants to return clearance cashmere scarf because the shade of red did not match their jacket.',
    'DENIED',
    0.99,
    'Hello Elena, thank you for contacting RevRescue. We reviewed your claim for order #ORD-903. As stated during checkout and under store policy POL-001, clearance and final-sale merchandise cannot be refunded.',
    'Item SKU APP-SCARF-FS is explicitly marked as final sale (is_final_sale=1). POL-001 strictly disallows refunds for clearance merchandise.',
    'LOW',
    0,
    JSON.stringify(['POL-001']),
    now,
    now
  );
  insertAudit.run(
    'AUD-003',
    'TICK-903-DEN',
    'AI_SYSTEM',
    'AUTO_EVALUATE',
    'Automated rejection under policy POL-001: Item is marked as Final Sale.',
    now
  );
  insertChat.run(
    'MSG-003-CUST',
    'TICK-903-DEN',
    'ORD-903',
    'CUST-103',
    'customer',
    'Customer wants to return clearance cashmere scarf because the shade of red did not match their jacket.',
    null,
    null,
    now
  );
  insertChat.run(
    'MSG-003-AI',
    'TICK-903-DEN',
    'ORD-903',
    'CUST-103',
    'ai',
    'Hello Elena, thank you for contacting RevRescue. We reviewed your claim for order #ORD-903. As stated during checkout and under store policy POL-001, clearance and final-sale merchandise cannot be refunded.',
    'DENIED',
    0.99,
    now
  );
}

export function resetAndSeedDatabase(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM refund_tickets;
    DELETE FROM chat_messages;
    DELETE FROM chat_sessions;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM customers;
  `);

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, loyalty_tier, past_orders_count, past_refunds_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of seedCustomers) {
    insertCustomer.run(c.id, c.name, c.email, c.loyalty_tier, c.past_orders_count, c.past_refunds_count, c.created_at);
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer_id, total_amount, currency, status, order_date, shipping_address, scenario_description, expected_outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, product_name, sku, quantity, unit_price, is_final_sale, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const o of seedOrders) {
    insertOrder.run(o.id, o.customer_id, o.total_amount, o.currency, o.status, o.order_date, o.shipping_address, o.scenarioDescription, o.expectedOutcome);
    for (const item of o.items) {
      insertOrderItem.run(item.id, item.order_id, item.product_name, item.sku, item.quantity, item.unit_price, item.is_final_sale, item.category);
    }
  }

  seedBaselineTickets(db);
}
