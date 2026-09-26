import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Connected to Neon. Running migrations...\n');

    // Add stripe_event_id column if missing
    await client.query('ALTER TABLE recovery_logs ADD COLUMN IF NOT EXISTS stripe_event_id VARCHAR(255)');
    console.log('✅ stripe_event_id column ready');

    // Add index for idempotency lookups
    await client.query('CREATE INDEX IF NOT EXISTS idx_recovery_logs_stripe_event_id ON recovery_logs (stripe_event_id)');
    console.log('✅ stripe_event_id index created');

    // Add status index
    await client.query('CREATE INDEX IF NOT EXISTS idx_recovery_logs_status ON recovery_logs (status)');
    console.log('✅ status index created');

    // Verify columns
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='recovery_logs' ORDER BY ordinal_position"
    );
    console.log('\n📋 Final columns:', cols.rows.map((r: any) => r.column_name).join(', '));

    // Verify indexes
    const idxs = await client.query(
      "SELECT indexname FROM pg_indexes WHERE tablename='recovery_logs'"
    );
    console.log('🔑 Indexes:', idxs.rows.map((r: any) => r.indexname).join(', '));

    console.log('\n🎉 Migration complete!');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
