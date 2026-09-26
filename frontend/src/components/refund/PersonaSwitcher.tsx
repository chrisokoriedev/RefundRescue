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
    { id: 'CUST-101', name: 'Sarah (Damaged Cookware)', icon: ShoppingBag },
    { id: 'CUST-102', name: 'Marcus (45 Days Old)', icon: Clock },
    { id: 'CUST-103', name: 'Elena (Final Sale Scarf)', icon: ShoppingBag },
    { id: 'CUST-104', name: 'David ($850 TV)', icon: Award },
    { id: 'CUST-106', name: 'Eve (Prompt Injection)', icon: ShieldAlert },
    { id: 'CUST-113', name: 'Tyler (Abusive History)', icon: Users },
  ];

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#3861FB] border border-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Synthetic Customer CRM (15 Test Personas)</h2>
            <p className="text-xs text-slate-400">Switch personas to test boundary conditions against store policy rules.</p>
          </div>
        </div>

        {/* Persona Selector Dropdown */}
        <div className="relative min-w-[280px]">
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs rounded-lg px-3.5 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3861FB] focus:bg-white transition-all font-semibold"
          >
            {customers.map((c) => {
              const badge = getPersonaBadge(c.id);
              return (
                <option key={c.id} value={c.id} className="bg-white text-slate-800 py-1">
                  {c.id}: {c.name} — {badge.label}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Test Preset Buttons */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#3861FB]" />
          Reviewer Quick Test Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPresets.map((preset) => {
            const isSelected = selectedCustomerId === preset.id;
            const Icon = preset.icon;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => onSelectCustomer(preset.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#3861FB] text-white shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : preset.id === 'CUST-106' ? 'text-rose-500' : 'text-slate-400'}`} />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Active Persona Card */}
      {selected && (
        <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {selected.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{selected.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">({selected.id})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#3861FB] border border-blue-100">
                  {selected.loyalty_tier} Tier
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5 font-medium">
                {selected.email} • {selected.past_orders_count} past orders • {selected.past_refunds_count} previous refunds
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs border ${getPersonaBadge(selected.id).color}`}>
              {getPersonaBadge(selected.id).label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
