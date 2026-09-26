import { store } from './recoveryStore.js';

export interface ExportOptions {
  format?: 'csv' | 'json';
  status?: string;
  scenario?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class ExportService {
  async generateRecoveryLogs(options: ExportOptions = {}): Promise<string | object[]> {
    const logs = await store.getLogs();

    // Apply filters
    let filtered = [...logs];
    if (options.status) {
      filtered = filtered.filter(log => log.status === options.status);
    }
    if (options.scenario) {
      filtered = filtered.filter(log => log.scenario === options.scenario);
    }
    if (options.dateFrom) {
      const from = new Date(options.dateFrom).getTime();
      filtered = filtered.filter(log => {
        const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0;
        return ts >= from;
      });
    }
    if (options.dateTo) {
      const to = new Date(options.dateTo).getTime();
      filtered = filtered.filter(log => {
        const ts = log.timestamp ? new Date(log.timestamp).getTime() : 0;
        return ts <= to;
      });
    }

    if (options.format === 'json') {
      return filtered.map(log => ({
        id: log.id,
        customerName: log.customerName,
        companyName: log.companyName,
        phone: log.phone,
        scenario: log.scenario,
        mrr: log.mrr,
        status: log.status,
        outcome: log.outcome,
        callRunId: log.callRunId,
        variantId: log.variantId,
        timestamp: log.timestamp,
      }));
    }

    return this.toCSV(filtered);
  }

  private toCSV(logs: any[]): string {
    if (logs.length === 0) {
      return 'id,customerName,companyName,phone,scenario,mrr,status,outcome,callRunId,variantId,timestamp\n';
    }

    const header = [
      'id', 'customerName', 'companyName', 'phone', 'scenario',
      'mrr', 'status', 'outcome', 'callRunId', 'variantId', 'timestamp'
    ].join(',');

    const rows = logs.map(log => [
      log.id,
      `"${log.customerName || ''}"`,
      `"${log.companyName || ''}"`,
      `"${log.phone || ''}"`,
      log.scenario,
      log.mrr,
      log.status,
      `"${(log.outcome || '').replace(/"/g, '""')}"`,
      log.callRunId || '',
      log.variantId || '',
      log.timestamp
    ].join(','));

    return [header, ...rows].join('\n');
  }

  /**
   * Get summary statistics for export.
   */
  async getExportSummary(): Promise<{
    totalLogs: number;
    byStatus: Record<string, number>;
    byScenario: Record<string, number>;
    totalMRR: number;
    recoveredMRR: number;
  }> {
    const logs = await store.getLogs();

    const byStatus: Record<string, number> = {};
    const byScenario: Record<string, number> = {};
    let totalMRR = 0;
    let recoveredMRR = 0;

    for (const log of logs) {
      const status = log.status || 'unknown';
      const scenario = log.scenario || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      byScenario[scenario] = (byScenario[scenario] || 0) + 1;
      totalMRR += log.mrr || 0;
      if (status === 'recovered') {
        recoveredMRR += log.mrr || 0;
      }
    }

    return {
      totalLogs: logs.length,
      byStatus,
      byScenario,
      totalMRR,
      recoveredMRR,
    };
  }
}

export const exportService = new ExportService();
