import { Router } from 'express';
import { getCustomers, getCustomerById, getOrderById } from '../controllers/customerController.js';
import { evaluateRefund, getPolicies } from '../controllers/refundController.js';
import { getMetrics, getTickets, getTicketById, overrideTicket } from '../controllers/adminController.js';

const router = Router();

// Customer & Order routes
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.get('/orders/:id', getOrderById);

// Refund evaluation & Policy routes
router.post('/refunds/evaluate', evaluateRefund);
router.post('/refunds/chat', evaluateRefund); // aliases chat submissions to evaluation engine
router.get('/policy/rules', getPolicies);

// Admin & Support routes
router.get('/admin/metrics', getMetrics);
router.get('/admin/tickets', getTickets);
router.get('/admin/tickets/:id', getTicketById);
router.post('/admin/tickets/:id/override', overrideTicket);

export default router;
