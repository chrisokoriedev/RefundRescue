import Stripe from 'stripe';
import { config } from '../config/index.js';

/**
 * Stripe Metrics Export (#19)
 * 
 * Pushes recovered MRR and churn prevention metrics back to Stripe
 * as customer metadata and invoice metadata.
 * 
 * This allows Stripe dashboards to show RevRescue recovery data.
 */

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient && config.stripeSecretKey) {
    stripeClient = new Stripe(config.stripeSecretKey);
  }
  return stripeClient!;
}

/**
 * Update Stripe customer metadata with recovery metrics.
 */
export async function updateCustomerMetadata(
  customerId: string,
  metrics: {
    totalRecoveries?: number;
    recoveredMRR?: number;
    lastRecoveryDate?: string;
    churnPreventionScore?: number;
  }
): Promise<void> {
  if (process.env.NODE_ENV === 'test' || !config.stripeSecretKey) return;
  
  try {
    const stripe = getStripe();
    if (!stripe) return;

    const metadata: Record<string, string> = {};
    if (metrics.totalRecoveries !== undefined) {
      metadata.revrescue_total_recoveries = String(metrics.totalRecoveries);
    }
    if (metrics.recoveredMRR !== undefined) {
      metadata.revrescue_recovered_mrr = String(metrics.recoveredMRR);
    }
    if (metrics.lastRecoveryDate) {
      metadata.revrescue_last_recovery = metrics.lastRecoveryDate;
    }
    if (metrics.churnPreventionScore !== undefined) {
      metadata.revrescue_churn_score = String(metrics.churnPreventionScore);
    }
    metadata.revrescue_updated_at = new Date().toISOString();

    await stripe.customers.update(customerId, { metadata });
    console.log(`[Stripe Metrics] Updated customer ${customerId} metadata`);
  } catch (err: any) {
    console.warn(`[Stripe Metrics] Failed to update customer metadata: ${err.message}`);
  }
}

/**
 * Update Stripe invoice metadata with recovery outcome.
 */
export async function updateInvoiceMetadata(
  invoiceId: string,
  outcome: {
    recovered: boolean;
    recoveryMethod?: string;
    callDuration?: number;
    callId?: string;
  }
): Promise<void> {
  if (process.env.NODE_ENV === 'test' || !config.stripeSecretKey) return;
  
  try {
    const stripe = getStripe();
    if (!stripe) return;

    await stripe.invoices.update(invoiceId, {
      metadata: {
        revrescue_outcome: outcome.recovered ? 'recovered' : 'failed',
        revrescue_method: outcome.recoveryMethod || 'voice_agent',
        revrescue_call_id: outcome.callId || '',
        revrescue_call_duration: String(outcome.callDuration || 0),
        revrescue_timestamp: new Date().toISOString(),
      },
    });
    console.log(`[Stripe Metrics] Updated invoice ${invoiceId} metadata`);
  } catch (err: any) {
    console.warn(`[Stripe Metrics] Failed to update invoice metadata: ${err.message}`);
  }
}

/**
 * Generate a one-click payment link so the customer can update their card.
 * Uses a real Stripe Checkout Session when a secret key is configured;
 * otherwise falls back to the hosted RevRescue checkout page (mock flow).
 */
export async function createPaymentLink(opts: {
  customerId?: string;
  invoiceId?: string;
  amount?: number;
  email?: string;
}): Promise<string> {
  const fallback = `${config.frontendUrl}/mock/checkout`;
  if (!config.stripeSecretKey || process.env.NODE_ENV === 'test') {
    return fallback;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ...(opts.customerId ? { customer: opts.customerId } : {}),
      ...(opts.email && !opts.customerId ? { customer_email: opts.email } : {}),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'RevRescue — Payment Recovery' },
            unit_amount: Math.max(1, Math.round((opts.amount || 0) * 100)),
          },
          quantity: 1,
        },
      ],
      metadata: {
        revrescue: 'true',
        ...(opts.invoiceId ? { revrescue_invoice_id: opts.invoiceId } : {}),
      },
      success_url: `${config.frontendUrl}/?payment=success`,
      cancel_url: `${config.frontendUrl}/?payment=cancelled`,
    });
    return session.url || fallback;
  } catch (err: any) {
    console.warn(`[Stripe Metrics] Failed to create payment link: ${err.message}`);
    return fallback;
  }
}
