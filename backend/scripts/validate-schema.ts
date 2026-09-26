import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

async function validateSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log('✅ Connected to Neon PostgreSQL\n');

    // 1. Check if recovery_logs table exists
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'recovery_logs'
      ORDER BY ordinal_position
    `);

    if (tableCheck.rows.length === 0) {
      console.log('⚠️  Table recovery_logs does not exist. Creating from schema.sql...');
      const fs = await import('fs');
      const schema = fs.readFileSync('src/db/schema.sql', 'utf8');
      await client.query(schema);
      console.log('✅ Table created successfully\n');
    } else {
      console.log('📋 Table recovery_logs columns:');
      for (const r of tableCheck.rows) {
        console.log(`   ${r.column_name} (${r.data_type}) nullable=${r.is_nullable} default=${r.column_default || 'none'}`);
      }
      console.log('');
    }

    // 2. Validate expected columns exist
    const expectedColumns = [
      'id', 'customer_name', 'company_name', 'phone', 'scenario',
      'mrr', 'status', 'plan_id', 'call_run_id', 'outcome',
      'churn_reason', 'prompt', 'stripe_event_id', 'timestamp'
    ];
    const actualColumns = tableCheck.rows.map((r: any) => r.column_name);
    const missing = expectedColumns.filter(c => !actualColumns.includes(c));

    if (missing.length > 0) {
      console.log(`❌ Missing columns: ${missing.join(', ')}`);
      console.log('   Running schema.sql to add missing columns...');
      const fs = await import('fs');
      const schema = fs.readFileSync('src/db/schema.sql', 'utf8');
      await client.query(schema);
      console.log('✅ Schema updated\n');
    } else {
      console.log('✅ All expected columns present\n');
    }

    // 3. Check indexes
    const idxCheck = await client.query(`
      SELECT indexname FROM pg_indexes WHERE tablename = 'recovery_logs'
    `);
    console.log('🔑 Indexes:');
    for (const r of idxCheck.rows) {
      console.log(`   ${r.indexname}`);
    }
    console.log('');

    // 4. Test INSERT + SELECT with stripe_event_id (idempotency field)
    const testId = '00000000-0000-0000-0000-000000000001';
    await client.query('DELETE FROM recovery_logs WHERE id = $1', [testId]);
    await client.query(
      `INSERT INTO recovery_logs (id, customer_name, company_name, phone, scenario, mrr, status, stripe_event_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [testId, 'Schema Test', 'Test Corp', '+15550000000', 'payment_failed', 99.99, 'planned', 'evt_test_schema_123']
    );
    const result = await client.query('SELECT * FROM recovery_logs WHERE id = $1', [testId]);
    console.log('📝 Test INSERT+SELECT result:');
    console.log(`   id: ${result.rows[0].id}`);
    console.log(`   customer_name: ${result.rows[0].customer_name}`);
    console.log(`   stripe_event_id: ${result.rows[0].stripe_event_id}`);
    console.log(`   mrr: ${result.rows[0].mrr}`);
    console.log('');

    // 5. Test idempotency query (the critical one)
    const idempotencyCheck = await client.query(
      'SELECT 1 FROM recovery_logs WHERE stripe_event_id = $1 LIMIT 1',
      ['evt_test_schema_123']
    );
    console.log(`🔍 Idempotency check for evt_test_schema_123: ${idempotencyCheck.rows.length > 0 ? 'FOUND ✅' : 'NOT FOUND ❌'}`);

    // 6. Test metrics query
    const metrics = await client.query(`
      SELECT
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE status = 'recovered') as successful_recoveries,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_recoveries,
        COUNT(*) FILTER (WHERE status IN ('planned', 'in_progress')) as active_calls,
        COALESCE(SUM(mrr) FILTER (WHERE status = 'recovered'), 0) as recovered_revenue
      FROM recovery_logs
    `);
    console.log(`📊 Metrics query works: total=${metrics.rows[0].total_calls}, recovered=${metrics.rows[0].recovered_revenue}`);
    console.log('');

    // Cleanup
    await client.query('DELETE FROM recovery_logs WHERE id = $1', [testId]);
    console.log('🧹 Cleanup done. All schema validations passed!');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

validateSchema();
