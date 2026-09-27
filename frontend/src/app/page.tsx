'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Order, fetchCustomers, fetchCustomerById } from '../lib/refundApi';
import { AppShell } from '../components/layout/AppShell';
import { PersonaSwitcher } from '../components/refund/PersonaSwitcher';
import { OrderSelector } from '../components/refund/OrderSelector';
import { RefundChat } from '../components/refund/RefundChat';
import { CreateTicketModal } from '../components/admin/CreateTicketModal';
import { ShieldAlert, Plus } from 'lucide-react';

export default function CustomerPortalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [initialClaimText, setInitialClaimText] = useState<string>('');
  const [autoSendClaim, setAutoSendClaim] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const selectCustomer = React.useCallback(async (id: string, defaultOrderId?: string) => {
    try {
      const fullCustomer = await fetchCustomerById(id);
      setSelectedCustomer(fullCustomer);
      if (defaultOrderId && fullCustomer.orders?.some(o => o.id === defaultOrderId)) {
        setSelectedOrderId(defaultOrderId);
      } else if (fullCustomer.orders && fullCustomer.orders.length > 0) {
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
        let targetCustomerId = data[0].id;
        let targetOrderId: string | undefined = undefined;

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const urlCustId = params.get('customerId');
          const urlOrderId = params.get('orderId');
          const urlClaim = params.get('claimText');
          const urlAuto = params.get('autoSend');

          if (urlCustId && data.some(c => c.id === urlCustId)) {
            targetCustomerId = urlCustId;
          }
          if (urlOrderId) {
            targetOrderId = urlOrderId;
          }
          if (urlClaim) {
            setInitialClaimText(urlClaim);
            setAutoSendClaim(urlAuto === '1' || urlAuto === 'true');
          }
        }

        await selectCustomer(targetCustomerId, targetOrderId);
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

  const headerActions = (
    <button
      type="button"
      onClick={() => setIsCreateOpen(true)}
      className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
    >
      <Plus className="w-3.5 h-3.5" />
      <span>Create Ticket / Claim</span>
    </button>
  );

  return (
    <AppShell
      activeView="customer"
      title="Customer Support & Refunds"
      subtitle={selectedCustomer ? `Helping ${selectedCustomer.name} · ${selectedCustomer.loyalty_tier} tier` : undefined}
      headerActions={headerActions}
      noPageScroll={true}
    >
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-0.5">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Order Resolution & Return Claims
          </h2>
          <p className="text-xs text-slate-500">
            Select your purchase below and chat with our automated support assistant for immediate resolution.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs">
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
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch overflow-hidden">
          {/* Left column: sample-customer picker + order context, stacked - ONLY scrollable container */}
          <div
            className="lg:col-span-5 h-full overflow-y-auto pr-1.5 custom-scrollbar flex flex-col gap-4"
            id="orders"
          >
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

          {/* Right column: chat floating - ONLY internal messages scroll */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0" id="chat">
            <RefundChat
              customer={selectedCustomer}
              order={activeOrder}
              initialPrompt={initialClaimText}
              autoSendPrompt={autoSendClaim}
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

      {/* Modal to create simulated ticket with predefined items */}
      <CreateTicketModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={async (ticketId, data) => {
          if (data?.customerId) {
            try {
              const fresh = await fetchCustomers();
              setCustomers(fresh);
              await selectCustomer(data.customerId, data.orderId);
              if (data.reason) {
                setInitialClaimText(data.reason);
                setAutoSendClaim(data.mode === 'chat');
              }
            } catch (err) {
              console.error(err);
              loadCustomers();
            }
          } else {
            loadCustomers();
          }
        }}
      />
    </AppShell>
  );
}
