'use client';

import React, { useState } from 'react';
import { RefundTicket } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { ShieldAlert, Search, Eye, ChevronRight } from 'lucide-react';

interface TicketTableProps {
  tickets: RefundTicket[];
  onSelectTicket: (ticketId: string) => void;
  isLoading?: boolean;
}

export function TicketTable({ tickets, onSelectTicket, isLoading }: TicketTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.decision !== statusFilter) return false;
    if (riskFilter !== 'ALL' && t.risk_level !== riskFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q) ||
        t.order_id.toLowerCase().includes(q) ||
        t.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Refund Requests & Decisions</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time audit queue of all AI-deliberated tickets and supervisor overrides</p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filters */}
          <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold">
            {['ALL', 'APPROVED', 'DENIED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#3861FB] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Risk Level Filter */}
          <div className="flex bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs font-semibold">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => setRiskFilter(risk)}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                  riskFilter === risk
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {risk === 'ALL' ? 'All Risks' : `${risk.charAt(0) + risk.slice(1).toLowerCase()} Risk`}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, ID..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-2xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3861FB] focus:bg-white transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Ticket ID</th>
              <th className="py-3.5 px-4 font-semibold">Customer</th>
              <th className="py-3.5 px-4 font-semibold">Order ID & Amount</th>
              <th className="py-3.5 px-4 font-semibold">AI Decision</th>
              <th className="py-3.5 px-4 font-semibold">Security / Risk</th>
              <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="py-4 px-4 h-14 bg-slate-50/40" />
                </tr>
              ))
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  No refund tickets matching current filters.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-[#3861FB] transition-colors">
                      {ticket.id}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{ticket.customer_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ticket.customer_id} • {ticket.loyalty_tier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-500">{ticket.order_id}</span>
                    <span className="block font-extrabold text-slate-900">
                      ${ticket.requested_amount.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <DecisionBadge
                      decision={ticket.decision}
                      confidenceScore={ticket.confidence_score}
                      riskLevel={ticket.risk_level}
                      size="sm"
                    />
                  </td>

                  <td className="py-3.5 px-4">
                    {ticket.prompt_injection_detected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        Injection Intercepted
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {ticket.risk_level} Risk
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#3861FB] hover:text-white text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all shadow-2xs group-hover:border-[#3861FB]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#3861FB] group-hover:text-white" />
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-white" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
