'use client';

import React, { useState } from 'react';
import { RefundTicket } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { ShieldAlert, Search, Eye, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface TicketTableProps {
  tickets: RefundTicket[];
  onSelectTicket: (ticketId: string) => void;
  isLoading?: boolean;
  newTicketIds?: Set<string>;
}

export function TicketTable({ tickets, onSelectTicket, isLoading, newTicketIds }: TicketTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [tbodyRef] = useAutoAnimate<HTMLTableSectionElement>();

  const counts = {
    ALL: tickets.length,
    APPROVED: tickets.filter(t => t.decision === 'APPROVED').length,
    DENIED: tickets.filter(t => t.decision === 'DENIED').length,
    ESCALATED: tickets.filter(t => t.decision === 'ESCALATED').length,
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRiskFilterChange = (risk: string) => {
    setRiskFilter(risk);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

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

  // Calculate pagination slice
  const totalItems = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  return (
    <div className="glass-card-apple apple-liquid-glass rounded-3xl p-6 sm:p-7 shadow-xs border border-white/80 flex flex-col gap-5">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#0F172A]">
              Recent Refund Requests & Decisions
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Live queue of all AI-reviewed tickets and manual overrides
            </p>
          </div>
        </div>

        {/* Filter Pills, Search, and Create Ticket Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filters with Electric Iris Accent */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold backdrop-blur-md">
            {['ALL', 'APPROVED', 'DENIED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === status
                    ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === status
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {counts[status as keyof typeof counts] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Risk Level Filter with Royal Amethyst Accent */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold backdrop-blur-md">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => handleRiskFilterChange(risk)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  riskFilter === risk
                    ? 'bg-[#7C3AED] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {risk === 'ALL' ? 'All Risks' : `${risk.charAt(0) + risk.slice(1).toLowerCase()} Risk`}
              </button>
            ))}
          </div>

          {/* Search Input with high contrast visible icon & border */}
          <div className="relative min-w-[210px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search tickets, names..."
              className="w-full bg-white hover:bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-all font-medium shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Table with Frosted Apple Styling */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/60 backdrop-blur-md shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70 text-[10px]">
            <tr>
              <th className="py-3.5 px-4.5 font-bold">Ticket ID</th>
              <th className="py-3.5 px-4.5 font-bold">Customer</th>
              <th className="py-3.5 px-4.5 font-bold">Order ID & Amount</th>
              <th className="py-3.5 px-4.5 font-bold">AI Decision</th>
              <th className="py-3.5 px-4.5 font-bold">Security / Risk</th>
              <th className="py-3.5 px-4.5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody ref={tbodyRef} className="divide-y divide-slate-100/80 bg-white/40">
            {isLoading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="py-4 px-4.5 h-14 bg-slate-50/30" />
                </tr>
              ))
            ) : paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 text-xs font-medium">
                  No refund tickets matching current filters.
                </td>
              </tr>
            ) : (
              paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`transition-colors cursor-pointer group ${
                    newTicketIds?.has(ticket.id)
                      ? 'bg-indigo-50/60 hover:bg-indigo-50/80'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-4.5">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                      {ticket.id}
                    </span>
                    {newTicketIds?.has(ticket.id) && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#FF5500] text-white text-[9px] font-black align-middle shadow-xs">
                        NEW
                      </span>
                    )}
                    <span className="block text-[10px] text-slate-400 font-medium">
                      {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="py-3.5 px-4.5">
                    <span className="font-bold text-slate-900 block">{ticket.customer_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ticket.customer_id} • {ticket.loyalty_tier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4.5">
                    <span className="font-mono text-slate-500 font-medium">{ticket.order_id}</span>
                    <span className="block font-black text-slate-900">
                      ${ticket.requested_amount.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4.5">
                    <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                      <DecisionBadge
                        decision={ticket.decision}
                        confidenceScore={ticket.confidence_score}
                        riskLevel={ticket.risk_level}
                        size="sm"
                      />
                      {(ticket.reasoning_summary?.includes('[Private Admin Alert]') || (ticket.confidence_score < 0.75 && ticket.decision === 'ESCALATED')) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2 py-0.5 shadow-2xs whitespace-nowrap flex-shrink-0">
                          ⚠️ Review Needed
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4.5">
                    {ticket.prompt_injection_detected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5ED] text-[#FF5500] border border-[#FFD8C2] shadow-2xs">
                        <ShieldAlert className="w-3 h-3 text-[#FF5500]" />
                        Injection Blocked
                      </span>
                    ) : ticket.risk_level === 'LOW' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shadow-2xs">
                        LOW RISK
                      </span>
                    ) : ticket.risk_level === 'MEDIUM' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] shadow-2xs">
                        MEDIUM RISK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF5ED] text-[#FF5500] border border-[#FFD8C2] shadow-2xs">
                        HIGH RISK
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 hover:bg-[#7C3AED] hover:text-white text-slate-700 text-xs font-bold border border-slate-200/80 transition-all shadow-2xs group-hover:border-[#7C3AED] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#7C3AED] group-hover:text-white" />
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

      {/* ── Pagination Controls at the Bottom ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
        
        {/* Left: Range count */}
        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-semibold text-xs">
            {totalItems > pageSize
              ? `${startIndex + 1}–${endIndex} of ${totalItems}`
              : `${totalItems} ${totalItems === 1 ? 'ticket' : 'tickets'}`}
          </span>

          {totalItems > 10 && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-400 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-white/80 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
        </div>

        {/* Right: Page navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage === 1}
            title="First page"
            className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            title="Previous page"
            className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;

                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && (
                      <span className="px-1 text-slate-300">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[30px] h-7 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                        validCurrentPage === pageNum
                          ? 'bg-[#7C3AED] text-white shadow-xs'
                          : 'border border-slate-200/80 text-slate-700 bg-white/60 hover:bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          {/* Next page */}
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            title="Next page"
            className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage === totalPages}
            title="Last page"
            className="p-1.5 rounded-lg border border-slate-200/80 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
