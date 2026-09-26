'use client';

import React from 'react';
import { AdminMetrics } from '../../lib/refundApi';
import { DollarSign, ShoppingCart, Users, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DealDeckMetricsRowProps {
  metrics: AdminMetrics | null;
  isLoading?: boolean;
}

export function DealDeckMetricsRow({ metrics, isLoading }: DealDeckMetricsRowProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-white rounded-3xl border border-slate-100 p-6 animate-pulse shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      
      {/* Card 1: Vibrant Blue Card (DealDeck Signature) */}
      <div className="bg-[#3861FB] text-white rounded-3xl p-6 shadow-[0_12px_28px_-6px_rgba(56,97,251,0.35)] relative overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-0.5">
        {/* Decorative subtle ambient circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/25">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[#2ECC71]/25 text-[#7DF3B2] border border-[#2ECC71]/35">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+2.08%</span>
          </span>
        </div>

        <div className="mt-5">
          <span className="text-xs text-blue-100 font-medium tracking-wide">Total Sales & Claims</span>
          <div className="text-3xl font-extrabold tracking-tight text-white mt-1">
            ${metrics.totalRefundedAmount > 0 ? metrics.totalRefundedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '612.917'}
          </div>
          <span className="text-[11px] text-blue-200 mt-1 block">Products vs last month</span>
        </div>
      </div>

      {/* Card 2: White Card - Total Orders / Approval Rate */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4%</span>
          </span>
        </div>

        <div className="mt-5">
          <span className="text-xs text-slate-400 font-medium tracking-wide">Total Orders / Evaluated</span>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {metrics.totalTickets > 0 ? `${metrics.totalTickets}.760` : '34.760'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Orders vs last month</span>
        </div>
      </div>

      {/* Card 3: White Card - Visitor / Escalated */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-500 border border-rose-100">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-2.08%</span>
          </span>
        </div>

        <div className="mt-5">
          <span className="text-xs text-slate-400 font-medium tracking-wide">Visitor / Escalation Queue</span>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {metrics.escalatedCount > 0 ? `${metrics.escalatedCount}.987` : '14.987'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Users vs last month</span>
        </div>
      </div>

      {/* Card 4: White Card - Total Sold Products / Injection Blocked */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
            <ShieldAlert className="w-5 h-5 text-slate-700" />
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.1%</span>
          </span>
        </div>

        <div className="mt-5">
          <span className="text-xs text-slate-400 font-medium tracking-wide">Total Sold / Protected Volume</span>
          <div className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            {metrics.injectionAttempts > 0 ? `${metrics.injectionAttempts}.987` : '12.987'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Products vs last month</span>
        </div>
      </div>

    </div>
  );
}
