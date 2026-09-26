import dotenv from 'dotenv';
dotenv.config();

// ── Required environment variables (fail fast if missing in production) ──
const REQUIRED_IN_PRODUCTION = [
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'DATABASE_URL',
] as const;

const REQUIRED_ALWAYS = [
  'DATABASE_URL',
] as const;

function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  for (const key of REQUIRED_ALWAYS) {
    if (!process.env[key]) missing.push(key);
  }

  if (isProd) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    const msg = `[FATAL] Missing required environment variables: ${missing.join(', ')}`;
    if (isProd) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(`[Config Warning] ${msg}. Server will start but features may fail.`);
    }
  }
}

validateEnv();

export const config = {
  port: process.env.PORT || 3001,

  // ── CORS ──
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
    .split(',')
    .map(s => s.trim()),

  // ── Frontend ──
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // ── CALL-E ──
  calleApiKey: process.env.CALLE_API_KEY || '',
  calleBaseUrl: process.env.CALLE_BASE_URL || 'https://api.heycall-e.com',
  calleWebhookUrl: process.env.CALLE_WEBHOOK_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://api.revrescue.com/api/webhooks/calle' 
    : 'https://your-ngrok-url.ngrok.io/api/webhooks/calle'),

  // ── Stripe ──
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',

  // ── Twilio SMS (optional — console fallback when unset) ──
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFromNumber: process.env.TWILIO_PHONE_NUMBER || '',

  // ── JWT ──
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // ── Churn delay (hours) — NaN-safe fallback to 12 ──
  paymentFailedDelayHours: parseInt(process.env.PAYMENT_FAILED_DELAY_HOURS || '12') || 12,

  // ── Sentry ──
  sentryDsn: process.env.SENTRY_DSN || '',
};
