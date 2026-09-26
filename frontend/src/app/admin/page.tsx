'use client';

import React, { useEffect, useState } from 'react';
import { DealDeckShell } from '../../components/layout/DealDeckShell';
import { DealDeckMetricsRow } from '../../components/dealdeck/DealDeckMetricsRow';
import { CustomerHabitsChart } from '../../components/dealdeck/CustomerHabitsChart';
import { ProductStatisticRings } from '../../components/dealdeck/ProductStatisticRings';
import { CustomerGrowthBubbles } from '../../components/dealdeck/CustomerGrowthBubbles';
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
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend API on port 5000.';
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
      className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 text-[#3861FB] ${isLoading ? 'animate-spin' : ''}`} />
      <span>Refresh Data</span>
    </button>
  );

  return (
    <DealDeckShell
      activeView="admin"
      title="Sales Report"
      subtitle="Friday, December 15th 2023"
      userProfile={{
        name: 'Ferra Alexandra',
        role: 'Admin store'
      }}
      headerActions={headerActions}
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Row 1: Top 4 DealDeck Stat Cards (Vibrant Blue + 3 White Cards) */}
      <DealDeckMetricsRow metrics={metrics} isLoading={isLoading} />

      {/* Row 2: Charts and Analytics (DealDeck Replica Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Customer Habits bar chart) */}
        <div className="lg:col-span-7">
          <CustomerHabitsChart />
        </div>

        {/* Right Column (Product Statistic rings + Customer Growth bubbles) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <ProductStatisticRings />
          <CustomerGrowthBubbles />
        </div>
      </div>

      {/* Row 3: Ticket Queue Table (DealDeck style) */}
      <div id="tickets">
        <TicketTable
          tickets={tickets}
          onSelectTicket={setSelectedTicketId}
          isLoading={isLoading}
        />
      </div>

      {/* Slide-over Audit Drawer in Light Mode */}
      <AuditDrawer
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onOpenOverride={handleOpenOverride}
      />

      {/* Manual Override Modal in Light Mode */}
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
            setSelectedTicketId(selectedTicketId);
          }
        }}
      />
    </DealDeckShell>
  );
}
