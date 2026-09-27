'use client';

import React from 'react';
import { Customer } from '../../lib/refundApi';
import { ShieldAlert, Sparkles, BadgeCheck } from 'lucide-react';
import { Rim } from 'react-glass-rim';

interface PersonaSwitcherProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  isLoading?: boolean;
}

export function PersonaSwitcher({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  isLoading
}: PersonaSwitcherProps) {
  const selected = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const getPersonaBadge = (id: string) => {
    switch (id) {
      case 'CUST-101':
        return { label: 'Damaged item → AI approval (POL-004)', color: 'bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-2xs' };
      case 'CUST-102':
        return { label: 'Order over 30 days → denied (POL-002)', color: 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-2xs' };
      case 'CUST-103':
        return { label: 'Final sale item → denied (POL-001)', color: 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-2xs' };
      case 'CUST-104':
        return { label: '$850 TV → human review (POL-003)', color: 'bg-amber-50/90 text-amber-800 border-amber-200 shadow-2xs' };
      case 'CUST-105':
        return { label: 'Wrong item received → approval (POL-004)', color: 'bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-2xs' };
      case 'CUST-106':
        return { label: 'Prompt injection attempt → blocked (POL-005)', color: 'bg-rose-100/90 text-rose-900 border-rose-300 shadow-2xs' };
      case 'CUST-107':
        return { label: 'Contradictory claim → escalated (POL-005)', color: 'bg-amber-50/90 text-amber-800 border-amber-200 shadow-2xs' };
      case 'CUST-109':
        return { label: '$1.2k laptop → human review (POL-003)', color: 'bg-amber-50/90 text-amber-800 border-amber-200 shadow-2xs' };
      case 'CUST-110':
        return { label: 'Swimwear final sale → denied (POL-001)', color: 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-2xs' };
      case 'CUST-112':
        return { label: '62-day-old order → denied (POL-002)', color: 'bg-rose-50/90 text-rose-800 border-rose-200 shadow-2xs' };
      case 'CUST-113':
        return { label: 'Excessive returns (4 of 5) → escalated (POL-005)', color: 'bg-amber-50/90 text-amber-800 border-amber-200 shadow-2xs' };
      default:
        return { label: 'Standard customer', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const selectedBadge = selected ? getPersonaBadge(selected.id) : null;

  return (
    <div className="apple-liquid-glass rounded-3xl p-6 sm:p-7 shadow-xs border border-white/80 flex flex-col gap-4 text-xs">
      {/* Panel headline — the main way to explore the demo */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#4F46E5] border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-2xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Try a sample customer</h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
            One click loads a ready-made refund scenario — each one exercises a different policy rule.
          </p>
        </div>
      </div>

      {/* All customers as selectable pills — noticeably larger with liquid glass lighting */}
      <div className="flex flex-wrap gap-2">
        {customers.map((c) => {
          const isSelected = c.id === selectedCustomerId;
          const isSecurity = c.id === 'CUST-106';

          if (isSelected) {
            return (
              <Rim
                key={c.id}
                as="button"
                intensity={0.45}
                accentColor="79, 70, 229"
                onClick={() => onSelectCustomer(c.id)}
                disabled={isLoading}
                title={getPersonaBadge(c.id).label}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#4F46E5] to-[#6366F1] shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSecurity && <ShieldAlert className="w-3.5 h-3.5 text-rose-200" />}
                <span>{c.name}</span>
              </Rim>
            );
          }

          return (
            <button
              type="button"
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              disabled={isLoading}
              title={getPersonaBadge(c.id).label}
              className="apple-glass-pill inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 text-slate-700 hover:text-slate-950 hover:bg-white/90 bg-white/50 backdrop-blur-md border border-white/80 shadow-2xs hover:shadow-xs active:scale-95"
            >
              {isSecurity && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected scenario summary */}
      {selected && selectedBadge && (
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border backdrop-blur-sm ${selectedBadge.color}`}>
          <BadgeCheck className="w-4 h-4 flex-shrink-0" />
          <span className="font-bold leading-snug">
            {selected.name} · {selectedBadge.label}
          </span>
        </div>
      )}
    </div>
  );
}
