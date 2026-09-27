'use client';

import React from 'react';
import { AdminMetrics } from '../../lib/refundApi';
import { FileCheck, CircleCheck, CircleX, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface MetricsSummaryProps {
  metrics: AdminMetrics | null;
  isLoading?: boolean;
}

/**
 * Single row of live, API-fed summary numbers for the support dashboard.
 * Every value comes from GET /api/admin/metrics — no hardcoded demo data.
 */
export function MetricsSummary({ metrics, isLoading }: MetricsSummaryProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-slate-200/80 p-5 animate-pulse shadow-xs" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Refund Requests',
      value: metrics.totalTickets.toLocaleString('en-US'),
      sub: `Avg amount $${metrics.averageTicketAmount.toFixed(2)}`,
      icon: FileCheck,
      accent: true
    },
    {
      label: 'Approved',
      value: metrics.approvedCount.toLocaleString('en-US'),
      sub: `${metrics.approvalRate.toFixed(1)}% approval rate`,
      icon: CircleCheck,
      accent: false
    },
    {
      label: 'Denied',
      value: metrics.deniedCount.toLocaleString('en-US'),
      sub: 'Blocked by policy rules',
      icon: CircleX,
      accent: false
    },
    {
      label: 'Escalated for Human Review',
      value: metrics.escalatedCount.toLocaleString('en-US'),
      sub: `${metrics.injectionAttempts} blocked injection attempts`,
      icon: ArrowUpRight,
      accent: false
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
              card.accent
                ? 'bg-[#3861FB] text-white'
                : 'bg-white border border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium tracking-wide ${card.accent ? 'text-blue-100' : 'text-slate-400'}`}>
                {card.label}
              </span>
              <Icon className={`w-4 h-4 ${card.accent ? 'text-white/80' : 'text-slate-400'}`} />
            </div>

            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 ${card.accent ? 'text-white' : 'text-slate-900'}`}>
              {card.value}
            </div>

            <span className={`text-[11px] mt-1 flex items-center gap-1 ${card.accent ? 'text-blue-100' : 'text-slate-400'}`}>
              {card.icon === ArrowUpRight && metrics.injectionAttempts > 0 && (
                <ShieldAlert className="w-3 h-3 text-rose-500" />
              )}
              {card.sub}
            </span>
          </div>
        );
      })}
    </div>
  );
}
