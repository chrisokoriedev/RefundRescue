import { Request, Response } from 'express';
import { getDb } from '../db/sqlite.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export function getCustomers(req: Request, res: Response) {
  const db = getDb();
  const customers = db.prepare('SELECT * FROM customers ORDER BY id ASC').all();
  return res.json({ success: true, count: customers.length, data: customers });
}

export function getCustomerById(req: Request, res: Response) {
  const id = String(req.params.id);
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

  if (!customer) {
    throw new NotFoundError('Customer', id);
  }

  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC').all(id) as any[];

  for (const order of orders) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }

  return res.json({ success: true, data: { ...customer, orders } });
}

export function getOrderById(req: Request, res: Response) {
  const id = String(req.params.id);
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

  if (!order) {
    throw new NotFoundError('Order', id);
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id);
  const tickets = db.prepare('SELECT * FROM refund_tickets WHERE order_id = ?').all(id);

  return res.json({
    success: true,
    data: {
      ...order,
      items,
      customer,
      tickets
    }
  });
}
