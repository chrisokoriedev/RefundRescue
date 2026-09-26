# UI/UX Blueprint & Page Definitions

## Executive Summary
RevRescue provides a premium, enterprise-grade SaaS experience with a clean, multi-page layout supporting A/B Testing, Slack Webhooks, CSV Exports, and real-time dashboard updates.

> [!NOTE]
> All UI components must adhere to the central design system defined in `globals.css` and use Shadcn UI primitives for consistent spacing, typography, motion, and WCAG accessibility.

---

## 1. Global Layout & Navigation
**Component:** `app/layout.tsx`

| Element | Position | Purpose |
|---------|----------|---------|
| Sidebar | Left | Navigation: Dashboard, Logs, Playbooks, Analytics, Settings |
| Header | Top (sticky) | Workspace name, theme toggle (Dark/Light), user profile |
| Main Content | Center | Page-specific content |

---

## 2. Main Dashboard (`/`)
**Purpose:** Executive overview of system health, MRR recovered, and ROI.

**Key Components:**
- **Hero KPI Metrics:** 4 large cards — Total MRR Saved, Rescue Success Rate, Active Campaigns, Calls in Progress
- **MRR Trend Chart (Recharts):** Dynamic area/bar chart showing MRR saved over last 30 days
- **A/B Test Winner Widget:** Real-time performance of current voice prompt A/B test
- **Recent Activity Mini-Feed:** 3-5 most recent recovery attempts
- **System Health Indicator:** DB connection status, uptime, pool stats

**Data Sources:**
- `GET /api/v1/metrics` — KPI data
- `GET /api/v1/analytics` — A/B test performance
- `ws://.../ws/dashboard` — Real-time updates

---

## 3. Recovery Logs (`/logs`)
**Purpose:** Detailed auditing, forensics, and tracking of every RevRescue intervention.

**Key Components:**
- **Filterable Data Table:** Interactive table with server-side pagination
- **Search Bar:** Search across customer name, company, phone
- **Filter Controls:** Status, scenario, date range, A/B variant
- **Sort Controls:** Click column headers (MRR, timestamp, status)
- **CSV Export Button:** 1-click download with current filters applied
- **JSON Export Button:** Download raw data for analysis

**Columns:**
| Column | Description |
|--------|-------------|
| Customer Name | Client name |
| Company | Company name |
| Phone | Phone number |
| MRR at Risk ($) | Monthly recurring revenue |
| A/B Variant | Which prompt variant was used |
| Status | planned / scheduled / completed / failed |
| Outcome | recovered / failed / no_answer / voicemail |
| Timestamp | When the call occurred |

**Data Sources:**
- `GET /api/v1/logs?page=1&limit=20&status=recovered&search=john`
- `GET /api/v1/exports/csv?status=recovered`

---

## 4. Playbooks (`/playbooks`)
**Purpose:** Strategy, prompt engineering, and agent configuration.

**Key Components:**
- **Playbook List:** All active and inactive playbooks
- **Create Playbook Form:** Name, scenario, prompt template, weight
- **A/B Testing Configuration:** Two prompts per scenario, weight distribution
- **Prompt Preview:** See compiled prompt with sample customer data
- **Delay Configuration:** Slider for payment_failed delay (12-24h)

**Data Sources:**
- `GET /api/v1/playbooks`
- `POST /api/v1/playbooks`
- `POST /api/v1/preview-prompt`

---

## 5. Analytics (`/analytics`)
**Purpose:** A/B test performance and recovery metrics.

**Key Components:**
- **Variant Performance Table:** Calls, recoveries, conversion rate per variant
- **Winner Indicator:** Statistical winner for each scenario (requires ≥5 calls)
- **Scenario Breakdown:** payment_failed vs subscription_deleted performance
- **Trend Charts:** Recovery rate over time

**Data Sources:**
- `GET /api/v1/analytics`
- `GET /api/v1/analytics/variants`
- `GET /api/v1/analytics/winner/payment_failed`

---

## 6. Settings (`/settings`)
**Purpose:** System configuration and integrations.

**Key Components:**
- **Authentication Card:** Login form, JWT token display
- **API Key Management:** Generate, list, revoke API keys
- **Stripe Connection Card:** Masked inputs for `STRIPE_SECRET_KEY`, webhook URL copy button
- **Slack/Discord Alerts Card:** Webhook URL input, notification toggles
- **System Health Card:** DB connection status, pool stats, uptime

**Data Sources:**
- `POST /auth/login`
- `POST /api/v1/api-keys`
- `GET /health`
