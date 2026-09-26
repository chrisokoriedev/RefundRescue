import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { initSentry, setupSentryErrorHandler } from './config/sentry.js';
import { initDatabase, seedDatabase } from './db/sqlite.js';
import { createLogger } from './middleware/logger.js';

import refundApi from './routes/refundApi.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { requestId } from './middleware/requestId.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const log = createLogger('server');

// ── Initialize Sentry ──
initSentry();

export const app = express();

// ── Security headers ──
app.use(helmet());

// ── Global middleware ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/no-origin (curl, health checks) and whitelisted origins.
    // Outside production, allow any localhost port so the Next.js dev server
    // works even when it binds to a random port.
    const isAllowed =
      !origin ||
      config.corsOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin));

    if (isAllowed) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(requestId);
app.use(requestLogger);

// ── Global rate limit: general API budget (AI endpoint has its own tighter limit) ──
app.use(rateLimiter({ windowMs: 60_000, max: 100 }));

// ── JSON body parser with size limit ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Database: auto-create schema and seed 15 customer personas ──
initDatabase();
seedDatabase();

// ── AI Refund System routes ──
app.use('/api', refundApi);

// ── Health check ──
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Service healthy',
    data: {
      status: 'ok',
      service: 'RevRescue — AI Refund Evaluation System',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      aiEngine: config.geminiApiKey ? 'GEMINI_FLASH' : 'HEURISTIC_FALLBACK',
    },
  });
});

// ── API info endpoint ──
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RevRescue AI Refund API',
    data: {
      version: 'v2',
      baseUrl: '/api',
      endpoints: {
        customers: {
          list: 'GET /api/customers',
          detail: 'GET /api/customers/:id',
          order: 'GET /api/orders/:id',
        },
        refunds: {
          evaluate: 'POST /api/refunds/evaluate',
          chat: 'POST /api/refunds/chat',
          policies: 'GET /api/policy/rules',
        },
        admin: {
          metrics: 'GET /api/admin/metrics',
          tickets: 'GET /api/admin/tickets?status=&riskLevel=',
          ticket: 'GET /api/admin/tickets/:id',
          override: 'POST /api/admin/tickets/:id/override',
        },
      },
    },
  });
});

// ── 404 catch-all ──
app.use(notFoundHandler);

// ── Sentry error handler (before global handler) ──
setupSentryErrorHandler(app);

// ── Global error handler ──
app.use(globalErrorHandler);

// ── Start server ──
if (process.env.NODE_ENV !== 'test') {
  const port = Number(config.port);
  app.listen(port, '0.0.0.0', () => {
    log.info({ port }, 'RevRescue server started');
    console.log(`
=====================================================
  🛡️  RevRescue — AI Refund Evaluation System
  ➜  API:        http://localhost:${port}/api
  ➜  Health:     http://localhost:${port}/health
  ➜  AI Engine:  ${config.geminiApiKey ? 'Google Gemini Flash' : 'Heuristic Fallback (no GEMINI_API_KEY set)'}
=====================================================
`);
  });
}

export default app;
