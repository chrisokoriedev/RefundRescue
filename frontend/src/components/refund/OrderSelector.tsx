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
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 text-xs shadow-sm">
        No orders found for this persona.
      </div>
    );
  }

  const isExpired = daysAgo > 30;
  const isHighValue = selectedOrder.total_amount > 500;
  const hasFinalSale = selectedOrder.items?.some(i => i.is_final_sale === 1);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#3861FB] border border-blue-100 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Order Context</h3>
            <p className="text-xs text-slate-400">Order metadata and line items analyzed by policy engine</p>
          </div>
        </div>

        {orders.length > 1 && (
          <select
            value={selectedOrderId}
            onChange={(e) => onSelectOrder(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3861FB] font-semibold cursor-pointer"
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
      <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900">{selectedOrder.id}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {selectedOrder.status}
            </span>
          </div>
          <div className="text-base font-extrabold text-[#3861FB]">
            ${selectedOrder.total_amount.toFixed(2)} {selectedOrder.currency}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Placed {new Date(selectedOrder.order_date).toLocaleDateString()} ({daysAgo} days ago)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{selectedOrder.shipping_address}</span>
          </div>
        </div>

        {/* Policy Flags Indicators */}
        <div className="flex flex-wrap gap-2 pt-1">
          {hasFinalSale && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              <Tag className="w-3 h-3 text-rose-600" />
              Final Sale Item (POL-001)
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Order &gt; 30 Days Old (POL-002)
            </span>
          )}
          {isHighValue && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Exceeds $500 Threshold (POL-003)
            </span>
          )}
          {!hasFinalSale && !isExpired && !isHighValue && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              In-Window Regular Order (POL-004)
            </span>
          )}
        </div>

        {/* Expected Persona Evaluation Note */}
        {selectedOrder.scenario_description && (
          <div className="mt-1 p-3 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-600">
            <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px] block mb-0.5">Test Scenario Note:</span>
            {selectedOrder.scenario_description}
            {selectedOrder.expected_outcome && (
              <span className="block mt-1 font-bold text-[#3861FB]">
                Target Policy Result: {selectedOrder.expected_outcome}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Line Items List */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Order Line Items</h4>
        <div className="flex flex-col gap-2">
          {selectedOrder.items?.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-900">{item.product_name}</span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                  SKU: {item.sku} • Qty: {item.quantity} • {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.is_final_sale === 1 && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Final Sale
                  </span>
                )}
                <span className="font-extrabold text-slate-900">
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
