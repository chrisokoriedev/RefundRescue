import { getToken, getApiKey } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Generic fetch wrapper ───────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<{
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}> {
  const token = getToken();
  const apiKey = getApiKey();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // JWT auth (Authorization: Bearer) + API key auth (X-API-Key)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error ${res.status}`);
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Metrics {
  totalCalls: number;
  recoveredRevenue: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  activeCalls: number;
  conversionRate: number;
}

export interface LogRecord {
  id: string;
  customerName: string;
  companyName: string;
  phone: string;
  scenario: string;
  mrr: number;
  status: "planned" | "scheduled" | "in_progress" | "completed" | "failed";
  outcome?: string;
  variantId?: string;
  planId?: string;
  callRunId?: string;
  timestamp: string;
  createdAt?: string;
}

export interface Playbook {
  id: string;
  name: string;
  scenario: string;
  promptTemplate: string;
  weight: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface VariantStats {
  variantId: string;
  variantName: string;
  scenario: string;
  totalCalls: number;
  recovered: number;
  failed: number;
  conversionRate: number;
}

export interface AnalyticsSummary {
  totalCalls: number;
  recoveredRevenue: number;
  conversionRate: number;
  avgCallDuration: number;
  byScenario: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  uptime: number;
  db: {
    connected: boolean;
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  revokedAt?: string;
  key?: string; // only on create
}

// ─── Metrics ─────────────────────────────────────────────────────────
export async function fetchMetrics(): Promise<Metrics> {
  const res = await apiFetch<Metrics>("/api/v1/metrics");
  return res.data;
}

// ─── Logs ────────────────────────────────────────────────────────────
export interface LogsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  status?: string;
  scenario?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchLogs(query: LogsQuery = {}): Promise<{
  data: LogRecord[];
  pagination: Pagination;
}> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.order) params.set("order", query.order);
  if (query.status) params.set("status", query.status);
  if (query.scenario) params.set("scenario", query.scenario);
  if (query.search) params.set("search", query.search);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);

  const res = await apiFetch<LogRecord[]>(`/api/v1/logs?${params.toString()}`);
  return { data: res.data, pagination: res.pagination! };
}

// ─── Playbooks ───────────────────────────────────────────────────────
export async function fetchPlaybooks(
  page = 1,
  limit = 20,
): Promise<{
  data: Playbook[];
  pagination: Pagination;
}> {
  const res = await apiFetch<Playbook[]>(
    `/api/v1/playbooks?page=${page}&limit=${limit}`,
  );
  return { data: res.data, pagination: res.pagination! };
}

export async function createPlaybook(data: {
  name: string;
  scenario: string;
  promptTemplate: string;
  weight?: number;
  active?: boolean;
}): Promise<Playbook> {
  const res = await apiFetch<Playbook>("/api/v1/playbooks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updatePlaybook(
  id: string,
  data: Partial<{
    name: string;
    scenario: string;
    promptTemplate: string;
    weight: number;
    active: boolean;
  }>,
): Promise<Playbook> {
  const res = await apiFetch<Playbook>(`/api/v1/playbooks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deletePlaybook(id: string): Promise<void> {
  await apiFetch(`/api/v1/playbooks/${id}`, { method: "DELETE" });
}

// ─── Analytics ───────────────────────────────────────────────────────
export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await apiFetch<AnalyticsSummary>("/api/v1/analytics");
  return res.data;
}

export async function fetchVariantStats(
  scenario?: string,
): Promise<VariantStats[]> {
  const params = scenario ? `?scenario=${scenario}` : "";
  const res = await apiFetch<VariantStats[]>(
    `/api/v1/analytics/variants${params}`,
  );
  return res.data;
}

// ─── Exports ─────────────────────────────────────────────────────────
export function exportCsvUrl(filters?: {
  status?: string;
  scenario?: string;
}): string {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.scenario) params.set("scenario", filters.scenario);
  return `/api/v1/exports/csv?${params.toString()}`;
}

export function exportJsonUrl(filters?: {
  status?: string;
  scenario?: string;
}): string {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.scenario) params.set("scenario", filters.scenario);
  return `/api/v1/exports/json?${params.toString()}`;
}

// ─── Auth ────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await apiFetch<{
    accessToken: string;
    tokenType: string;
    expiresIn: string;
    user?: { email: string; role?: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function register(email: string, password: string, name?: string) {
  const res = await apiFetch<{
    accessToken: string;
    tokenType: string;
    expiresIn: string;
    user?: { email: string; name?: string; role?: string };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  return res.data;
}

export async function refreshToken() {
  const res = await apiFetch<{
    accessToken: string;
    tokenType: string;
    expiresIn: string;
  }>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return res.data;
}

// ─── API Keys ────────────────────────────────────────────────────────
export async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await apiFetch<ApiKey[]>("/api/v1/api-keys");
  return res.data;
}

export async function generateApiKey(data: {
  name: string;
  scopes?: string[];
}): Promise<ApiKey> {
  const res = await apiFetch<ApiKey>("/api/v1/api-keys", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiFetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
}

// ─── Health ──────────────────────────────────────────────────────────
export async function fetchHealth(): Promise<HealthStatus> {
  const res = await apiFetch<HealthStatus>("/health");
  return res.data;
}

// ─── Prompt Preview ──────────────────────────────────────────────────
export async function getPromptPreview(data: {
  scenario: string;
  customerName: string;
  companyName: string;
  mrr: number | string;
  planName?: string;
}): Promise<string> {
  const res = await apiFetch<{ prompt: string }>("/api/v1/preview-prompt", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data.prompt;
}

// ─── Trigger Mock Call ──────────────────────────────────────────────
export async function triggerMockCall(data: {
  customerName: string;
  phone: string;
  mrr: number | string;
  churnType: string;
  companyName: string;
  scenario?: string;
  planName?: string;
}): Promise<{ runId: string; status: string; message: string }> {
  const res = await apiFetch<{
    runId: string;
    status: string;
    message: string;
  }>("/api/v1/mock/trigger-call", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

// ─── Mock Stripe Endpoints ──────────────────────────────────────────
export async function triggerMockWebhook(data: {
  customerName: string;
  phone: string;
  email: string;
  mrr: number | string;
  hasSavedCard: boolean;
  eventType: string;
}): Promise<{ logId: string }> {
  const res = await apiFetch<{ logId: string }>("/api/mock/webhook/stripe", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function completeMockCheckout(logId: string): Promise<void> {
  await apiFetch("/api/mock/checkout/complete", {
    method: "POST",
    body: JSON.stringify({ logId }),
  });
}
