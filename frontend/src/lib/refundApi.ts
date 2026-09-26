const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Customer {
  id: string;
  name: string;
  email: string;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  past_orders_count: number;
  past_refunds_count: number;
  created_at: string;
  orders?: Order[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  is_final_sale: number;
  category: string;
}

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  currency: string;
  status: string;
  order_date: string;
  shipping_address: string;
  scenario_description?: string;
  expected_outcome?: string;
  items?: OrderItem[];
}

export interface RefundEvaluationResponse {
  ticketId: string;
  orderId: string;
  customerId: string;
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  matchedPolicies: string[];
  policyClauses: string[];
  reasoningSummary: string;
  customerResponse: string;
  promptInjectionDetected: boolean;
  actionItems: string[];
  engineUsed: string;
  createdAt: string;
}

export interface PolicyRule {
  code: string;
  name: string;
  description: string;
  enforcement: string;
  defaultOutcome: string;
}

export interface AdminMetrics {
  totalTickets: number;
  approvedCount: number;
  deniedCount: number;
  escalatedCount: number;
  injectionAttempts: number;
  totalRefundedAmount: number;
  averageTicketAmount: number;
  supervisorOverrides: number;
  approvalRate: number;
}

export interface RefundTicket {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  loyalty_tier: string;
  order_total: number;
  requested_amount: number;
  reason: string;
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  confidence_score: number;
  customer_response: string;
  reasoning_summary: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  prompt_injection_detected: boolean;
  policy_clauses: string[];
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  auditLogs?: Array<{
    id: string;
    actor: string;
    action: string;
    notes: string;
    created_at: string;
  }>;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/api/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  const json = await res.json();
  return json.data;
}

export async function fetchCustomerById(id: string): Promise<Customer> {
  const res = await fetch(`${API_BASE}/api/customers/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch customer ${id}`);
  const json = await res.json();
  return json.data;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/orders/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch order ${id}`);
  const json = await res.json();
  return json.data;
}

export async function submitRefundEvaluation(payload: {
  customerId: string;
  orderId: string;
  message: string;
  requestedAmount?: number;
}): Promise<RefundEvaluationResponse> {
  const res = await fetch(`${API_BASE}/api/refunds/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Evaluation failed' }));
    throw new Error(err.error || 'Evaluation failed');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchPolicyRules(): Promise<PolicyRule[]> {
  const res = await fetch(`${API_BASE}/api/policy/rules`);
  if (!res.ok) throw new Error('Failed to fetch policy rules');
  const json = await res.json();
  return json.data;
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch(`${API_BASE}/api/admin/metrics`);
  if (!res.ok) throw new Error('Failed to fetch admin metrics');
  const json = await res.json();
  return json.data;
}

export async function fetchAdminTickets(params?: { status?: string; riskLevel?: string }): Promise<RefundTicket[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
  const res = await fetch(`${API_BASE}/api/admin/tickets?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  const json = await res.json();
  return json.data;
}

export async function fetchAdminTicketById(id: string): Promise<RefundTicket> {
  const res = await fetch(`${API_BASE}/api/admin/tickets/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch ticket ${id}`);
  const json = await res.json();
  return json.data;
}

export async function overrideTicket(id: string, payload: { decision: string; notes: string }): Promise<any> {
  const res = await fetch(`${API_BASE}/api/admin/tickets/${id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Override failed' }));
    throw new Error(err.error || 'Override failed');
  }
  return res.json();
}
