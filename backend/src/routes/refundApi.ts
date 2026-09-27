import { Router } from 'express';
import { getCustomers, getCustomerById, getOrderById } from '../controllers/customerController.js';
import { evaluateRefund, clarifyRefund, getPolicies, getChatMessages, getRecentConversations, sendAgentReply } from '../controllers/refundController.js';
import {
  getMetrics,
  getTickets,
  getTicketById,
  overrideTicket,
  resetDatabase,
  getProductsHandler,
  createSimulatedTicket
} from '../controllers/adminController.js';
import { asyncErrorWrapper } from '../middleware/errorHandler.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  evaluateRefundSchema,
  clarifySchema,
  overrideTicketSchema,
  agentReplySchema,
  ticketsQuerySchema,
  createTicketSchema,
  idParamSchema,
  validateBody,
  validateQuery,
  validateParams
} from '../validators/schemas.js';

const router = Router();

// ── AI evaluation endpoint: tight budget (LLM cost) + idempotency support ──
const evaluateLimiter = rateLimiter({
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req) => `evaluate:${req.ip}`,
  message: 'Too many refund evaluations — the AI engine has a budget of 20 evaluations per minute per client.'
});

// Customer & Order routes
router.get('/customers', asyncErrorWrapper(getCustomers));
router.get('/customers/:id', validateParams(idParamSchema), asyncErrorWrapper(getCustomerById));
router.get('/orders/:id', validateParams(idParamSchema), asyncErrorWrapper(getOrderById));

// Refund evaluation & Policy routes
router.post('/refunds/evaluate',
  evaluateLimiter,
  idempotencyMiddleware,
  validateBody(evaluateRefundSchema),
  asyncErrorWrapper(evaluateRefund)
);
// Multi-turn clarification pre-check: returns a follow-up question if the
// claim is too vague to judge. Cheap guard so gibberish never reaches the LLM.
router.post('/refunds/clarify',
  validateBody(clarifySchema),
  asyncErrorWrapper(clarifyRefund)
);
router.post('/refunds/chat',
  evaluateLimiter,
  idempotencyMiddleware,
  validateBody(evaluateRefundSchema),
  asyncErrorWrapper(evaluateRefund)
); // alias: chat submissions use the same evaluation engine
router.get('/policy/rules', getPolicies);

// Chat history routes (persisted in SQLite)
router.get('/chat/history', asyncErrorWrapper(getChatMessages));
router.get('/chat/recent', asyncErrorWrapper(getRecentConversations));
router.post('/chat/agent-reply', validateBody(agentReplySchema), asyncErrorWrapper(sendAgentReply));

// Products catalog route (predefined store catalog)
router.get('/products', asyncErrorWrapper(getProductsHandler));

// Ticket creation / simulation route (with edge validation & rate limiting)
router.post('/tickets/create',
  evaluateLimiter,
  validateBody(createTicketSchema),
  asyncErrorWrapper(createSimulatedTicket)
);

// Admin & Support routes
router.get('/admin/metrics', asyncErrorWrapper(getMetrics));
router.get('/admin/tickets', validateQuery(ticketsQuerySchema), asyncErrorWrapper(getTickets));
router.get('/admin/tickets/:id', validateParams(idParamSchema), asyncErrorWrapper(getTicketById));
router.post('/admin/tickets/:id/override',
  validateParams(idParamSchema),
  validateBody(overrideTicketSchema),
  asyncErrorWrapper(overrideTicket)
);
router.post('/admin/reset-data', asyncErrorWrapper(resetDatabase));

export default router;
