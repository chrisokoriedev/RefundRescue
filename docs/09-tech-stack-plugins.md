# Tech Stack & Plugins

## Executive Summary
This document catalogs all technologies, frameworks, and plugins used across RevRescue. It serves as a definitive reference for onboarding and understanding the dependency graph.

> [!NOTE]
> All new dependencies must be audited for security and bundle size before introduction. Bloat is strictly prohibited.

---

## 1. Frontend (Next.js Application)

| Category | Technology |
|----------|-----------|
| Framework | Next.js (App Router, React 18+) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS (Utility-first) |
| Component Library | Shadcn UI (Radix UI primitives) |
| Icons | `lucide-react` |
| Charts | `recharts` |
| HTTP Client | Native `fetch` API |
| State | React Server Components + Client Components |

---

## 2. Backend (Express Service)

| Category | Technology | Purpose |
|----------|-----------|---------|
| Runtime | Node.js | Server runtime |
| Framework | Express.js | HTTP server |
| Language | TypeScript | Type safety |
| Database Client | `pg` | PostgreSQL native client |
| Environment | `dotenv` | Env var management |
| UUIDs | `uuid` v4 | Deterministic log IDs |
| Validation | `zod` | Request/response schemas |
| Auth | `jsonwebtoken` | JWT token generation/verification |
| Logging | `pino` + `pino-http` | Structured JSON logging |
| Error Tracking | `@sentry/node` | Production error monitoring |
| Security | `helmet` | HTTP security headers |
| API Docs | `swagger-jsdoc` + `swagger-ui-express` | OpenAPI/Swagger |
| Real-time | `socket.io` | WebSocket dashboard updates |
| Stripe | `stripe` | Signature verification + API calls |
| CALL-E | `@call-e/cli` | Voice AI integration |

---

## 3. Infrastructure & Third-Party Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Neon** | Serverless PostgreSQL database | ✅ Active |
| **Stripe** | Billing, webhooks, payment processing | ✅ Active |
| **CALL-E** | Voice AI platform (PSTN calls) | ✅ Active (CLI) |
| **Sentry** | Error tracking & monitoring | ✅ Configured |
| **Slack** | Team notifications | ✅ Active |

---

## 4. Developer Tools & MCP Servers

| Tool | Purpose | Status |
|------|---------|--------|
| **Neon MCP** | AI agent DB access (query schema, run SQL) | ✅ Active |
| **CALL-E MCP** | AI agent voice integration | ⏳ Pending |
| **GitHub MCP** | PR management, issue tracking | ⏳ Planned |

---

## 5. Testing

| Tool | Purpose |
|------|---------|
| `jest` | Unit & integration testing |
| `@types/jest` | TypeScript test types |
| `supertest` | HTTP endpoint testing |
| `tsx` | TypeScript execution (dev) |

---

## 6. Environment Variables

### Required (Production)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret |

### Optional
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | 3001 | Server port |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `JWT_SECRET` | `dev-secret...` | JWT signing key |
| `JWT_EXPIRES_IN` | `24h` | Token expiry |
| `PAYMENT_FAILED_DELAY_HOURS` | `12` | Delay before calling |
| `SENTRY_DSN` | (empty) | Sentry error tracking |
| `CALLE_CLI_PATH` | `calle` | CALL-E CLI path |
| `SLACK_WEBHOOK_URL` | (empty) | Slack notifications |
