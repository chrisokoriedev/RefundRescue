import pkg from 'pg';
const { Pool } = pkg;

/**
 * Singleton Neon PostgreSQL connection pool.
 * 
 * Uses connection pooling with:
 * - Max 10 connections (Neon free tier limit)
 * - Idle timeout 30s (Neon auto-suspends after inactivity)
 * - Connection timeout 5s
 * - Statement timeout 30s
 * 
 * In test mode, returns a mock pool.
 */

const isTest = process.env.NODE_ENV === 'test';

const poolConfig = isTest
  ? { query: async () => ({ rows: [] }) } as any
  : {
      connectionString: process.env.DATABASE_URL,
      max: 10,                    // Max connections in pool
      idleTimeoutMillis: 30_000,  // Close idle connections after 30s
      connectionTimeoutMillis: 5_000,  // Fail if can't connect in 5s
      statement_timeout: 30_000,  // Kill queries after 30s
      application_name: 'revrescue-backend',
    };

// Singleton pool — created once, reused across all imports
export const pool = new Pool(poolConfig);

// Log pool events in production
if (!isTest) {
  pool.on('connect', () => {
    console.log('[DB Pool] New client connected');
  });

  pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle client:', err.message);
  });

  pool.on('remove', () => {
    console.log('[DB Pool] Client removed from pool');
  });
}

/**
 * Test database connectivity.
 * Returns true if query executes successfully.
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get pool stats for health checks.
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}
