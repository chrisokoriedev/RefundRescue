'use client';

import React, { useState } from 'react';
import { RefundTicket } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { ShieldAlert, Search, Eye, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TicketTableProps {
  tickets: RefundTicket[];
  onSelectTicket: (ticketId: string) => void;
  isLoading?: boolean;
}

export function TicketTable({ tickets, onSelectTicket, isLoading }: TicketTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

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
    <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-5">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Refund Requests & Decisions</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live queue of all AI-reviewed tickets and manual overrides</p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs font-semibold">
            {['ALL', 'APPROVED', 'DENIED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Risk Level Filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs font-semibold">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((risk) => (
              <button
                key={risk}
                type="button"
                onClick={() => handleRiskFilterChange(risk)}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  riskFilter === risk
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search customer, ID..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3861FB] focus:bg-white transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200/70">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/70 text-[10px]">
            <tr>
              <th className="py-3 px-4 font-semibold">Ticket ID</th>
              <th className="py-3 px-4 font-semibold">Customer</th>
              <th className="py-3 px-4 font-semibold">Order ID & Amount</th>
              <th className="py-3 px-4 font-semibold">AI Decision</th>
              <th className="py-3 px-4 font-semibold">Security / Risk</th>
              <th className="py-3 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              [...Array(pageSize)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="py-3.5 px-4 h-12 bg-slate-50/30" />
                </tr>
              ))
            ) : paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  No refund tickets matching current filters.
                </td>
              </tr>
            ) : (
              paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 group-hover:text-[#3861FB] transition-colors">
                      {ticket.id}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{ticket.customer_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ticket.customer_id} • {ticket.loyalty_tier}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-slate-500">{ticket.order_id}</span>
                    <span className="block font-bold text-slate-900">
                      ${ticket.requested_amount.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <DecisionBadge
                      decision={ticket.decision}
                      confidenceScore={ticket.confidence_score}
                      riskLevel={ticket.risk_level}
                      size="sm"
                    />
                  </td>

                  <td className="py-3 px-4">
                    {ticket.prompt_injection_detected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        Injection Blocked
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {ticket.risk_level} Risk
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#3861FB] hover:text-white text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-2xs group-hover:border-[#3861FB]"
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

      {/* ── Pagination Controls at the Bottom ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
        
        {/* Left: Range count */}
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800">{endIndex}</strong> of{' '}
            <strong className="text-slate-800">{totalItems}</strong> tickets
          </span>

          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-400 text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-md px-2 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3861FB]"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {/* Right: Page navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage === 1}
            title="First page"
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            title="Previous page"
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      className={`min-w-[28px] h-7 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                        validCurrentPage === pageNum
                          ? 'bg-[#3861FB] text-white shadow-2xs'
                          : 'border border-slate-200/80 text-slate-700 hover:bg-slate-50'
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
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage === totalPages}
            title="Last page"
            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
