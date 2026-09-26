import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,

  // ── CORS ──
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map(s => s.trim()),

  // ── AI (optional — heuristic fallback when unset) ──
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // ── Sentry (optional) ──
  sentryDsn: process.env.SENTRY_DSN || '',
};
