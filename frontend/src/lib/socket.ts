import { io, type Socket } from "socket.io-client";

/**
 * Real-time WebSocket client (#21).
 *
 * Connects to the backend Socket.IO server on the /dashboard namespace
 * (path /ws) and exposes typed helpers for every event the backend emits:
 *   call:started | call:status | call:completed | metrics:updated | abtest:result | sms:sent
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

let socket: Socket | null = null;

// ─── Event payload types (mirror backend/src/services/websocketService.ts) ──

export interface CallEvent {
  callId: string;
  customerName: string;
  phone: string;
  scenario: string;
  mrr: number;
  status: string;
  outcome?: string;
  transcript?: string;
  timestamp: string;
}

export interface MetricsUpdate {
  totalCalls: number;
  recovered: number;
  failed: number;
  recoveredMRR: number;
}

export interface VariantResult {
  variantId: string;
  variantName: string;
  scenario: string;
  outcome: "recovered" | "failed";
  callId: string;
}

export interface SmsEvent {
  phone: string;
  amount: number;
  paymentUrl: string;
  customerName?: string;
  scenario?: string;
  delivered?: boolean;
  channel?: string;
  timestamp: string;
}

// ─── Singleton accessor ────────────────────────────────────────────────────

export function getDashboardSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/dashboard`, {
      path: "/ws",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function connectDashboard(): Socket {
  const s = getDashboardSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectDashboard(): void {
  socket?.disconnect();
}

// ─── Typed event subscriptions (return unsubscribe fns) ───────────────────

export function onCallStarted(cb: (e: CallEvent) => void): () => void {
  const s = getDashboardSocket();
  s.on("call:started", cb);
  return () => s.off("call:started", cb);
}

export function onCallStatus(cb: (e: CallEvent) => void): () => void {
  const s = getDashboardSocket();
  s.on("call:status", cb);
  return () => s.off("call:status", cb);
}

export function onCallCompleted(cb: (e: CallEvent) => void): () => void {
  const s = getDashboardSocket();
  s.on("call:completed", cb);
  return () => s.off("call:completed", cb);
}

export function onMetricsUpdated(cb: (m: MetricsUpdate) => void): () => void {
  const s = getDashboardSocket();
  s.on("metrics:updated", cb);
  return () => s.off("metrics:updated", cb);
}

export function onVariantResult(cb: (v: VariantResult) => void): () => void {
  const s = getDashboardSocket();
  s.on("abtest:result", cb);
  return () => s.off("abtest:result", cb);
}

export function onSmsSent(cb: (e: SmsEvent) => void): () => void {
  const s = getDashboardSocket();
  s.on("sms:sent", cb);
  return () => s.off("sms:sent", cb);
}

export function onSocketConnect(cb: () => void): () => void {
  const s = getDashboardSocket();
  s.on("connect", cb);
  return () => s.off("connect", cb);
}

export function onSocketError(cb: (err: Error) => void): () => void {
  const s = getDashboardSocket();
  s.on("connect_error", cb);
  return () => s.off("connect_error", cb);
}
