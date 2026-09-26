# RevRescue Internal API Documentation

## Executive Summary
This document catalogs all REST endpoints exposed by the RevRescue Backend. All routes return a consistent `{ success, message, data }` response format and use Zod validation. Routes are versioned under `/api/v1/` with backward-compatible `/api/` aliases.

> [!TIP]
> Interactive API documentation is available at **`/api/docs`** (Swagger UI) and **`/api/docs.json`** (OpenAPI spec). Use these for testing and integration.

---

## Global Conventions

### Response Format
Every endpoint returns:
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```
Errors return:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { "field": ["Field-specific error"] }
}
```

### Headers
| Header | Direction | Purpose |
|--------|-----------|---------|
| `X-Request-Id` | Response | UUID for tracing |
| `X-RateLimit-Limit` | Response | Max requests per window |
| `X-RateLimit-Remaining` | Response | Requests remaining |
| `X-RateLimit-Reset` | Response | Window reset timestamp |
| `Sunset` | Response | v1 sunset date (2027-01-01) |
| `Deprecation` | Response | Deprecation notice |
| `Authorization` | Request | `Bearer <JWT_TOKEN>` |
| `X-API-Key` | Request | API key for programmatic access |
| `Idempotency-Key` | Request | Prevent duplicate POST operations |
| `stripe-signature` | Request | Stripe webhook signature |

### Rate Limiting
- **200 requests per minute** per IP address
- Sliding window algorithm
- Returns `429 Too Many Requests` when exceeded

### Pagination
Supported on `GET /logs` and `GET /playbooks`:
```
GET /api/v1/logs?page=1&limit=20&sortBy=timestamp&order=desc
```
Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 1. Authentication

### `POST /auth/login`
Login and receive a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": "24h",
    "user": {
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

### `POST /auth/refresh`
Refresh an expired JWT token.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": "24h"
  }
}
```

---

## 2. API Key Management

### `POST /api/v1/api-keys`
Generate a new API key. **Save the key immediately — it won't be shown again.**

**Headers:** `Authorization: Bearer <JWT>`

**Request:**
```json
{
  "name": "Flutter App Key",
  "scopes": ["read", "write"],
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "API key generated. Save the key — it won't be shown again.",
  "data": {
    "id": "key_abc123",
    "name": "Flutter App Key",
    "prefix": "rvs_",
    "scopes": ["read", "write"],
    "expiresAt": "2027-01-01T00:00:00Z",
    "createdAt": "2026-08-03T10:00:00Z",
    "key": "rvs_a1b2c3d4e5f6g7h8..."
  }
}
```

### `GET /api/v1/api-keys`
List all API keys (keys are hashed, only prefixes shown).

**Headers:** `Authorization: Bearer <JWT>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API keys",
  "data": [
    {
      "id": "key_abc123",
      "name": "Flutter App Key",
      "prefix": "rvs_",
      "scopes": ["read", "write"],
      "expiresAt": "2027-01-01T00:00:00Z",
      "createdAt": "2026-08-03T10:00:00Z",
      "revokedAt": null
    }
  ]
}
```

### `DELETE /api/v1/api-keys/:id`
Revoke an API key.

**Headers:** `Authorization: Bearer <JWT>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API key revoked"
}
```

### `POST /api/v1/api-keys/validate`
Validate an API key.

**Request:**
```json
{
  "key": "rvs_a1b2c3d4e5f6g7h8..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Key is valid",
  "data": { "valid": true, "scopes": ["read", "write"] }
}
```

---

## 3. System Health

### `GET /health`
Health check with database ping. Returns 503 if DB is unreachable.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Service healthy",
  "data": {
    "status": "ok",
    "service": "RevRescue Voice Concierge Engine",
    "version": "1.0.0",
    "timestamp": "2026-08-03T10:00:00Z",
    "uptime": 3600.5,
    "db": {
      "connected": true,
      "totalCount": 5,
      "idleCount": 3,
      "waitingCount": 0
    }
  }
}
```

### `GET /api`
API information and endpoint listing.

### `GET /api/docs`
Swagger UI interactive documentation.

### `GET /api/docs.json`
OpenAPI JSON specification.

---

## 4. Metrics & Dashboard

### `GET /api/v1/metrics`
High-level KPIs for the dashboard.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Metrics retrieved",
  "data": {
    "totalCalls": 142,
    "recoveredRevenue": 4500.0,
    "successfulRecoveries": 85,
    "failedRecoveries": 55,
    "activeCalls": 2,
    "conversionRate": 60
  }
}
```

---

## 5. Recovery Logs

### `GET /api/v1/logs`
Paginated, filterable, searchable recovery logs.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sortBy` | string | `timestamp` | Sort field (whitelisted) |
| `order` | string | `desc` | `asc` or `desc` |
| `status` | string | — | Filter by status |
| `scenario` | string | — | Filter by scenario |
| `search` | string | — | Search across name, company, phone |
| `dateFrom` | string | — | ISO date filter start |
| `dateTo` | string | — | ISO date filter end |

**Example:**
```
GET /api/v1/logs?page=1&limit=10&status=recovered&search=john&sortBy=mrr&order=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logs retrieved",
  "data": [
    {
      "id": "uuid-1234",
      "customerName": "John Doe",
      "companyName": "Acme Corp",
      "phone": "+1234567890",
      "scenario": "payment_failed",
      "mrr": 500,
      "status": "completed",
      "outcome": "recovered",
      "variantId": "variant_a",
      "timestamp": "2026-08-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 6. Playbooks Management

### `GET /api/v1/playbooks`
List all playbooks (supports pagination).

**Query Parameters:** `page`, `limit` (same as logs)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Playbooks retrieved",
  "data": [
    {
      "id": "abc-123",
      "name": "Enterprise Payment Failure",
      "scenario": "payment_failed",
      "promptTemplate": "Hello {customerName}...",
      "weight": 80,
      "active": true,
      "createdAt": "2026-08-01T10:00:00Z",
      "updatedAt": "2026-08-03T09:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### `GET /api/v1/playbooks/:id`
Get a single playbook by UUID.

### `POST /api/v1/playbooks`
Create a new playbook.

**Request:**
```json
{
  "name": "Enterprise Payment Failure",
  "scenario": "payment_failed",
  "promptTemplate": "Hello {customerName}, we noticed your payment failed...",
  "weight": 80,
  "active": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Playbook created",
  "data": {
    "id": "new-uuid-456",
    "name": "Enterprise Payment Failure",
    "scenario": "payment_failed",
    "promptTemplate": "Hello {customerName}...",
    "weight": 80,
    "active": true,
    "createdAt": "2026-08-03T10:00:00Z",
    "updatedAt": "2026-08-03T10:00:00Z"
  }
}
```

### `PUT /api/v1/playbooks/:id`
Update a playbook (partial update). All body fields optional.

### `DELETE /api/v1/playbooks/:id`
Soft delete a playbook (sets `deletedAt` timestamp, doesn't remove).

---

## 7. Analytics

### `GET /api/v1/analytics`
Overall analytics summary.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics summary",
  "data": {
    "totalCalls": 142,
    "recoveredRevenue": 4500.0,
    "conversionRate": 60,
    "avgCallDuration": 95,
    "byScenario": { "payment_failed": 100, "subscription_deleted": 42 },
    "byStatus": { "recovered": 85, "failed": 55, "in_progress": 2 }
  }
}
```

### `GET /api/v1/analytics/variants`
Variant performance stats. Optional `?scenario=payment_failed`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Variant stats",
  "data": [
    {
      "variantId": "variant_a",
      "variantName": "Empathetic",
      "scenario": "payment_failed",
      "totalCalls": 50,
      "recovered": 35,
      "failed": 15,
      "conversionRate": 70
    },
    {
      "variantId": "variant_b",
      "variantName": "Direct",
      "scenario": "payment_failed",
      "totalCalls": 50,
      "recovered": 30,
      "failed": 20,
      "conversionRate": 60
    }
  ]
}
```

### `GET /api/v1/analytics/winner/:scenario`
Get the statistically winning variant for a scenario (requires ≥5 calls per variant).

---

## 8. Exports

### `GET /api/v1/exports/csv`
Export logs as CSV. Supports filtering.

**Query Parameters:** `status`, `scenario`, `dateFrom`, `dateTo`

**Response:** CSV file with `Content-Disposition: attachment`

### `GET /api/v1/exports/json`
Export logs as JSON with filtering.

### `GET /api/v1/exports/summary`
Export summary statistics (total calls, recovery rate, revenue, etc.).

---

## 9. Testing & Simulation

### `POST /api/v1/preview-prompt`
Generate a compiled prompt without initiating a call.

**Request:**
```json
{
  "scenario": "payment_failed",
  "customerName": "John Doe",
  "companyName": "Acme Corp",
  "mrr": 299,
  "planName": "Pro Tier"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Prompt preview generated",
  "data": {
    "prompt": "Hello John Doe, we noticed your payment for the Pro Tier plan failed..."
  }
}
```

### `POST /api/v1/mock/trigger-call`
Manually trigger a CALL-E call for testing (bypasses Stripe webhook).

**Request:**
```json
{
  "customerName": "John Doe",
  "phone": "+1234567890",
  "mrr": 299,
  "churnType": "involuntary",
  "companyName": "RevRescue Client"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Call triggered",
  "data": {
    "runId": "run_test_123",
    "status": "PREPARING",
    "message": "Call initiated"
  }
}
```

---

## 10. Webhooks

### `POST /api/webhooks/stripe`
Stripe webhook receiver. Requires `stripe-signature` header.

> [!CAUTION]
> This endpoint uses `express.raw()` body parsing for signature verification. Do not modify the request body before verification.

**Headers:** `stripe-signature: t=...,v1=...`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invoice payment failure processed for Test Customer",
  "data": { "received": true, "processed": true }
}
```

**Behavior:**
- `invoice.payment_failed` → Delayed execution (12-24h, configurable via `PAYMENT_FAILED_DELAY_HOURS`)
- `customer.subscription.deleted` → Immediate execution
- Duplicate `event.id` → Returns 200, skips processing (idempotency)
- Phone number fetched from Stripe API if missing from invoice
- Failed calls are queued for retry (3 attempts: 30s, 2min, 5min)

### `POST /api/webhooks/calle`
CALL-E webhook callback for real-time call status updates.

**Request:**
```json
{
  "call_id": "run_test_123",
  "status": "COMPLETED",
  "message": "Call completed",
  "summary": "Customer agreed to update payment method",
  "transcript": "Agent: Hello... Customer: Yes, please send the link...",
  "outcome": null,
  "activity": []
}
```

---

## 11. WebSocket

### `ws://localhost:PORT/ws/dashboard`
Real-time dashboard updates via Socket.IO.

**Events emitted:**
| Event | Payload |
|-------|---------|
| `call:started` | `{ runId, customerName, scenario }` |
| `call:status` | `{ runId, status, message }` |
| `call:completed` | `{ runId, status, outcome, duration }` |
| `metrics:updated` | `{ totalCalls, recoveredRevenue, ... }` |
| `variant:result` | `{ variantId, scenario, outcome }` |

---

## 12. Environment Variables

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `PORT` | 3001 | No | Server port |
| `DATABASE_URL` | — | **Yes** | Neon PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | — | **Yes (prod)** | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | — | **Yes (prod)** | Stripe webhook signature secret |
| `CORS_ORIGINS` | `http://localhost:3000` | No | Comma-separated allowed origins |
| `JWT_SECRET` | `dev-secret...` | No | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | No | Token expiry duration |
| `PAYMENT_FAILED_DELAY_HOURS` | `12` | No | Delay before calling on payment failure |
| `SENTRY_DSN` | (empty) | No | Sentry error tracking DSN |
| `CALLE_CLI_PATH` | `calle` | No | Path to CALL-E CLI |

---

## 13. Backward Compatibility

All `/api/v1/` routes are mirrored at `/api/` for backward compatibility:
- `/api/metrics` → same as `/api/v1/metrics`
- `/api/logs` → same as `/api/v1/logs`
- `/api/playbooks` → same as `/api/v1/playbooks`
- `/api/exports` → same as `/api/v1/exports`
- `/api/analytics` → same as `/api/v1/analytics`
- `/api/api-keys` → same as `/api/v1/api-keys`

> [!WARNING]
> The `/api/` aliases are deprecated. Migrate to `/api/v1/` before v2 release (2027-01-01).
