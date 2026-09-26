# Frontend Architecture

## Executive Summary
The frontend of RevRescue is a modern, modular web application built with **Next.js (App Router)**. It provides a premium, industrial-grade UI/UX utilizing Tailwind CSS and Shadcn UI. The architecture enforces strict separation of concerns between data fetching (Server Components) and interactivity (Client Components).

> [!TIP]
> Always prefer React Server Components (RSC) for data fetching. Only use `"use client"` directives at the lowest possible leaf node when React hooks or native browser APIs are absolutely required.

---

## 1. Tech Stack
| Category | Technology |
|----------|-----------|
| Framework | Next.js (App Router, React 18+) |
| Language | TypeScript (Strict Mode) |
| Styling | Tailwind CSS (Utility-first) |
| Component Library | Shadcn UI (Radix UI primitives) |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Data Fetching | Native `fetch` with Next.js caching |

## 2. Component Architecture

```mermaid
graph TD
    A[app/layout.tsx - Server] --> B[Sidebar Navigation - Client]
    A --> C[Topbar - Client]
    A --> D{Page Content Routes}
    
    D --> E[app/page.tsx - Dashboard (Server)]
    D --> F[app/logs/page.tsx - Live Feed (Server)]
    D --> G[app/playbooks/page.tsx - Playbooks (Client)]
    D --> H[app/analytics/page.tsx - A/B Analytics (Server)]
    D --> I[app/settings/page.tsx - Configs (Client)]

    E --> J[Server Component: Fetch Metrics API]
    J --> K[Client Component: Recharts Graph]
    
    F --> L[Server Component: Fetch Logs API]
    L --> M[Client Component: Filterable Table]
```

## 3. Core Architectural Principles

### 3.1. Route Segmentation
| Route | Purpose | Target Audience |
|-------|---------|-----------------|
| `/` | Dashboard — KPIs, MRR, ROI overview | Founders, VP CS |
| `/logs` | Live Feed — Filterable audit data | CS Managers, RevOps |
| `/playbooks` | Prompt engineering & A/B config | CS Operations |
| `/analytics` | A/B test performance | Data team |
| `/settings` | API keys, webhooks, integrations | Admins |

### 3.2. Server vs. Client Components (RSC)
- **Server Components:** `page.tsx` and layout files — securely fetch data from Express backend
- **Client Components:** Interactive elements (date pickers, trigger buttons, charts, filter controls)

### 3.3. Design System (Shadcn UI & Tailwind)
- **Shadcn UI** provides accessible Radix primitives styled with Tailwind
- Colors mapped to CSS variables in `globals.css` (e.g., `bg-background`, `text-primary`)
- Dark/Light mode toggling via CSS variable swap

## 4. API Proxying & CORS

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/:path*",
      },
    ];
  },
};
```

**Backend CORS Configuration:**
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://revrescue.vercel.app
```

## 5. API Integration

### Authentication Flow
```
1. User visits /settings → enters credentials
2. POST /auth/login → receives JWT token
3. Token stored in localStorage/cookie
4. All API requests include Authorization: Bearer <token>
```

### API Key Flow (Programmatic Access)
```
1. POST /api/v1/api-keys → generate key (shown once)
2. Key stored securely in app
3. All requests include X-API-Key header
```

### Real-time Updates (WebSocket)
```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');

socket.on('call:started', (data) => { /* Update dashboard */ });
socket.on('call:completed', (data) => { /* Refresh metrics */ });
socket.on('metrics:updated', (data) => { /* Update KPIs */ });
```

## 6. Backend Endpoints Used by Frontend

| Endpoint | Used By |
|----------|---------|
| `GET /api/v1/metrics` | Dashboard KPIs |
| `GET /api/v1/logs` | Logs table |
| `GET /api/v1/playbooks` | Playbooks page |
| `POST /api/v1/playbooks` | Create playbook |
| `GET /api/v1/analytics` | Analytics page |
| `GET /api/v1/exports/csv` | Export button |
| `POST /auth/login` | Settings auth |
| `GET /health` | System status |
| `ws://.../ws/dashboard` | Real-time updates |
