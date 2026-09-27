'use client';

import React from 'react';
import { Order } from '../../lib/refundApi';
import { Package, Calendar, MapPin, AlertCircle, CheckCircle, Tag } from 'lucide-react';

interface OrderSelectorProps {
  orders: Order[];
  selectedOrderId: string;
  onSelectOrder: (orderId: string) => void;
}

export function OrderSelector({ orders, selectedOrderId, onSelectOrder }: OrderSelectorProps) {
  const selectedOrder = orders && orders.length > 0
    ? (orders.find(o => o.id === selectedOrderId) || orders[0])
    : null;

  const [daysAgo, setDaysAgo] = React.useState(0);

  React.useEffect(() => {
    if (!selectedOrder?.order_date) return;
    const timer = setTimeout(() => {
      const diff = Date.now() - new Date(selectedOrder.order_date).getTime();
      setDaysAgo(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedOrder?.order_date]);

  if (!orders || orders.length === 0 || !selectedOrder) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-400 text-xs shadow-xs">
        No orders found for this persona.
      </div>
    );
  }

  const isExpired = daysAgo > 30;
  const isHighValue = selectedOrder.total_amount > 500;
  const hasFinalSale = selectedOrder.items?.some(i => i.is_final_sale === 1);

  return (
    <div className="apple-liquid-glass rounded-3xl p-6 sm:p-7 shadow-xs border border-white/80 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#4F46E5] border border-indigo-100 flex items-center justify-center shadow-2xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Order Context</h3>
            <p className="text-xs text-slate-500 font-medium">Order metadata and line items analyzed by policy engine</p>
          </div>
        </div>

        {orders.length > 1 && (
          <select
            value={selectedOrderId}
            onChange={(e) => onSelectOrder(e.target.value)}
            className="bg-white/80 hover:bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 font-semibold cursor-pointer shadow-2xs"
          >
            {orders.map(o => (
              <option key={o.id} value={o.id} className="bg-white text-slate-800">
                {o.id} (${o.total_amount.toFixed(2)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected Order Summary Card */}
      <div className="p-4.5 bg-white/70 border border-slate-200/70 rounded-2xl flex flex-col gap-3 shadow-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base font-black text-slate-900">{selectedOrder.id}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200/80">
              {selectedOrder.status}
            </span>
          </div>
          <div className="text-base font-black text-[#4F46E5]">
            ${selectedOrder.total_amount.toFixed(2)} {selectedOrder.currency}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Placed {new Date(selectedOrder.order_date).toLocaleDateString()} ({daysAgo} days ago)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="truncate">{selectedOrder.shipping_address}</span>
          </div>
        </div>

        {/* Policy Flags Indicators */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {hasFinalSale && (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-2xs">
              <Tag className="w-3 h-3 text-rose-600" />
              Final Sale Item (POL-001)
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold shadow-2xs">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Order &gt; 30 Days Old (POL-002)
            </span>
          )}
          {isHighValue && (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-2xs">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Exceeds $500 Threshold (POL-003)
            </span>
          )}
          {!hasFinalSale && !isExpired && !isHighValue && (
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-2xs">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              In-Window Regular Order (POL-004)
            </span>
          )}
        </div>

        {/* Expected Persona Evaluation Note */}
        {selectedOrder.scenario_description && (
          <div className="mt-1 p-3 bg-white/80 border border-slate-200/80 rounded-xl text-xs text-slate-600 shadow-2xs">
            <span className="text-slate-400 uppercase tracking-wider font-bold text-[9px] block mb-0.5">Test Scenario Note:</span>
            {selectedOrder.scenario_description}
            {selectedOrder.expected_outcome && (
              <span className="block mt-1 font-bold text-[#4F46E5]">
                Target Policy Result: {selectedOrder.expected_outcome}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Line Items List */}
      <div>
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Order Line Items</h4>
        <div className="flex flex-col gap-2">
          {selectedOrder.items?.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-white/60 hover:bg-white border border-slate-200/70 rounded-xl flex items-center justify-between text-xs transition-colors shadow-2xs"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-900">{item.product_name}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  SKU: {item.sku} • Qty: {item.quantity} • {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.is_final_sale === 1 && (
                  <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Final Sale
                  </span>
                )}
                <span className="font-black text-slate-900">
                  ${item.unit_price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
