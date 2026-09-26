'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Order, fetchCustomers, fetchCustomerById } from '../lib/refundApi';
import { DealDeckShell } from '../components/layout/DealDeckShell';
import { PersonaSwitcher } from '../components/refund/PersonaSwitcher';
import { OrderSelector } from '../components/refund/OrderSelector';
import { RefundChat } from '../components/refund/RefundChat';
import { ShieldAlert, Sparkles } from 'lucide-react';

export default function CustomerPortalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectCustomer = React.useCallback(async (id: string) => {
    try {
      const fullCustomer = await fetchCustomerById(id);
      setSelectedCustomer(fullCustomer);
      if (fullCustomer.orders && fullCustomer.orders.length > 0) {
        setSelectedOrderId(fullCustomer.orders[0].id);
      }
    } catch (err: unknown) {
      console.error('Error fetching customer details:', err);
    }
  }, []);

  const loadCustomers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      if (data.length > 0) {
        await selectCustomer(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend on port 5000. Please start the backend.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectCustomer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const activeOrder: Order | undefined = selectedCustomer?.orders?.find(o => o.id === selectedOrderId) || selectedCustomer?.orders?.[0];

  return (
    <DealDeckShell
      activeView="customer"
      title="Customer Support & Refunds"
      subtitle="Friday, December 15th 2023"
      userProfile={{
        name: selectedCustomer?.name || 'Sarah Jenkins',
        role: `${selectedCustomer?.loyalty_tier || 'Gold'} Verified Customer`
      }}
    >
      {/* Welcome Banner Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col gap-1.5 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-[#3861FB] border border-blue-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#3861FB]" />
              AI Support Deliberation Portal
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-semibold">Instant Policy Decisions</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Order Returns, Exchanges & Issue Resolution
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Submit refund claims evaluated in real-time by a deterministic policy engine and Google Gemini Flash AI, with built-in prompt injection defense.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Store Protection</span>
            <span className="text-xs font-bold text-slate-800">POL-001 - POL-005 Active</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadCustomers}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Synthetic Customer Switcher */}
      <PersonaSwitcher
        customers={customers}
        selectedCustomerId={selectedCustomer?.id || 'CUST-101'}
        onSelectCustomer={selectCustomer}
        isLoading={isLoading}
      />

      {/* Main 2-Column Evaluation Workspace */}
      {selectedCustomer && activeOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Order Selector & Line Items */}
          <div className="lg:col-span-5" id="orders">
            <OrderSelector
              orders={selectedCustomer.orders || []}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
            />
          </div>

          {/* Right Column: Interactive AI Refund Chat */}
          <div className="lg:col-span-7" id="chat">
            <RefundChat
              customer={selectedCustomer}
              order={activeOrder}
              onEvaluationComplete={() => {
                // optionally notify
              }}
            />
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="p-10 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200/80 shadow-xs">
            Please connect the backend API to load customer order profiles.
          </div>
        )
      )}
    </DealDeckShell>
  );
}
