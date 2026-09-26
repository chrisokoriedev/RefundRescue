'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/refund/Navbar';
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
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: XCircle,
          type: 'Deterministic Hard Gate',
          tradeoff: 'Enforced strictly in code before LLM to guarantee zero hallucinations.'
        };
      case 'POL-002':
        return {
          testedBy: 'Marcus Vance (CUST-102) & Priya Patel (CUST-112)',
          personaId: 'CUST-102',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: XCircle,
          type: 'Deterministic Hard Gate',
          tradeoff: 'Temporal arithmetic check prevents LLM from approving expired orders.'
        };
      case 'POL-003':
        return {
          testedBy: 'David Kim (CUST-104: $850 TV) & Jordan Miller (CUST-109: $1.2k Laptop)',
          personaId: 'CUST-104',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
          type: 'Deterministic Escalation Gate',
          tradeoff: 'Guarantees claims > $500 always route to human supervisors.'
        };
      case 'POL-004':
        return {
          testedBy: 'Sarah Jenkins (CUST-101: Damaged Cookware) & Chloe Bennet (CUST-105)',
          personaId: 'CUST-101',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          type: 'AI Semantic Deliberation',
          tradeoff: 'Gemini evaluates damage claims and drafts compassionate recovery responses.'
        };
      case 'POL-005':
        return {
          testedBy: 'Hacker Eve (CUST-106: Prompt Injection) & Arthur (CUST-107: Contradiction)',
          personaId: 'CUST-106',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldCheck,
          type: 'Hybrid Guardrail + Heuristic',
          tradeoff: 'Dual regex pre-scanner blocks jailbreaks and contradictory statements.'
        };
      default:
        return {
          testedBy: 'Standard Personas',
          personaId: 'CUST-101',
          badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          icon: FileText,
          type: 'General Policy',
          tradeoff: 'Standard policy evaluation.'
        };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Business Rule Specifications
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Active Store Refund Policies & Constraints</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            RevRescue pairs hardcoded deterministic boundaries (time, price, final sale flags) with Google Gemini Flash deliberation to ensure complete policy adherence with zero hallucinations.
          </p>
        </div>

        {/* Policy Cards List */}
        <div className="flex flex-col gap-4">
          {policies.map((p) => {
            const meta = getRuleDetails(p.code);
            const Icon = meta.icon;
            return (
              <div
                key={p.code}
                className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-lg flex flex-col gap-3 hover:border-zinc-700/80 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      {p.code}
                    </span>
                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 font-medium">Default:</span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold border ${meta.badge}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.defaultOutcome}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {p.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-zinc-400">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Enforcement Layer:</span>
                    <span className="font-medium text-zinc-200">{meta.type}</span>
                    <span className="block text-[11px] text-zinc-500 mt-0.5">{meta.tradeoff}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-zinc-400 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5">Test Persona:</span>
                      <span className="font-medium text-zinc-200">{meta.testedBy}</span>
                    </div>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 mt-2 font-medium"
                    >
                      <span>Test in Customer Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
