import { Request, Response } from 'express';
import { getDb } from '../db/sqlite.js';

export function getCustomers(req: Request, res: Response) {
  try {
    const db = getDb();
    const customers = db.prepare('SELECT * FROM customers ORDER BY id ASC').all();
    return res.json({ success: true, count: customers.length, data: customers });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getCustomerById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const db = getDb();
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC').all(id) as any[];

    for (const order of orders) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    }

    return res.json({ success: true, data: { ...customer, orders } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
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
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
