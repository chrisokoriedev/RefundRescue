'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Order, fetchCustomers, fetchCustomerById } from '../lib/refundApi';
import { AppShell } from '../components/layout/AppShell';
import { PersonaSwitcher } from '../components/refund/PersonaSwitcher';
import { OrderSelector } from '../components/refund/OrderSelector';
import { RefundChat } from '../components/refund/RefundChat';
import { ShieldAlert } from 'lucide-react';

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
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend. Please start the backend.';
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
    <AppShell
      activeView="customer"
      title="Customer Support & Refunds"
      subtitle={selectedCustomer ? `Helping ${selectedCustomer.name} · ${selectedCustomer.loyalty_tier} tier` : undefined}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Order Resolution & Return Claims
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your purchase below and chat with our automated support assistant for immediate resolution.
          </p>
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

      {selectedCustomer && activeOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left column: sample-customer picker + order context, stacked */}
          <div className="lg:col-span-5 flex flex-col gap-5" id="orders">
            <PersonaSwitcher
              customers={customers}
              selectedCustomerId={selectedCustomer?.id || 'CUST-101'}
              onSelectCustomer={selectCustomer}
              isLoading={isLoading}
            />

            <OrderSelector
              orders={selectedCustomer.orders || []}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
            />
          </div>

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
    </AppShell>
  );
}
