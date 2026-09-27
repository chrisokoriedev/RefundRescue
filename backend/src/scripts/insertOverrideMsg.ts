import { getDb } from '../db/sqlite.js';

const db = getDb();
db.prepare(`
  INSERT INTO chat_messages (id, ticket_id, order_id, customer_id, sender, text, decision, confidence_score, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'MSG-OVR-099624',
  'TICK-099624CC',
  'ORD-901',
  'CUST-101',
  'agent',
  'Your refund request has been manually reviewed by a support supervisor and was DENIED. Reason: we dont refund stoen product',
  'DENIED',
  1.0,
  new Date().toISOString()
);

console.log('Retroactive override message inserted successfully');
