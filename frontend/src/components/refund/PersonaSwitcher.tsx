'use client';

import React from 'react';
import { Customer } from '../../lib/refundApi';
import { Users, Award, ShieldAlert, Sparkles, Clock, ShoppingBag } from 'lucide-react';

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
        return { label: 'Damaged (POL-004)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' };
      case 'CUST-102':
        return { label: 'Order >30d (POL-002)', color: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
      case 'CUST-103':
        return { label: 'Final Sale (POL-001)', color: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
      case 'CUST-104':
        return { label: 'High Value $850 (POL-003)', color: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' };
      case 'CUST-105':
        return { label: 'Wrong Item (POL-004)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' };
      case 'CUST-106':
        return { label: 'Prompt Injection (POL-005)', color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' };
      case 'CUST-107':
        return { label: 'Contradictory Claim', color: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' };
      case 'CUST-109':
        return { label: 'Laptop $1.2k (POL-003)', color: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' };
      case 'CUST-110':
        return { label: 'Swimwear Final Sale', color: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
      case 'CUST-112':
        return { label: '62 Days Old (POL-002)', color: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
      case 'CUST-113':
        return { label: 'Excessive Returns (4/5)', color: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' };
      default:
        return { label: 'Standard Customer', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const quickPresets = [
    { id: 'CUST-101', name: 'Sarah (Damaged)', icon: ShoppingBag, desc: 'POL-004 AI Approval' },
    { id: 'CUST-102', name: 'Marcus (>30 Days)', icon: Clock, desc: 'POL-002 Hard Denial' },
    { id: 'CUST-103', name: 'Elena (Final Sale)', icon: ShoppingBag, desc: 'POL-001 Hard Denial' },
    { id: 'CUST-104', name: 'David ($850 TV)', icon: Award, desc: 'POL-003 Escalation' },
    { id: 'CUST-106', name: 'Eve (Prompt Injection)', icon: ShieldAlert, desc: 'POL-005 Guardrail Block' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3 px-4 shadow-2xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      {/* Left: Simulation Label and Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#3861FB] border border-blue-100 font-bold text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try a sample customer</span>
        </div>

        <div className="relative min-w-[220px]">
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-lg pl-3 pr-8 py-1.5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3861FB] font-semibold transition-all"
          >
            {customers.map((c) => {
              const badge = getPersonaBadge(c.id);
              return (
                <option key={c.id} value={c.id} className="bg-white text-slate-800 py-1">
                  {c.name} — {badge.label}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Center/Right: Quick Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden lg:inline mr-1">
          Quick Tests:
        </span>
        {quickPresets.map((preset) => {
          const isSelected = selectedCustomerId === preset.id;
          const Icon = preset.icon;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onSelectCustomer(preset.id)}
              title={preset.desc}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#3861FB] text-white shadow-2xs font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : preset.id === 'CUST-106' ? 'text-rose-500' : 'text-slate-400'}`} />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
