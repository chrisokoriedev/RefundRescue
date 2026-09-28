// Base URL of the backend API.
// - Local dev: http://localhost:5000 (default)
// - Docker: NEXT_PUBLIC_API_URL is baked at build time and must point at the
//   host-exposed port (http://localhost:5000), since API calls happen in the
//   browser, not on the Docker network.
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
  adminAlert?: string;
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
  admin_alert?: string;
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
  clarificationCount?: number;
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

export interface ClarificationResponse {
  needsClarification: boolean;
  question?: string;
}

/**
 * Ask the backend whether this message needs ONE follow-up question before
 * running the full AI evaluation. Part of the multi-turn flow.
 */
export async function requestClarification(payload: {
  customerId: string;
  orderId: string;
  message: string;
  clarificationCount: number;
}): Promise<ClarificationResponse> {
  const res = await fetch(`${API_BASE}/api/refunds/clarify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    // On any failure, skip clarification and let the main evaluation decide.
    return { needsClarification: false };
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

export async function overrideTicket(
  id: string,
  payload: { decision: string; notes: string }
): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> {
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

export interface ChatMessageRecord {
  id: string;
  ticket_id?: string | null;
  order_id: string;
  customer_id: string;
  sender: 'customer' | 'ai' | 'agent';
  text: string;
  decision?: 'APPROVED' | 'DENIED' | 'ESCALATED' | null;
  confidence_score?: number | null;
  created_at: string;
}

export async function fetchChatHistory(orderId: string, customerId?: string): Promise<ChatMessageRecord[]> {
  const query = new URLSearchParams({ orderId });
  if (customerId) query.set('customerId', customerId);
  const res = await fetch(`${API_BASE}/api/chat/history?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  const json = await res.json();
  return json.data || [];
}

export interface ChatHistoryDetailedResponse {
  messages: ChatMessageRecord[];
  takeoverActive: boolean;
  takenOverBy?: string;
}

export async function fetchChatHistoryDetailed(orderId: string, customerId?: string): Promise<ChatHistoryDetailedResponse> {
  const query = new URLSearchParams({ orderId });
  if (customerId) query.set('customerId', customerId);
  const res = await fetch(`${API_BASE}/api/chat/history?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch chat history');
  const json = await res.json();
  return {
    messages: json.data || [],
    takeoverActive: Boolean(json.takeoverActive),
    takenOverBy: json.takenOverBy
  };
}

export async function handoverChatToAi(payload: {
  orderId: string;
  customerId: string;
  ticketId?: string;
}): Promise<{ success: boolean; takeoverActive: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/chat/handover-to-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to hand over chat to AI' }));
    throw new Error(err.error || err.message || 'Failed to hand over chat to AI');
  }
  return res.json();
}

export async function takeoverChatSession(payload: {
  orderId: string;
  customerId: string;
  ticketId?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/chat/takeover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to activate takeover' }));
    throw new Error(err.error || err.message || 'Failed to activate takeover');
  }
  return res.json();
}

export async function sendCustomerChatMessage(payload: {
  orderId: string;
  customerId: string;
  message: string;
  ticketId?: string;
}): Promise<ChatMessageRecord> {
  const res = await fetch(`${API_BASE}/api/chat/customer-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to send customer message' }));
    throw new Error(err.error || err.message || 'Failed to send customer message');
  }
  const json = await res.json();
  return json.data;
}

export async function sendAgentChatMessage(payload: {
  orderId: string;
  customerId: string;
  message: string;
  ticketId?: string;
}): Promise<ChatMessageRecord> {
  const res = await fetch(`${API_BASE}/api/chat/agent-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to send agent reply' }));
    throw new Error(err.error || err.message || 'Failed to send agent reply');
  }
  const json = await res.json();
  return json.data;
}

export async function fetchRecentChats(limit = 20): Promise<ChatMessageRecord[]> {
  const res = await fetch(`${API_BASE}/api/chat/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent chats');
  const json = await res.json();
  return json.data || [];
}

export async function clearChatHistory(orderId: string, customerId?: string): Promise<{ success: boolean; message: string }> {
  const params = new URLSearchParams({ orderId });
  if (customerId) params.append('customerId', customerId);
  const res = await fetch(`${API_BASE}/api/chat/history?${params.toString()}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to clear chat history' }));
    throw new Error(err.error || err.message || 'Failed to clear chat history');
  }
  return res.json();
}

export async function resetDatabaseData(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/reset-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to reset database' }));
    throw new Error(err.error || 'Failed to reset database');
  }
  return res.json();
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  isFinalSale: boolean;
  description: string;
}

export async function fetchProducts(): Promise<ProductItem[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch product catalog');
  const json = await res.json();
  return json.data || [];
}

export interface CreateTicketPayload {
  customerName: string;
  customerEmail?: string;
  loyaltyTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  productId: string;
  reason: string;
  requestedAmount?: number;
  orderAgeDays?: number;
  mode?: 'chat' | 'evaluate';
}

export interface CreateTicketResponseData {
  mode: 'chat' | 'evaluate';
  ticket: RefundTicket;
  evaluation?: RefundEvaluationResponse;
  customer: Customer;
  order: Order;
  reason?: string;
}

export async function createSimulatedTicket(payload: CreateTicketPayload): Promise<{
  success: boolean;
  message: string;
  data: CreateTicketResponseData;
}> {
  const res = await fetch(`${API_BASE}/api/tickets/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create ticket' }));
    throw new Error(err.error || err.message || 'Failed to create ticket');
  }
  return res.json();
}



