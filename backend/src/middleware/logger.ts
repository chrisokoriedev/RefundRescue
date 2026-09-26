import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Structured JSON logger using pino.
 * 
 * - Production: JSON format for log aggregation (Datadog, ELK, CloudWatch)
 * - Development: Pretty-printed for readability
 * - Test: Silent (no output, no transport initialization)
 */
export const logger = isTest
  ? pino({ level: 'silent' })
  : pino({
      level: isProduction ? 'info' : 'debug',
      ...(isProduction ? {} : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
      serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
        remove: true,
      },
    });

/**
 * Create a child logger with context.
 * 
 * Usage:
 *   const log = createLogger('webhook');
 *   log.info({ eventId: 'evt_123' }, 'Processing webhook');
 */
export function createLogger(context: string) {
  return logger.child({ context });
}
