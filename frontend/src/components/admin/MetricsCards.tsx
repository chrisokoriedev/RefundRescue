import React from 'react';
import { AdminMetrics } from '../../lib/refundApi';
import { CheckCircle2, AlertTriangle, ShieldAlert, Activity } from 'lucide-react';

interface MetricsCardsProps {
  metrics: AdminMetrics | null;
  isLoading?: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Refund Requests',
      value: metrics.totalTickets,
      icon: Activity,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      subtitle: `${metrics.supervisorOverrides} manual overrides recorded`
    },
    {
      title: 'Approval Rate',
      value: `${metrics.approvalRate}%`,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtitle: `${metrics.approvedCount} approved claims`
    },
    {
      title: 'Supervisor Escalation Queue',
      value: metrics.escalatedCount,
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      subtitle: `${metrics.deniedCount} denied claims`
    },
    {
      title: 'Injection Attacks Blocked',
      value: metrics.injectionAttempts,
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      subtitle: `$${metrics.totalRefundedAmount.toFixed(2)} total refunded value`
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-lg flex flex-col justify-between hover:border-zinc-700/80 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{card.title}</span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
