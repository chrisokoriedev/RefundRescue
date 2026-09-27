'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { MetricsSummary } from '../../components/admin/MetricsSummary';
import { TicketTable } from '../../components/admin/TicketTable';
import { AuditDrawer } from '../../components/admin/AuditDrawer';
import { OverrideModal } from '../../components/admin/OverrideModal';
import { ResetDataModal } from '../../components/admin/ResetDataModal';
import { CreateTicketModal } from '../../components/admin/CreateTicketModal';
import { AdminMetrics, RefundTicket, fetchAdminMetrics, fetchAdminTickets } from '../../lib/refundApi';
import { RefreshCw, ShieldAlert, RotateCcw, Plus } from 'lucide-react';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [tickets, setTickets] = useState<RefundTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTicketIds, setNewTicketIds] = useState<Set<string>>(new Set());
  const knownTicketIds = useRef<Set<string> | null>(null); // null = first load (nothing is "new" then)

  // Drawer & Modal state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<RefundTicket | null>(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState<boolean>(false);
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState<boolean>(false);

  const loadData = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    if (!silent) setError(null);
    try {
      const [metricsData, ticketsData] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminTickets()
      ]);
      setMetrics(metricsData);
      setTickets(ticketsData);

      // Detect tickets that arrived since the last poll — highlight as NEW
      const incoming = new Set(ticketsData.map(t => t.id));
      if (knownTicketIds.current) {
        const fresh = new Set([...incoming].filter(id => !knownTicketIds.current!.has(id)));
        if (fresh.size > 0) setNewTicketIds(fresh);
      }
      knownTicketIds.current = incoming;
    } catch (err: unknown) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : 'Failed to connect to backend API.';
        setError(msg);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Silent refresh when browser tab regains focus (no aggressive interval flashing)
  useEffect(() => {
    const handleFocus = () => {
      loadData(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);

  // Clear NEW highlights after 30s so the badge stays meaningful
  useEffect(() => {
    if (newTicketIds.size === 0) return;
    const t = setTimeout(() => setNewTicketIds(new Set()), 30_000);
    return () => clearTimeout(t);
  }, [newTicketIds]);

  const handleOpenOverride = (ticket: RefundTicket) => {
    setOverrideTarget(ticket);
    setIsOverrideOpen(true);
  };

  const headerActions = (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => setIsCreateTicketOpen(true)}
        className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-black shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Create Ticket</span>
      </button>

      <button
        type="button"
        onClick={() => setIsResetOpen(true)}
        className="px-3.5 py-2 rounded-xl bg-white/70 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-2 transition-all cursor-pointer backdrop-blur-md"
        title="Wipe test data and restore baseline demo database"
      >
        <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
        <span className="hidden sm:inline">Reset Database</span>
        <span className="sm:hidden">Reset</span>
      </button>

      <button
        type="button"
        onClick={() => loadData(false)}
        disabled={isLoading}
        className="px-3.5 py-2 rounded-xl bg-white/70 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-[#4F46E5] ${isLoading ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button>
    </div>
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
            onClick={() => loadData(false)}
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
          newTicketIds={newTicketIds}
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
          loadData(false);
        }}
      />

      {/* Confirmation modal to wipe test data and restore demo seed */}
      <ResetDataModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onSuccess={() => {
          loadData(false);
        }}
      />

      {/* Modal to create simulated ticket with predefined items */}
      <CreateTicketModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onSuccess={(ticketId) => {
          loadData(false);
          if (ticketId) setSelectedTicketId(ticketId);
        }}
      />
    </AppShell>
  );
}
