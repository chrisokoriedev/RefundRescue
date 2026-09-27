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
      sender TEXT NOT NULL, -- 'customer' | 'ai'
      text TEXT NOT NULL,
      decision TEXT,
      confidence_score REAL,
      created_at TEXT NOT NULL,
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
}

export function resetAndSeedDatabase(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM refund_tickets;
    DELETE FROM chat_messages;
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
}
