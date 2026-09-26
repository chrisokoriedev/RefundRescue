export interface PolicyContext {
  order: {
    id: string;
    customer_id: string;
    total_amount: number;
    order_date: string;
    currency?: string;
    status?: string;
  };
  items: Array<{
    id: string;
    order_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    is_final_sale: number; // 0 or 1
    category: string;
  }>;
  customer?: {
    id: string;
    name: string;
    email: string;
    loyalty_tier: string;
    past_orders_count: number;
    past_refunds_count: number;
  };
  requestedAmount?: number;
}

export interface PolicyPreCheckResult {
  outcome: 'POTENTIAL_APPROVAL' | 'DENIED' | 'ESCALATED';
  matchedPolicies: string[];
  reason?: string;
  details: string[];
}

export const STORE_POLICIES = [
  {
    code: 'POL-001',
    name: 'Final Sale Exclusion',
    description: 'Items tagged as final sale, clearance, or personal hygiene cannot be refunded under any circumstances.',
    enforcement: 'DETERMINISTIC_HARD_GATE',
    defaultOutcome: 'DENIED'
  },
  {
    code: 'POL-002',
    name: '30-Day Return Window',
    description: 'Orders older than 30 calendar days from delivery/purchase date are not eligible for automated or standard refund.',
    enforcement: 'DETERMINISTIC_HARD_GATE',
    defaultOutcome: 'DENIED'
  },
  {
    code: 'POL-003',
    name: 'High-Value Escalation Threshold ($500+)',
    description: 'Any claim exceeding $500.00 USD must be escalated for human supervisor review and cannot be auto-approved by AI.',
    enforcement: 'DETERMINISTIC_ESCALATION_GATE',
    defaultOutcome: 'ESCALATED'
  },
  {
    code: 'POL-004',
    name: 'Damaged or Defective Delivery',
    description: 'Genuine claims of damaged, defective, broken, or incorrect items within the 30-day window are eligible for full refund or replacement.',
    enforcement: 'AI_SEMANTIC_DELIBERATION',
    defaultOutcome: 'APPROVED'
  },
  {
    code: 'POL-005',
    name: 'Suspicious, Conflicting, or Abusive Claims',
    description: 'Contradictory claims, excessive past refund history (>3 refunds), or detected manipulation/prompt injection must be escalated for supervisor review.',
    enforcement: 'HYBRID_GUARD_AND_AI',
    defaultOutcome: 'ESCALATED'
  }
];

export function evaluateDeterministicPolicy(context: PolicyContext): PolicyPreCheckResult {
  const { order, items, customer, requestedAmount } = context;
  const matchedPolicies: string[] = [];
  const details: string[] = [];

  // Rule 1: Final Sale (POL-001) - Hard Deny
  const hasFinalSale = items.some(item => item.is_final_sale === 1);
  if (hasFinalSale) {
    matchedPolicies.push('POL-001');
    const finalSaleItem = items.find(item => item.is_final_sale === 1);
    const reason = `Item "${finalSaleItem?.product_name || 'Item'}" is marked as Final Sale and is not eligible for refund under store policy.`;
    details.push(reason);
    return {
      outcome: 'DENIED',
      matchedPolicies,
      reason,
      details
    };
  }

  // Rule 2: 30-Day Window (POL-002) - Hard Deny
  const orderTime = new Date(order.order_date).getTime();
  const now = Date.now();
  const orderAgeDays = Math.floor((now - orderTime) / (1000 * 60 * 60 * 24));

  if (orderAgeDays > 30) {
    matchedPolicies.push('POL-002');
    const reason = `Order was placed ${orderAgeDays} days ago, which exceeds our 30-day return window.`;
    details.push(reason);
    return {
      outcome: 'DENIED',
      matchedPolicies,
      reason,
      details
    };
  }

  // Rule 3: High-Value Threshold (POL-003) - Escalate
  const effectiveAmount = requestedAmount !== undefined && requestedAmount > 0
    ? requestedAmount
    : order.total_amount;

  if (effectiveAmount > 500) {
    matchedPolicies.push('POL-003');
    const reason = `Refund request amount ($${effectiveAmount.toFixed(2)}) exceeds the $500.00 automated threshold and requires human supervisor review.`;
    details.push(reason);
    return {
      outcome: 'ESCALATED',
      matchedPolicies,
      reason,
      details
    };
  }

  // Rule 4: Excessive Refund History (POL-005) - Escalate
  if (customer && customer.past_refunds_count >= 3 && (customer.past_refunds_count / Math.max(customer.past_orders_count, 1)) > 0.5) {
    matchedPolicies.push('POL-005');
    const reason = `Customer account flagged for frequent refund history (${customer.past_refunds_count} past refunds). Escalated for supervisor audit.`;
    details.push(reason);
    return {
      outcome: 'ESCALATED',
      matchedPolicies,
      reason,
      details
    };
  }

  // All deterministic checks passed; claim is eligible for AI semantic review
  return {
    outcome: 'POTENTIAL_APPROVAL',
    matchedPolicies: [],
    details: ['All deterministic constraints satisfied. Eligible for AI claim evaluation.']
  };
}
