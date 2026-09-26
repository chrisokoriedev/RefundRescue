import { evaluateDeterministicPolicy } from '../src/services/policyEngine.js';

describe('Deterministic Policy Engine', () => {
  const baseOrder = {
    id: 'ORD-TEST',
    customer_id: 'CUST-TEST',
    total_amount: 100,
    order_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    currency: 'USD',
    status: 'DELIVERED',
  };

  const baseCustomer = {
    id: 'CUST-TEST',
    name: 'Test Customer',
    email: 'test@example.com',
    loyalty_tier: 'Silver' as const,
    past_orders_count: 5,
    past_refunds_count: 0,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
  };

  it('denies items marked as final sale (POL-001)', () => {
    const items = [
      { id: 'ITEM-1', order_id: 'ORD-TEST', product_name: 'Scarf', sku: 'SKU-1', quantity: 1, unit_price: 50, is_final_sale: 1, category: 'Apparel' }
    ];
    const result = evaluateDeterministicPolicy({ order: baseOrder, items, customer: baseCustomer, requestedAmount: 50 });
    expect(result.outcome).toBe('DENIED');
    expect(result.matchedPolicies).toContain('POL-001');
    expect(result.reason).toMatch(/final sale/i);
  });

  it('denies orders older than 30 days (POL-002)', () => {
    const oldOrder = { ...baseOrder, order_date: new Date(Date.now() - 45 * 86400000).toISOString() };
    const items = [
      { id: 'ITEM-1', order_id: 'ORD-TEST', product_name: 'Shoes', sku: 'SKU-2', quantity: 1, unit_price: 100, is_final_sale: 0, category: 'Footwear' }
    ];
    const result = evaluateDeterministicPolicy({ order: oldOrder, items, customer: baseCustomer, requestedAmount: 100 });
    expect(result.outcome).toBe('DENIED');
    expect(result.matchedPolicies).toContain('POL-002');
    expect(result.reason).toMatch(/30[- ]day/i);
  });

  it('escalates orders exceeding $500 threshold (POL-003)', () => {
    const highValueOrder = { ...baseOrder, total_amount: 850 };
    const items = [
      { id: 'ITEM-1', order_id: 'ORD-TEST', product_name: 'TV', sku: 'SKU-3', quantity: 1, unit_price: 850, is_final_sale: 0, category: 'Electronics' }
    ];
    const result = evaluateDeterministicPolicy({ order: highValueOrder, items, customer: baseCustomer, requestedAmount: 850 });
    expect(result.outcome).toBe('ESCALATED');
    expect(result.matchedPolicies).toContain('POL-003');
    expect(result.reason).toMatch(/\$500/i);
  });

  it('escalates customer accounts with excessive refund history (>3 refunds) (POL-005)', () => {
    const abuserCustomer = { ...baseCustomer, past_refunds_count: 4, past_orders_count: 5 };
    const items = [
      { id: 'ITEM-1', order_id: 'ORD-TEST', product_name: 'Jacket', sku: 'SKU-5', quantity: 1, unit_price: 200, is_final_sale: 0, category: 'Apparel' }
    ];
    const result = evaluateDeterministicPolicy({ order: baseOrder, items, customer: abuserCustomer, requestedAmount: 200 });
    expect(result.outcome).toBe('ESCALATED');
    expect(result.matchedPolicies).toContain('POL-005');
  });

  it('allows eligible claims to proceed to LLM deliberation (POTENTIAL_APPROVAL)', () => {
    const items = [
      { id: 'ITEM-1', order_id: 'ORD-TEST', product_name: 'Pot', sku: 'SKU-4', quantity: 1, unit_price: 80, is_final_sale: 0, category: 'Kitchen' }
    ];
    const result = evaluateDeterministicPolicy({ order: baseOrder, items, customer: baseCustomer, requestedAmount: 80 });
    expect(result.outcome).toBe('POTENTIAL_APPROVAL');
    expect(result.matchedPolicies.length).toBe(0);
  });
});
