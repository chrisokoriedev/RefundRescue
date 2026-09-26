import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool.js';

export interface LogRecord {
  id?: string;
  customerName: string;
  companyName: string;
  phone: string;
  scenario: string;
  mrr: number;
  status?: string;
  planId?: string;
  callRunId?: string;
  outcome?: string;
  churnReason?: string;
  timestamp?: string;
  prompt?: string;
  variantId?: string;
  stripeEventId?: string;
  stripeCustomerId?: string;
  stripeInvoiceId?: string;
}

export interface Metrics {
  totalCalls: number;
  recoveredRevenue: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  activeCalls: number;
  conversionRate?: number;
}

class RecoveryStore {
  private inMemoryLogs: LogRecord[] = [];

  async addLog(record: LogRecord): Promise<LogRecord> {
    const id = uuidv4();
    const newRecord: LogRecord = {
      ...record,
      id,
      status: record.status || 'planned',
      outcome: record.outcome || 'Call scheduled',
      mrr: record.mrr || 500,
      timestamp: record.timestamp || new Date().toISOString()
    };

    try {
      const query = `
        INSERT INTO recovery_logs 
        (id, customer_name, company_name, phone, scenario, mrr, status, outcome, prompt, variant_id, stripe_event_id, stripe_customer_id, stripe_invoice_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
      const values = [
        newRecord.id, newRecord.customerName, newRecord.companyName, newRecord.phone, 
        newRecord.scenario, newRecord.mrr, newRecord.status, newRecord.outcome, newRecord.prompt, newRecord.variantId,
        newRecord.stripeEventId || null, newRecord.stripeCustomerId || null, newRecord.stripeInvoiceId || null
      ];

      const result = await pool.query(query, values);
      const dbRecord = this.mapToCamelCase(result.rows[0]);
      this.inMemoryLogs.unshift(dbRecord);
      return dbRecord;
    } catch (err: any) {
      console.warn('[RecoveryStore DB Warning]: Defaulting to in-memory store:', err.message);
      this.inMemoryLogs.unshift(newRecord);
      return newRecord;
    }
  }

  async updateLog(id: string, updates: Partial<LogRecord>): Promise<LogRecord | undefined> {
    try {
      const setFields: string[] = [];
      const values: any[] = [];
      let queryIndex = 1;

      const dbMap: Record<string, string> = {
        status: 'status',
        planId: 'plan_id',
        callRunId: 'call_run_id',
        outcome: 'outcome',
        churnReason: 'churn_reason',
        customerName: 'customer_name',
        companyName: 'company_name',
        phone: 'phone',
        scenario: 'scenario',
        mrr: 'mrr',
        variantId: 'variant_id',
        stripeEventId: 'stripe_event_id',
        stripeCustomerId: 'stripe_customer_id',
        stripeInvoiceId: 'stripe_invoice_id'
      };

      for (const [key, val] of Object.entries(updates)) {
        if (dbMap[key] !== undefined && val !== undefined) {
          setFields.push(`${dbMap[key]} = $${queryIndex}`);
          values.push(val);
          queryIndex++;
        }
      }

      if (setFields.length > 0) {
        values.push(id);
        const query = `
          UPDATE recovery_logs 
          SET ${setFields.join(', ')} 
          WHERE id = $${queryIndex} OR plan_id = $${queryIndex} OR call_run_id = $${queryIndex}
          RETURNING *;
        `;

        const result = await pool.query(query, values);
        if (result.rows.length > 0) {
          const updated = this.mapToCamelCase(result.rows[0]);
          const idx = this.inMemoryLogs.findIndex(l => l.id === id || l.planId === id || l.callRunId === id);
          if (idx !== -1) this.inMemoryLogs[idx] = updated;
          return updated;
        }
      }
    } catch (err: any) {
      console.warn('[RecoveryStore DB Update Warning]:', err.message);
    }

    // Fallback to in-memory update
    const memLog = this.inMemoryLogs.find(l => l.id === id || l.planId === id || l.callRunId === id);
    if (memLog) {
      Object.assign(memLog, updates);
      return memLog;
    }
    return undefined;
  }

  async hasEventBeenProcessed(stripeEventId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT 1 FROM recovery_logs WHERE stripe_event_id = $1 LIMIT 1',
        [stripeEventId]
      );
      if (result.rows.length > 0) return true;
    } catch (err: any) {
      console.warn('[RecoveryStore idempotency check warning]:', err.message);
    }
    // Fallback: check in-memory
    return this.inMemoryLogs.some((l) => l.stripeEventId === stripeEventId);
  }

  /** Clear in-memory store (for tests) */
  clearInMemory(): void {
    this.inMemoryLogs = [];
  }

  async getLogs(): Promise<LogRecord[]> {
    try {
      const result = await pool.query('SELECT * FROM recovery_logs ORDER BY timestamp DESC LIMIT 100;');
      const dbLogs = result.rows.map(this.mapToCamelCase);
      if (dbLogs.length > 0) return dbLogs;
    } catch (err: any) {
      console.warn('[RecoveryStore DB getLogs Warning]:', err.message);
    }
    return this.inMemoryLogs;
  }

  async getMetrics(): Promise<Metrics> {
    try {
      const countQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_calls,
          COUNT(*) FILTER (WHERE status = 'recovered') as successful_recoveries,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_recoveries,
          COUNT(*) FILTER (WHERE status IN ('planned', 'in_progress')) as active_calls,
          COALESCE(SUM(mrr) FILTER (WHERE status = 'recovered'), 0) as recovered_revenue
        FROM recovery_logs;
      `);

      const row = countQuery.rows[0];
      const totalCalls = parseInt(row.total_calls) || 0;
      const successfulRecoveries = parseInt(row.successful_recoveries) || 0;
      
      const conversionRate = totalCalls > 0 
        ? Math.round((successfulRecoveries / totalCalls) * 100) 
        : 0;

      return {
        totalCalls,
        successfulRecoveries,
        failedRecoveries: parseInt(row.failed_recoveries) || 0,
        activeCalls: parseInt(row.active_calls) || 0,
        recoveredRevenue: parseFloat(row.recovered_revenue) || 0,
        conversionRate
      };
    } catch (err: any) {
      console.warn('[RecoveryStore DB getMetrics Warning]:', err.message);
      // Compute from inMemoryLogs
      const totalCalls = this.inMemoryLogs.length;
      const successfulRecoveries = this.inMemoryLogs.filter(l => l.status === 'recovered').length;
      const failedRecoveries = this.inMemoryLogs.filter(l => l.status === 'failed').length;
      const activeCalls = this.inMemoryLogs.filter(l => l.status === 'planned' || l.status === 'in_progress').length;
      const recoveredRevenue = this.inMemoryLogs
        .filter(l => l.status === 'recovered')
        .reduce((sum, l) => sum + (l.mrr || 0), 0);
      const conversionRate = totalCalls > 0 ? Math.round((successfulRecoveries / totalCalls) * 100) : 0;

      return {
        totalCalls,
        successfulRecoveries,
        failedRecoveries,
        activeCalls,
        recoveredRevenue,
        conversionRate
      };
    }
  }

  private mapToCamelCase(row: any): LogRecord {
    return {
      id: row.id,
      customerName: row.customer_name,
      companyName: row.company_name,
      phone: row.phone,
      scenario: row.scenario,
      mrr: parseFloat(row.mrr),
      status: row.status,
      planId: row.plan_id,
      callRunId: row.call_run_id,
      outcome: row.outcome,
      churnReason: row.churn_reason,
      timestamp: row.timestamp,
      prompt: row.prompt,
      variantId: row.variant_id,
      stripeEventId: row.stripe_event_id,
      stripeCustomerId: row.stripe_customer_id,
      stripeInvoiceId: row.stripe_invoice_id
    };
  }
}

export const store = new RecoveryStore();
