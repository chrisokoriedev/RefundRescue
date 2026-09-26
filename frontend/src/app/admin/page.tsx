'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/refund/Navbar';
import { MetricsCards } from '../../components/admin/MetricsCards';
import { TicketTable } from '../../components/admin/TicketTable';
import { AuditDrawer } from '../../components/admin/AuditDrawer';
import { OverrideModal } from '../../components/admin/OverrideModal';
import { AdminMetrics, RefundTicket, fetchAdminMetrics, fetchAdminTickets } from '../../lib/refundApi';
import { LayoutDashboard, RefreshCw, ShieldAlert, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [tickets, setTickets] = useState<RefundTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer & Modal state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<RefundTicket | null>(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metricsData, ticketsData] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminTickets()
      ]);
      setMetrics(metricsData);
      setTickets(ticketsData);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend API on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenOverride = (ticket: RefundTicket) => {
    setOverrideTarget(ticket);
    setIsOverrideOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Customer Portal</span>
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5 mt-1">
              <LayoutDashboard className="w-6 h-6 text-cyan-400" />
              <span>Support & Fraud Operations Dashboard</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Audit AI refund decisions, inspect prompt/response traces, and execute supervisor overrides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Cards */}
        <MetricsCards metrics={metrics} isLoading={isLoading} />

        {/* Tickets Queue Table */}
        <TicketTable
          tickets={tickets}
          onSelectTicket={setSelectedTicketId}
          isLoading={isLoading}
        />
      </main>

      {/* Slide-over Audit Drawer */}
      <AuditDrawer
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onOpenOverride={handleOpenOverride}
      />

      {/* Manual Override Modal */}
      <OverrideModal
        isOpen={isOverrideOpen}
        onClose={() => {
          setIsOverrideOpen(false);
          setOverrideTarget(null);
        }}
        ticket={overrideTarget}
        onSuccess={() => {
          loadData();
          if (selectedTicketId) {
            // refresh active drawer
            setSelectedTicketId(selectedTicketId);
          }
        }}
      />
    </div>
  );
}
