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
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-400 text-xs">
        No orders found for this persona.
      </div>
    );
  }

  const isExpired = daysAgo > 30;
  const isHighValue = selectedOrder.total_amount > 500;
  const hasFinalSale = selectedOrder.items?.some(i => i.is_final_sale === 1);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Order Details</h3>
            <p className="text-xs text-zinc-400">Order context and line items analyzed by policy engine</p>
          </div>
        </div>

        {orders.length > 1 && (
          <select
            value={selectedOrderId}
            onChange={(e) => onSelectOrder(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
          >
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                {o.id} (${o.total_amount.toFixed(2)})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected Order Summary Card */}
      <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white">{selectedOrder.id}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
              {selectedOrder.status}
            </span>
          </div>
          <div className="text-sm font-bold text-cyan-400">
            ${selectedOrder.total_amount.toFixed(2)} {selectedOrder.currency}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Placed {new Date(selectedOrder.order_date).toLocaleDateString()} ({daysAgo} days ago)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            <span className="truncate">{selectedOrder.shipping_address}</span>
          </div>
        </div>

        {/* Policy Flags Indicators */}
        <div className="flex flex-wrap gap-2 pt-1">
          {hasFinalSale && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
              <Tag className="w-3 h-3" />
              Final Sale Item (POL-001)
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
              <AlertCircle className="w-3 h-3" />
              Order &gt; 30 Days Old (POL-002)
            </span>
          )}
          {isHighValue && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
              <AlertCircle className="w-3 h-3" />
              Exceeds $500 Threshold (POL-003)
            </span>
          )}
          {!hasFinalSale && !isExpired && !isHighValue && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              <CheckCircle className="w-3 h-3" />
              Eligible for Standard Review (POL-004)
            </span>
          )}
        </div>

        {/* Expected Persona Evaluation Note */}
        {selectedOrder.scenario_description && (
          <div className="mt-1 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-[11px] text-zinc-300">
            <span className="text-zinc-500 uppercase tracking-wider font-semibold text-[10px] block mb-0.5">Test Fixture Scenario:</span>
            {selectedOrder.scenario_description}
            {selectedOrder.expected_outcome && (
              <span className="block mt-1 font-medium text-cyan-400">
                Expected: {selectedOrder.expected_outcome}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Line Items List */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Order Line Items</h4>
        <div className="flex flex-col gap-2">
          {selectedOrder.items?.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-xl flex items-center justify-between text-xs hover:border-zinc-700/60 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-zinc-200">{item.product_name}</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  SKU: {item.sku} • Qty: {item.quantity} • {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.is_final_sale === 1 && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Final Sale
                  </span>
                )}
                <span className="font-semibold text-zinc-100">
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
