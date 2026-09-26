'use client';

import React, { useEffect, useState } from 'react';
import { Customer, Order, fetchCustomers, fetchCustomerById } from '../lib/refundApi';
import { Navbar } from '../components/refund/Navbar';
import { PersonaSwitcher } from '../components/refund/PersonaSwitcher';
import { OrderSelector } from '../components/refund/OrderSelector';
import { RefundChat } from '../components/refund/RefundChat';
import { ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomerPortalPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      if (data.length > 0) {
        await selectCustomer(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend on port 5000. Please start the backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectCustomer = async (id: string) => {
    try {
      const fullCustomer = await fetchCustomerById(id);
      setSelectedCustomer(fullCustomer);
      if (fullCustomer.orders && fullCustomer.orders.length > 0) {
        setSelectedOrderId(fullCustomer.orders[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching customer details:', err);
    }
  };

  const activeOrder: Order | undefined = selectedCustomer?.orders?.find(o => o.id === selectedOrderId) || selectedCustomer?.orders?.[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Support Workflow
              </span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs font-mono">RevRescue v1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Customer Support Refund Portal
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Submit refund claims evaluated in real-time by a hybrid deterministic policy engine and Google Gemini Flash AI, with built-in prompt injection defense.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 transition-all shadow-sm"
            >
              <span>View Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadCustomers}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Persona Switcher Component */}
        <PersonaSwitcher
          customers={customers}
          selectedCustomerId={selectedCustomer?.id || 'CUST-101'}
          onSelectCustomer={selectCustomer}
          isLoading={isLoading}
        />

        {/* Main 2-Column Evaluation Workspace */}
        {selectedCustomer && activeOrder ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Order Selector & Line Items */}
            <div className="lg:col-span-5">
              <OrderSelector
                orders={selectedCustomer.orders || []}
                selectedOrderId={selectedOrderId}
                onSelectOrder={setSelectedOrderId}
              />
            </div>

            {/* Right Column: Interactive AI Refund Chat */}
            <div className="lg:col-span-7">
              <RefundChat
                customer={selectedCustomer}
                order={activeOrder}
                onEvaluationComplete={() => {
                  // Optionally refresh or notify
                }}
              />
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="p-12 text-center text-zinc-500 text-sm bg-zinc-900/40 rounded-2xl border border-zinc-800">
              Please connect the backend API to load customer order profiles.
            </div>
          )
        )}
      </main>
    </div>
  );
}
