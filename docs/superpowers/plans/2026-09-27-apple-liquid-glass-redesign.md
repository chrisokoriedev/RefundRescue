# Apple "Liquid Glass" & Distinctive Motion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the RevRescue frontend into an Apple-inspired "Liquid Glass" interface using real NPM glass packages (`react-glass-rim`), a human-preferred motion library (`@formkit/auto-animate`), a distinctive luxury color palette replacing generic blue, bespoke typography, and larger, more visible widgets.

**Architecture:** Integrate `react-glass-rim` and `@formkit/auto-animate` into Next.js 16 (Turbopack). Establish an Apple Human Interface Guidelines (HIG) design system in `globals.css` with multi-tier frosted materials, continuous squircle radii, and specular rim highlights. Overhaul the color system from generic `#3861fb` to an Electric Iris / Apple Deep Indigo (`#4F46E5` / `#5E5CE6`) and International Orange (`#FF5500`) palette, backed by Apple SF Pro typography.

**Tech Stack:** Next.js 16 (React 19, Turbopack), Tailwind CSS, `react-glass-rim`, `@formkit/auto-animate`, Lucide Icons.

---

## Global Constraints
- Must compile cleanly with `npm run build` (Turbopack + TypeScript, 0 errors).
- All 42/42 backend tests must remain passing (`npm test`).
- Preserve all existing core functionality: Gemini Flash deliberation, policy evaluation, ticket creation modal (3 buttons), audit drawer, and multi-turn chat.
- Zero placeholder code; every change must be fully functional.

---

## Proposed Design System Tokens

### 1. Distinctive Color System (Replacing Generic AI Blue)
* **Primary Accent (Brand)**: **Electric Iris / Apple System Indigo** (`#4F46E5` base, `#4338CA` hover, `#EEF2FF` tint) — sophisticated, distinctive, human-crafted.
* **Secondary Signal**: **International Orange** (`#FF5500` / `#FF6433`) — used for alerts, high risk, and key action highlights (inspired by Apple Watch Ultra).
* **Success / Approval**: **Cupertino Jade / Emerald** (`#059669` / `#10B981`, `#ECFDF5` tint).
* **Caution / Escalation**: **Warm Amber** (`#D97706`, `#FFFBEB` tint).
* **Neutral Canvas**: **Liquid Mist / Titanium** (`#F8FAFC` background, `#0F172A` obsidian typography, `#E2E8F0` subtle borders).

### 2. Apple Typography Hierarchy (Replacing Generic Inter/Roboto)
* **Font Family**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif`.
* **Page Titles**: `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`.
* **Section Headers**: `text-base sm:text-lg font-bold tracking-tight text-slate-900`.
* **Subtitles**: `text-xs text-slate-500 font-medium`.
* **KPI Numbers**: `text-3xl sm:text-4xl font-black tracking-tight text-slate-900`.
* **Pill Badges**: `text-[10px] font-bold uppercase tracking-wider`.

### 3. Apple "Liquid Glass" Material Hierarchy
* **Tier 1 (Subtle / Pill Glass)**: `backdrop-blur-md bg-white/60 border border-white/80 shadow-2xs`
* **Tier 2 (Card / Surface Glass)**: `backdrop-blur-xl bg-white/75 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
* **Tier 3 (Elevated / Modal Glass)**: `backdrop-blur-2xl bg-white/90 border border-white/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)]`
* **Specular Rim Lighting**: Powered by `react-glass-rim` and linear gradient borders (`linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2))`).

---

## Tasks

### Task 1: Install & Configure NPM Libraries (`react-glass-rim` & `@formkit/auto-animate`)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/app/globals.css`

**Interfaces:**
- Consumes: `@formkit/auto-animate`, `react-glass-rim`
- Produces: CSS utility classes (`.glass-pill`, `.glass-card-apple`, `.glass-modal`, `.rim-highlight`) and auto-animate hooks.

- [x] **Step 1: Install packages**
  Run: `npm install react-glass-rim @formkit/auto-animate` in `frontend/`.
- [x] **Step 2: Add Apple Liquid Glass utilities to `globals.css`**
  Define `.glass-surface-subtle`, `.glass-card-apple`, `.liquid-glass-pill`, and `.specular-rim` with backdrop filters, gradient borders, and squircle radiuses.
- [x] **Step 3: Verify build**
  Run: `npm run build` in `frontend/`.

---

### Task 2: Implement Apple SF Typography & Brand Color Token Overhaul

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/components/layout/AppShell.tsx`

**Interfaces:**
- Replaces: `#3861FB` with Electric Iris (`#4F46E5`) & International Orange accents.
- Replaces: Browser default fonts with Apple SF Pro / Plus Jakarta Sans font stack.

- [x] **Step 1: Update font stack in `layout.tsx` and `globals.css`**
  Set font-family to Apple SF Pro stack with tight letter-spacing.
- [x] **Step 2: Update AppShell navigation, header, and active indicators**
  Apply floating glass navigation bar, refined brand badge with Electric Iris gradient, and Apple-style squircle buttons.
- [x] **Step 3: Verify build**
  Run: `npm run build` in `frontend/`.

---

### Task 3: Enlarge and Elevate Dashboard Widgets (Admin Metrics & Support Table)

**Files:**
- Modify: `frontend/src/components/admin/MetricsSummary.tsx`
- Modify: `frontend/src/components/admin/TicketTable.tsx`
- Modify: `frontend/src/components/admin/AuditDrawer.tsx`

**Interfaces:**
- Enlarges: KPI cards (bigger typography `text-3xl`, larger padding, prominent glass pill badges).
- Enhances: Table with fluid auto-animate rows, Liquid Glass status pills (`react-glass-rim`), and higher contrast.

- [x] **Step 1: Enhance `MetricsSummary.tsx`**
  Expand card dimensions, apply `.glass-card-apple`, enlarge KPI digits to `text-3xl font-black`, and add glass pill trend badges.
- [x] **Step 2: Add `@formkit/auto-animate` and glass pills to `TicketTable.tsx`**
  Wrap table body in `useAutoAnimate()` for smooth row filtering/updates. Apply `react-glass-rim` or glass pill styling to status and risk badges.
- [x] **Step 3: Update `AuditDrawer.tsx` with Elevated Glass Material**
  Refine drawer with `backdrop-blur-2xl bg-white/90` and Electric Iris accents.
- [x] **Step 4: Verify build**
  Run: `npm run build` in `frontend/`.

---

### Task 4: Upgrade Customer Portal & Interactive Chat with Liquid Glass & Motion

**Files:**
- Modify: `frontend/src/components/refund/PersonaSwitcher.tsx`
- Modify: `frontend/src/components/refund/OrderSelector.tsx`
- Modify: `frontend/src/components/refund/RefundChat.tsx`
- Modify: `frontend/src/components/refund/DecisionBadge.tsx`

**Interfaces:**
- Connects: `@formkit/auto-animate` to chat messages list and persona pills.
- Applies: Liquid Glass styling to customer selection pills, order context cards, and decision badges.

- [x] **Step 1: Update `PersonaSwitcher.tsx` & `OrderSelector.tsx`**
  Make persona pills larger, more tactile, and floating with glass highlight on active selection.
- [x] **Step 2: Integrate `useAutoAnimate` in `RefundChat.tsx`**
  Animate new customer messages, AI thinking steps, and decision cards smoothly without layout jumps.
- [x] **Step 3: Update `DecisionBadge.tsx` with Apple-style glass pills**
  Create specular rim lighting and vibrant status pills for `APPROVED`, `DENIED`, and `ESCALATED`.
- [x] **Step 4: Verify build**
  Run: `npm run build` in `frontend/`.

---

### Task 5: Upgrade `CreateTicketModal` & `ResetDataModal` to Apple Modal Aesthetics

**Files:**
- Modify: `frontend/src/components/admin/CreateTicketModal.tsx`
- Modify: `frontend/src/components/admin/ResetDataModal.tsx`

**Interfaces:**
- Applies: Tier 3 Elevated Glass material, squircle continuous curves, and refined button styling with Electric Iris and subtle glass secondary buttons.

- [x] **Step 1: Update `CreateTicketModal.tsx`**
  Apply `.glass-modal`, enlarge input padding and labels, update 3 action buttons with Electric Iris and glass styling.
- [x] **Step 2: Update `ResetDataModal.tsx`**
  Match Apple alert dialog styling.
- [x] **Step 3: Verify build & tests**
  Run: `npm run build` in `frontend/` and `npm test` in `backend/`.

---

### Task 6: Visual End-to-End Verification in Browser

- [x] **Step 1: Test Admin Dashboard (`/admin`)**
  Verify bigger KPI widgets, glass pill badges, Electric Iris brand theme, and smooth table filtering.
- [x] **Step 2: Test Customer Portal (`/`)**
  Verify larger persona pills, Liquid Glass order context card, and smooth chat message animations via `@formkit/auto-animate`.
- [x] **Step 3: Capture browser screenshots and verify complete responsiveness.**
