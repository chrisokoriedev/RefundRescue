'use client';

import React from 'react';
import { Customer } from '../../lib/refundApi';
import { ShieldAlert, Sparkles, BadgeCheck } from 'lucide-react';

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
        return { label: 'Damaged item → AI approval (POL-004)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CUST-102':
        return { label: 'Order over 30 days → denied (POL-002)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CUST-103':
        return { label: 'Final sale item → denied (POL-001)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CUST-104':
        return { label: '$850 TV → human review (POL-003)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'CUST-105':
        return { label: 'Wrong item received → approval (POL-004)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CUST-106':
        return { label: 'Prompt injection attempt → blocked (POL-005)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'CUST-107':
        return { label: 'Contradictory claim → escalated (POL-005)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'CUST-109':
        return { label: '$1.2k laptop → human review (POL-003)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'CUST-110':
        return { label: 'Swimwear final sale → denied (POL-001)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CUST-112':
        return { label: '62-day-old order → denied (POL-002)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CUST-113':
        return { label: 'Excessive returns (4 of 5) → escalated (POL-005)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Standard customer', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const selectedBadge = selected ? getPersonaBadge(selected.id) : null;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col gap-3 text-xs">
      {/* Panel headline — the main way to explore the demo */}
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3861FB] border border-blue-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Try a sample customer</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            One click loads a ready-made refund scenario — each one exercises a different policy rule.
          </p>
        </div>
      </div>

      {/* All customers as selectable pills */}
      <div className="flex flex-wrap gap-1.5">
        {customers.map((c) => {
          const isSelected = c.id === selectedCustomerId;
          const isSecurity = c.id === 'CUST-106';
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => onSelectCustomer(c.id)}
              disabled={isLoading}
              title={getPersonaBadge(c.id).label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                isSelected
                  ? 'bg-[#3861FB] text-white shadow-2xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:text-slate-900'
              }`}
            >
              {isSecurity && !isSelected && <ShieldAlert className="w-3 h-3 text-rose-500" />}
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected scenario summary */}
      {selected && selectedBadge && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${selectedBadge.color}`}>
          <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold leading-snug">
            {selected.name} · {selectedBadge.label}
          </span>
        </div>
      )}
    </div>
  );
}
