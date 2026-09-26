import { v4 as uuidv4 } from 'uuid';

/**
 * A/B Test Analytics (#18)
 * 
 * Tracks which playbook variant was selected for each call,
 * and whether it succeeded (recovered) or failed.
 * 
 * Storage: In-memory for hackathon. For production, use a DB table.
 */

export interface VariantMetric {
  id: string;
  variantId: string;
  variantName: string;
  scenario: string;
  callId: string;
  customerName: string;
  status: 'recovered' | 'failed' | 'in_progress';
  mrr: number;
  timestamp: string;
}

export interface VariantStats {
  variantId: string;
  variantName: string;
  scenario: string;
  totalCalls: number;
  recovered: number;
  failed: number;
  inProgress: number;
  recoveryRate: number;
  totalMRR: number;
  recoveredMRR: number;
}

class AnalyticsService {
  private metrics: VariantMetric[] = [];

  /**
   * Record that a variant was selected for a call.
   */
  async recordVariantSelection(params: {
    variantId: string;
    variantName: string;
    scenario: string;
    callId: string;
    customerName: string;
    mrr: number;
  }): Promise<void> {
    const metric: VariantMetric = {
      id: uuidv4(),
      variantId: params.variantId,
      variantName: params.variantName,
      scenario: params.scenario,
      callId: params.callId,
      customerName: params.customerName,
      status: 'in_progress',
      mrr: params.mrr,
      timestamp: new Date().toISOString(),
    };
    this.metrics.push(metric);
  }

  /**
   * Record a variant selection for a call when a playbook variant was chosen.
   * No-op when no active variant exists (nothing to A/B track).
   */
  async recordVariantForCall(
    playbook: { id: string; name: string } | null,
    params: { scenario: string; callId: string; customerName: string; mrr: number }
  ): Promise<void> {
    if (!playbook) return;
    await this.recordVariantSelection({
      variantId: playbook.id,
      variantName: playbook.name,
      scenario: params.scenario,
      callId: params.callId,
      customerName: params.customerName,
      mrr: params.mrr,
    });
  }

  /**
   * Update the outcome of a variant call.
   */
  async recordVariantOutcome(callId: string, status: 'recovered' | 'failed'): Promise<void> {
    const metric = this.metrics.find(m => m.callId === callId);
    if (metric) {
      metric.status = status;
    }
  }

  /**
   * Get stats for all variants in a scenario.
   */
  async getVariantStats(scenario?: string): Promise<VariantStats[]> {
    let filtered = this.metrics;
    if (scenario) {
      filtered = filtered.filter(m => m.scenario === scenario);
    }

    const grouped = new Map<string, VariantMetric[]>();
    for (const metric of filtered) {
      const key = `${metric.variantId}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(metric);
    }

    const stats: VariantStats[] = [];
    for (const [variantId, metrics] of grouped) {
      const recovered = metrics.filter(m => m.status === 'recovered').length;
      const failed = metrics.filter(m => m.status === 'failed').length;
      const inProgress = metrics.filter(m => m.status === 'in_progress').length;
      const total = metrics.length;

      stats.push({
        variantId,
        variantName: metrics[0].variantName,
        scenario: metrics[0].scenario,
        totalCalls: total,
        recovered,
        failed,
        inProgress,
        recoveryRate: total > 0 ? Math.round((recovered / total) * 100) : 0,
        totalMRR: metrics.reduce((sum, m) => sum + m.mrr, 0),
        recoveredMRR: metrics.filter(m => m.status === 'recovered').reduce((sum, m) => sum + m.mrr, 0),
      });
    }

    // Sort by recovery rate descending
    stats.sort((a, b) => b.recoveryRate - a.recoveryRate);
    return stats;
  }

  /**
   * Get the winning variant for a scenario (highest recovery rate with min 5 calls).
   */
  async getWinningVariant(scenario: string): Promise<VariantStats | null> {
    const stats = await this.getVariantStats(scenario);
    const eligible = stats.filter(s => s.totalCalls >= 5);
    return eligible.length > 0 ? eligible[0] : null;
  }

  /**
   * Get overall analytics summary.
   */
  async getOverallSummary(): Promise<{
    totalCalls: number;
    totalVariants: number;
    totalScenarios: number;
    overallRecoveryRate: number;
    totalMRRTracked: number;
    recoveredMRR: number;
  }> {
    const totalCalls = this.metrics.length;
    const uniqueVariants = new Set(this.metrics.map(m => m.variantId));
    const uniqueScenarios = new Set(this.metrics.map(m => m.scenario));
    const recovered = this.metrics.filter(m => m.status === 'recovered').length;

    return {
      totalCalls,
      totalVariants: uniqueVariants.size,
      totalScenarios: uniqueScenarios.size,
      overallRecoveryRate: totalCalls > 0 ? Math.round((recovered / totalCalls) * 100) : 0,
      totalMRRTracked: this.metrics.reduce((sum, m) => sum + m.mrr, 0),
      recoveredMRR: this.metrics.filter(m => m.status === 'recovered').reduce((sum, m) => sum + m.mrr, 0),
    };
  }

  /**
   * Clear all tracked metrics (used by tests).
   */
  clear(): void {
    this.metrics = [];
  }
}

export const analyticsService = new AnalyticsService();
