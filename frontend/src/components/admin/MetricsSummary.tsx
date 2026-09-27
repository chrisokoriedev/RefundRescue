'use client';

import React from 'react';
import { AdminMetrics } from '../../lib/refundApi';
import { FileCheck, CircleCheck, CircleX, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { Rim } from 'react-glass-rim';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 p-6 animate-pulse shadow-xs" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Refund Claims',
      value: metrics.totalTickets.toLocaleString('en-US'),
      sub: `Avg value $${metrics.averageTicketAmount.toFixed(2)}`,
      icon: FileCheck,
      variant: 'primary' as const,
      badge: 'All Orders'
    },
    {
      label: 'Auto Approved',
      value: metrics.approvedCount.toLocaleString('en-US'),
      sub: `${metrics.approvalRate.toFixed(1)}% instant resolution`,
      icon: CircleCheck,
      variant: 'approved' as const,
      badge: 'POL-004 Active'
    },
    {
      label: 'Policy Denied',
      value: metrics.deniedCount.toLocaleString('en-US'),
      sub: 'Enforced final-sale & windows',
      icon: CircleX,
      variant: 'denied' as const,
      badge: 'Rules Protected'
    },
    {
      label: 'Escalated to Human',
      value: metrics.escalatedCount.toLocaleString('en-US'),
      sub: metrics.injectionAttempts > 0
        ? `${metrics.injectionAttempts} prompt injection caught`
        : 'High value or complex claims',
      icon: ArrowUpRight,
      variant: 'escalated' as const,
      badge: 'Supervisor Queue'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPrimary = card.variant === 'primary';

        return (
          <Rim
            key={card.label}
            intensity={isPrimary ? 0.35 : 0.25}
            accentColor={isPrimary ? '255, 255, 255' : '199, 210, 254'}
            className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group ${
              isPrimary
                ? 'bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#312E81] text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)]'
                : 'bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_40px_-8px_rgba(15,23,42,0.1)]'
            }`}
          >
            {/* Top row: label + icon + pill */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-bold tracking-tight ${isPrimary ? 'text-indigo-100' : 'text-slate-500'}`}>
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                isPrimary
                  ? 'bg-white/15 text-white backdrop-blur-xs'
                  : card.variant === 'approved'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : card.variant === 'denied'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-amber-50 text-[#FF5500] border border-amber-100'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle: big prominent KPI number */}
            <div className="my-2.5">
              <div className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${isPrimary ? 'text-white' : 'text-slate-900'}`}>
                {card.value}
              </div>
            </div>

            {/* Bottom row: subtitle + glass pill badge */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04]">
              <span className={`text-[11px] font-semibold flex items-center gap-1.5 truncate ${isPrimary ? 'text-indigo-100' : 'text-slate-500'}`}>
                {card.variant === 'escalated' && metrics.injectionAttempts > 0 && (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                )}
                {card.sub}
              </span>
              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full flex-shrink-0 tracking-wider ${
                isPrimary
                  ? 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
                  : 'bg-slate-100/80 text-slate-600 border border-slate-200/80'
              }`}>
                {card.badge}
              </span>
            </div>
          </Rim>
        );
      })}
    </div>
  );
}
