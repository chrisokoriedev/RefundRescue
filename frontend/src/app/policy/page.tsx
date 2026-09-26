'use client';

import React, { useEffect, useState } from 'react';
import { DealDeckShell } from '../../components/layout/DealDeckShell';
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
          type: 'AI Semantic Deliberation',
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
    <DealDeckShell
      activeView="policy"
      title="Store Policy Engine Rules"
      subtitle="Friday, December 15th 2023"
      userProfile={{
        name: 'Policy Engine',
        role: 'Deterministic Gates'
      }}
    >
      {/* Header Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-[#3861FB] border border-blue-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3861FB]" />
            Business Rule Specifications
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-[#3861FB]" />
          <span>Active Store Refund Policies & Constraints</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
          RevRescue pairs hardcoded deterministic boundaries (time, price, final sale flags) with Google Gemini Flash deliberation to ensure complete policy adherence with zero hallucinations.
        </p>
      </div>

      {/* Policy Cards List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-100 shadow-sm">
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
                className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#3861FB] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {p.code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Default Outcome:</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold border ${meta.badge}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.defaultOutcome}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {p.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Enforcement Layer:</span>
                    <span className="font-bold text-slate-800">{meta.type}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{meta.tradeoff}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Test Persona:</span>
                      <span className="font-bold text-slate-800">{meta.testedBy}</span>
                    </div>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1 text-[11px] text-[#3861FB] hover:underline mt-2 font-bold"
                    >
                      <span>Test Scenario in Customer Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DealDeckShell>
  );
}
