# RevRescue: Architecture & System Design

RevRescue is an AI-powered customer support refund evaluation system built with a modular, layered full-stack architecture.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client["Frontend Layer (Next.js 16 + Tailwind CSS)"]
        UI_Customer["Customer Support Portal<br/>(Persona Picker + Order Drawer + Interactive Chat)"]
        UI_Admin["Admin & Support Dashboard<br/>(Metrics + Ticket Queue + Audit Trail + Manual Overrides)"]
        UI_Policy["Policy Inspector<br/>(Visual Rule Engine Specs)"]
    end

    subgraph Server["Backend API Layer (Express.js + TypeScript)"]
        API_Gateway["Express Router & Middleware<br/>(CORS, Helmet, Rate Limiter, Pino Logger)"]
        
        subgraph Pipeline["Multi-Stage Refund Evaluation Engine"]
            Guard["Stage 1: Prompt Injection Guardrail<br/>(Regex Patterns, Delimiter Checks, Role Inversion Filters)"]
            PreScreen["Stage 2: Deterministic Policy Pre-Screener<br/>(Order Age > 30d, Final Sale Flags, Value > $500)"]
            LLM_Deliberator["Stage 3: Gemini Flash AI Deliberator<br/>(Semantic Reasoner, Sentiment, Empathetic Draft)"]
            PostProcessor["Stage 4: Decision Synthesis & Audit Writer<br/>(Confidence Score, Policy Clauses, Ticket Storage)"]
        end

        DB_Layer["Data Access Layer<br/>(Better-SQLite3 / SQLite with Auto-Seed)"]
    end

    subgraph External["External AI Provider"]
        Gemini["Google Gemini Flash API<br/>(Structured JSON Output Mode)"]
        MockLLM["Local Heuristic AI Fallback<br/>(Zero-API-Key Offline Mode)"]
    end

    UI_Customer -->|POST /api/refunds/chat| API_Gateway
    UI_Admin -->|GET /api/admin/tickets| API_Gateway
    UI_Admin -->|POST /api/admin/tickets/:id/override| API_Gateway
    UI_Policy -->|GET /api/policy/rules| API_Gateway

    API_Gateway --> Guard
    Guard --> PreScreen
    PreScreen --> LLM_Deliberator
    LLM_Deliberator -->|API Call| Gemini
    LLM_Deliberator -.->|Fallback if no key| MockLLM
    LLM_Deliberator --> PostProcessor
    PostProcessor --> DB_Layer
```

---

## 2. Request Lifecycle Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Support User
    participant Frontend as Next.js UI
    participant Backend as Express Backend
    participant Guard as Injection Guardrail
    participant PolicyEngine as Policy Engine (Code)
    participant Gemini as Google Gemini Flash
    participant DB as SQLite DB
    actor Admin as Support Admin

    Customer->>Frontend: Select Order & submit refund reason: "Item arrived with broken glass"
    Frontend->>Backend: POST /api/refunds/evaluate { customerId, orderId, message }
    
    Backend->>DB: Query customer profile, order age, line items, and past refund history
    DB-->>Backend: Return Order { date: -5d, total: $180, isFinalSale: false, lineItems }

    Backend->>Guard: Scan input for jailbreak / system instruction overrides
    Guard-->>Backend: Status: PASSED (Threat Score: 0.02)

    Backend->>PolicyEngine: Evaluate deterministic rules
    Note over PolicyEngine: Date < 30d? PASS<br/>Final sale? NO<br/>Amount > $500? NO ($180)
    PolicyEngine-->>Backend: Pre-Screen Result: POTENTIAL_APPROVAL (requires claim validation)

    Backend->>Gemini: Deliberate with system prompt + policy rules + order context
    Gemini-->>Backend: JSON { decision: "APPROVED", confidence: 0.94, reasoning: "Damaged item qualifies under POL-004", customerResponse: "..." }

    Backend->>DB: INSERT into REFUND_TICKETS & AUDIT_LOGS
    Backend-->>Frontend: 200 OK { ticketId, decision: "APPROVED", customerResponse, badges, policyClauses }
    Frontend-->>Customer: Render empathetic confirmation + return instructions

    Note over Admin,Frontend: Real-time update in Admin Dashboard
    Admin->>Frontend: Inspects Ticket in Support Queue
    Frontend->>Backend: GET /api/admin/tickets/:id
    Backend-->>Frontend: Full audit trace (prompt, response, risk score, deterministic checks)
```

---

## 3. Core API Endpoints

### Customer & Order Endpoints
- `GET /api/customers` - Returns all 15 synthetic customer personas with loyalty tier and past refund stats.
- `GET /api/customers/:id` - Returns individual customer details and full order history.
- `GET /api/orders/:id` - Returns order items, dates, final sale tags, and tracking status.

### Refund & Chat Endpoints
- `POST /api/refunds/chat` - Interactive chat endpoint supporting continuous conversational turns with AI support agent.
- `POST /api/refunds/evaluate` - Single-step submission returning structured evaluation (`decision`: `APPROVED` | `DENIED` | `ESCALATED`, reasoning, customer response, risk score, rule hits).
- `GET /api/policy/rules` - Returns list of active business rules.

### Admin & Support Endpoints
- `GET /api/admin/metrics` - High-level metrics: Total requests, Approval rate, Escalations in queue, Total refund value, Average processing time.
- `GET /api/admin/tickets` - List of all refund tickets with filter by status (`APPROVED`, `DENIED`, `ESCALATED`, `OVERRIDDEN`) and risk level.
- `GET /api/admin/tickets/:id` - Full audit inspection view (conversation transcript, prompt injection scan result, raw LLM reasoning, code pre-screener result).
- `POST /api/admin/tickets/:id/override` - Human-in-the-loop action: Supervisor overrides decision (`APPROVED`, `DENIED`, `ESCALATED`) with mandatory audit notes.

---

## 4. Containerization Strategy

The repository includes a top-level `docker-compose.yml` linking:
1. **`revrescue-backend`**:
   - Node 20 LTS Alpine image
   - Compiles TypeScript and runs Express API on port `5000`
   - SQLite database volume mounted for instant zero-dependency data persistence
   - Pre-seeds 15 customer profiles on initial launch
2. **`revrescue-frontend`**:
   - Next.js 16 container running on port `3000`
   - Proxies API requests to `http://revrescue-backend:5000`
   - Built-in hot-reloading for local development

Single command bootstrap:
```bash
docker-compose up --build
```
Everything spins up in under 60 seconds with no external database dependencies required.
