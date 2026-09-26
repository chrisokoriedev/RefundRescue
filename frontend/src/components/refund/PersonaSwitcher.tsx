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
        return { label: 'Damaged (POL-004)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'CUST-102':
        return { label: 'Order >30d (POL-002)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'CUST-103':
        return { label: 'Final Sale (POL-001)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'CUST-104':
        return { label: 'High Value $850 (POL-003)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'CUST-105':
        return { label: 'Wrong Item (POL-004)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'CUST-106':
        return { label: 'Prompt Injection (POL-005)', color: 'bg-red-500/20 text-red-300 border-red-500/40 font-bold' };
      case 'CUST-107':
        return { label: 'Contradictory Claim', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'CUST-109':
        return { label: 'Laptop $1.2k (POL-003)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'CUST-110':
        return { label: 'Swimwear Final Sale', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'CUST-112':
        return { label: '62 Days Old (POL-002)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'CUST-113':
        return { label: 'Excessive Returns (4/5)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: 'Standard Customer', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
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
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Synthetic Customer CRM (15 Personas)</h2>
            <p className="text-xs text-zinc-400">Switch personas to test real-world scenarios against store policy rules.</p>
          </div>
        </div>

        {/* Persona Selector Dropdown */}
        <div className="relative min-w-[280px]">
          <select
            value={selectedCustomerId}
            onChange={(e) => onSelectCustomer(e.target.value)}
            disabled={isLoading}
            className="w-full bg-zinc-950 border border-zinc-700 hover:border-zinc-600 text-zinc-100 text-xs rounded-xl px-3.5 py-2.5 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all font-medium"
          >
            {customers.map((c) => {
              const badge = getPersonaBadge(c.id);
              return (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-200 py-1">
                  {c.id}: {c.name} — {badge.label}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Test Preset Buttons */}
      <div className="pt-3 border-t border-zinc-800/80">
        <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase block mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Reviewer Quick Test Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPresets.map((preset) => {
            const isSelected = selectedCustomerId === preset.id;
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectCustomer(preset.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-zinc-950/70 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${preset.id === 'CUST-106' ? 'text-rose-400' : 'text-zinc-400'}`} />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Active Persona Card */}
      {selected && (
        <div className="mt-4 p-3.5 bg-zinc-950/60 border border-zinc-800/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200">
              {selected.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{selected.name}</span>
                <span className="text-zinc-500 font-mono text-[11px]">({selected.id})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selected.loyalty_tier} Tier
                </span>
              </div>
              <div className="text-zinc-400 text-[11px] mt-0.5">
                {selected.email} • {selected.past_orders_count} past orders • {selected.past_refunds_count} previous refunds
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs border ${getPersonaBadge(selected.id).color}`}>
              {getPersonaBadge(selected.id).label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
