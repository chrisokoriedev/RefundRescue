'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { PolicyRule, fetchPolicyRules } from '../../lib/refundApi';
import { FileText, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PolicyRulesPage() {
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPolicyRules()
      .then(setPolicies)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const getRuleDetails = (code: string) => {
    switch (code) {
      case 'POL-001':
        return {
          testedBy: 'Elena Rostova (CUST-103) & Samantha Reed (CUST-110)',
          personaId: 'CUST-103',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          type: 'Deterministic Hard Gate',
          tradeoff: 'Enforced strictly in code before LLM to guarantee zero hallucinations.'
        };
      case 'POL-002':
        return {
          testedBy: 'Marcus Vance (CUST-102) & Priya Patel (CUST-112)',
          personaId: 'CUST-102',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          type: 'Deterministic Hard Gate',
          tradeoff: 'Temporal arithmetic check prevents LLM from approving expired orders.'
        };
      case 'POL-003':
        return {
          testedBy: 'David Kim (CUST-104: $850 TV) & Jordan Miller (CUST-109: $1.2k Laptop)',
          personaId: 'CUST-104',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
          type: 'Deterministic Escalation Gate',
          tradeoff: 'Guarantees claims > $500 always route to human supervisors.'
        };
      case 'POL-004':
        return {
          testedBy: 'Sarah Jenkins (CUST-101: Damaged Cookware) & Chloe Bennet (CUST-105)',
          personaId: 'CUST-101',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          type: 'AI Review (semantic)',
          tradeoff: 'Gemini evaluates damage claims and drafts compassionate recovery responses.'
        };
      case 'POL-005':
        return {
          testedBy: 'Hacker Eve (CUST-106: Prompt Injection) & Arthur (CUST-107: Contradiction)',
          personaId: 'CUST-106',
          badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          icon: ShieldCheck,
          type: 'Hybrid Guardrail + Heuristic',
          tradeoff: 'Dual regex pre-scanner blocks jailbreaks and contradictory statements.'
        };
      default:
        return {
          testedBy: 'Standard Personas',
          personaId: 'CUST-101',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: FileText,
          type: 'General Policy',
          tradeoff: 'Standard policy evaluation.'
        };
    }
  };

  return (
    <AppShell
      activeView="policy"
      title="Refund Policy Rules"
    >
      {/* Header Banner Card */}
      <div className="apple-liquid-glass rounded-3xl p-6 sm:p-7 shadow-xs border border-white/80 flex flex-col gap-2.5 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-50 text-[#4F46E5] border border-indigo-100 flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            Business Rule Specifications
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-[#4F46E5]" />
          <span>Active Store Refund Policies & Constraints</span>
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl font-medium">
          RevRescue pairs hardcoded business rules (time limits, price limits, final-sale flags) with an AI review step so every decision follows store policy exactly.
        </p>
      </div>

      {/* Policy Cards List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs apple-liquid-glass rounded-3xl border border-white/80 shadow-xs font-medium">
          Loading policy rules...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {policies.map((p) => {
            const meta = getRuleDetails(p.code);
            const Icon = meta.icon;
            return (
              <div
                key={p.code}
                className="p-6 apple-liquid-glass border border-white/80 rounded-3xl shadow-xs flex flex-col gap-3 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                      {p.code}
                    </span>
                    <h3 className="font-black text-sm text-slate-900">{p.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Default:</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold border shadow-2xs ${meta.badge}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.defaultOutcome}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Enforcement Layer:</span>
                    <span className="font-bold text-slate-800">{meta.type}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{meta.tradeoff}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Try it with:</span>
                      <span className="font-bold text-slate-800">{meta.testedBy}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">
                      Simulated via the customer portal's sample-customer picker
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
