import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config/index.js';
import { initSentry, setupSentryErrorHandler } from './config/sentry.js';
import { pingDatabase, getPoolStats } from './db/pool.js';
import { createLogger } from './middleware/logger.js';

import apiRoutes from './routes/api.js';
import refundApi from './routes/refundApi.js';
import { initDatabase, seedDatabase } from './db/sqlite.js';
import playbookRoutes from './routes/playbooks.js';
import exportRoutes from './routes/exports.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import apiKeyRoutes from './routes/apiKeys.js';
import mockStripeRoutes from './routes/mockStripe.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { requestId } from './middleware/requestId.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { csrfProtection } from './middleware/csrf.js';
import { deprecationHeaders } from './middleware/deprecation.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { handleStripeWebhook, handleCalleWebhook } from './controllers/webhookController.js';
import { validateBody } from './validators/middleware.js';
import { calleWebhookSchema } from './validators/api.schema.js';

// ── Swagger/OpenAPI (#6) ──
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

// ── WebSocket (#21) ──
import { initWebSocket } from './services/websocketService.js';

const log = createLogger('server');

// ── Initialize Sentry (#13) ──
initSentry();

export const app = express();
const httpServer = createServer(app);

// ── Initialize WebSocket (#21) ──
initWebSocket(httpServer);

// ── Security headers (#15) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger UI needs these
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Swagger UI needs this
}));

// ── CSRF Protection (#16) — no-op for JWT auth ──
app.use(csrfProtection);

// ── Global middleware ──
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-API-Key', 'Idempotency-Key'],
}));
app.use(requestId);
app.use(requestLogger);
app.use(rateLimiter({ windowMs: 60_000, max: 200 }));

// ── Deprecation headers for v1 (#24) ──
app.use(deprecationHeaders({
  version: 'v1',
  sunsetDate: '2027-01-01',
  migrationUrl: 'https://docs.revrescue.com/migration/v1-to-v2',
}));

// ── JSON body parser with size limit (#23) ──
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Swagger UI (#6) ──
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RevRescue API Docs',
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Auth routes (#3) ──
app.use('/auth', authRoutes);

// ── API Key management (#22) ──
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/api-keys', apiKeyRoutes); // backward compat

// ── Stripe Webhook: needs raw body for signature verification ──
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json', limit: '1mb' }), handleStripeWebhook);

// ── CALL-E Webhook: standard JSON body ──
app.post('/api/webhooks/calle', validateBody(calleWebhookSchema), handleCalleWebhook);

// ── Mock Routes ──
app.use('/api/mock', mockStripeRoutes);

// ── API v1 routes ──
app.use('/api/v1/playbooks', playbookRoutes);
app.use('/api/v1/exports', exportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1', apiRoutes);

// ── AI Refund System Routes ──
initDatabase();
seedDatabase();
app.use('/api', refundApi);

// ── Backward-compatible aliases ──
app.use('/api/playbooks', playbookRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', apiRoutes);

// ── Health check with DB ping (#14) ──
app.get('/health', async (req: Request, res: Response) => {
  const dbOk = await pingDatabase();
  const poolStats = getPoolStats();

  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    success: dbOk,
    message: dbOk ? 'Service healthy' : 'Service degraded — database unreachable',
    data: {
      status,
      service: 'RevRescue Voice Concierge Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db: {
        connected: dbOk,
        ...poolStats,
      },
    }
  });
});

// ── API info endpoint ──
app.get('/api', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'RevRescue API',
    data: {
      version: 'v1',
      baseUrl: '/api/v1',
      docs: '/api/docs',
      endpoints: {
        metrics: 'GET /api/v1/metrics',
        logs: 'GET /api/v1/logs?page=1&limit=20&sortBy=timestamp&order=desc&status=recovered&search=john',
        playbooks: 'GET /api/v1/playbooks',
        previewPrompt: 'POST /api/v1/preview-prompt',
        triggerCall: 'POST /api/v1/mock/trigger-call',
        calleStatus: 'GET /api/v1/calle-status',
        exports: {
          csv: 'GET /api/v1/exports/csv?status=recovered',
          json: 'GET /api/v1/exports/json?scenario=payment_failed',
          summary: 'GET /api/v1/exports/summary',
        },
        analytics: {
          summary: 'GET /api/v1/analytics',
          variants: 'GET /api/v1/analytics/variants?scenario=payment_failed',
          winner: 'GET /api/v1/analytics/winner/payment_failed',
        },
        apiKeys: {
          create: 'POST /api/v1/api-keys',
          list: 'GET /api/v1/api-keys',
          revoke: 'DELETE /api/v1/api-keys/:id',
          validate: 'POST /api/v1/api-keys/validate',
        },
        webhookStripe: 'POST /api/webhooks/stripe',
        webhookCalle: 'POST /api/webhooks/calle',
        websocket: 'ws://localhost:PORT/ws/dashboard',
      },
    }
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
  httpServer.listen(port, '0.0.0.0', () => {
    log.info({ port }, 'RevRescue server started');
    console.log(`
=====================================================
🚨 RevRescue Programmatic Voice Churn Engine Running!
=====================================================
➜ Backend Port:    ${port}
➜ API v1:          http://localhost:${port}/api/v1
➜ API Docs:        http://localhost:${port}/api/docs
➜ Auth:            http://localhost:${port}/auth/login
➜ API Keys:        http://localhost:${port}/api/v1/api-keys
➜ Analytics:       http://localhost:${port}/api/v1/analytics
➜ Exports:         http://localhost:${port}/api/v1/exports/csv
➜ Stripe Webhook:  http://localhost:${port}/api/webhooks/stripe
➜ CALL-E Webhook:  http://localhost:${port}/api/webhooks/calle
➜ WebSocket:       ws://localhost:${port}/ws/dashboard
➜ Health Check:    http://localhost:${port}/health
➜ CORS Origins:    ${config.corsOrigins.join(', ')}
=====================================================
`);
  });
}

// ── Graceful Shutdown (#8) ──
async function shutdown(signal: string) {
  log.info({ signal }, 'Gracefully shutting down...');
  
  // Close database pool
  try {
    const { pool } = await import('./db/pool.js');
    await pool.end();
    log.info('Database pool closed');
  } catch {
    // Ignore
  }

  // Close HTTP server
  httpServer.close(() => {
    log.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
