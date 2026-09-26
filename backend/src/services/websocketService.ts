import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

/**
 * WebSocket Service (#21)
 * 
 * Pushes real-time updates to the dashboard:
 * - New call started
 * - Call status update (ringing, connected, completed)
 * - Recovery success/failure
 * - Metrics update
 * - A/B test variant result
 * - SMS payment link sent (fallback channel fired)
 * 
 * Clients connect to the /dashboard namespace.
 */

let io: Server | null = null;

/**
 * Initialize WebSocket server with the HTTP server.
 */
export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
    path: '/ws',
  });

  const dashboard = io.of('/dashboard');

  dashboard.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`[WebSocket] ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[WebSocket] Socket.IO initialized on /ws');
  return io;
}

/**
 * Get the WebSocket server instance.
 */
export function getIO(): Server | null {
  return io;
}

// ── Event Emitters ──

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

/**
 * Broadcast: New call started
 */
export function emitCallStarted(event: CallEvent) {
  io?.of('/dashboard').emit('call:started', event);
}

/**
 * Broadcast: Call status update
 */
export function emitCallStatusUpdate(event: CallEvent) {
  io?.of('/dashboard').emit('call:status', event);
}

/**
 * Broadcast: Call completed (success or failure)
 */
export function emitCallCompleted(event: CallEvent & { duration?: number }) {
  io?.of('/dashboard').emit('call:completed', event);
}

/**
 * Broadcast: Metrics updated
 */
export function emitMetricsUpdate(metrics: {
  totalCalls: number;
  recovered: number;
  failed: number;
  recoveredMRR: number;
}) {
  io?.of('/dashboard').emit('metrics:updated', metrics);
}

/**
 * Broadcast: A/B test variant result
 */
export function emitVariantResult(data: {
  variantId: string;
  variantName: string;
  scenario: string;
  outcome: 'recovered' | 'failed';
  callId: string;
}) {
  io?.of('/dashboard').emit('abtest:result', data);
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

/**
 * Broadcast: SMS payment link sent (fallback channel fired)
 */
export function emitSmsSent(event: SmsEvent) {
  io?.of('/dashboard').emit('sms:sent', event);
}
