import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Stripe Webhook Endpoint (raw body handled by parent router in server.ts)
router.post('/stripe', handleStripeWebhook);

export default router;
