'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { MetricsSummary } from '../../components/admin/MetricsSummary';
import { TicketTable } from '../../components/admin/TicketTable';
import { AuditDrawer } from '../../components/admin/AuditDrawer';
import { OverrideModal } from '../../components/admin/OverrideModal';
import { AdminMetrics, RefundTicket, fetchAdminMetrics, fetchAdminTickets } from '../../lib/refundApi';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [tickets, setTickets] = useState<RefundTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer & Modal state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<RefundTicket | null>(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState<boolean>(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metricsData, ticketsData] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminTickets()
      ]);
      setMetrics(metricsData);
      setTickets(ticketsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend API.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleOpenOverride = (ticket: RefundTicket) => {
    setOverrideTarget(ticket);
    setIsOverrideOpen(true);
  };

  const headerActions = (
    <button
      type="button"
      onClick={loadData}
      disabled={isLoading}
      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 text-[#3861FB] ${isLoading ? 'animate-spin' : ''}`} />
      <span>Refresh Data</span>
    </button>
  );

  return (
    <AppShell
      activeView="admin"
      title="Support Dashboard"
      headerActions={headerActions}
    >
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Live summary numbers from GET /api/admin/metrics */}
      <MetricsSummary metrics={metrics} isLoading={isLoading} />

      {/* Refund request queue with AI decisions */}
      <div id="tickets">
        <TicketTable
          tickets={tickets}
          onSelectTicket={setSelectedTicketId}
          isLoading={isLoading}
        />
      </div>

      {/* Slide-over with AI reasoning + audit trail */}
      <AuditDrawer
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onOpenOverride={handleOpenOverride}
      />

      {/* Manual override modal (supervisor decision) */}
      <OverrideModal
        isOpen={isOverrideOpen}
        onClose={() => {
          setIsOverrideOpen(false);
          setOverrideTarget(null);
        }}
        ticket={overrideTarget}
        onSuccess={() => {
          loadData();
        }}
      />
    </AppShell>
  );
}
