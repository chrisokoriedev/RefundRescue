import React, { useState } from 'react';
import { RefundTicket } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { ShieldAlert, Search, Filter, Eye, ArrowUpDown, ChevronRight } from 'lucide-react';

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
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Recent Refund Requests & Decisions</h2>
          <p className="text-xs text-zinc-400">Real-time audit queue of all AI-deliberated tickets and supervisor overrides</p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {['ALL', 'APPROVED', 'DENIED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, ID..."
              className="bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-950/80 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800 text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Ticket ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Order ID & Amount</th>
              <th className="py-3.5 px-4">AI Decision</th>
              <th className="py-3.5 px-4">Security / Risk</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="py-4 px-4 h-12 bg-zinc-900/20" />
                </tr>
              ))
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                  No refund tickets matching current filters.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-medium text-zinc-300 group-hover:text-cyan-400 transition-colors">
                      {ticket.id}
                    </span>
                    <span className="block text-[10px] text-zinc-500">
                      {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-200 block">{ticket.customer_name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {ticket.customer_id} • {ticket.loyalty_tier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-zinc-300">{ticket.order_id}</span>
                    <span className="block font-bold text-zinc-200">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        Injection Flagged
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">
                        {ticket.risk_level} Risk
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Audit</span>
                      <ChevronRight className="w-3 h-3 text-zinc-500" />
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
