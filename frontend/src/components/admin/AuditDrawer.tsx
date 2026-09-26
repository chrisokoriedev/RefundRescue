'use client';

import React, { useEffect, useState } from 'react';
import { RefundTicket, fetchAdminTicketById } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { X, ShieldAlert, User, Package, History, ArrowRightLeft, Sparkles } from 'lucide-react';

interface AuditDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onOpenOverride: (ticket: RefundTicket) => void;
}

export function AuditDrawer({ ticketId, onClose, onOpenOverride }: AuditDrawerProps) {
  const [ticket, setTicket] = useState<RefundTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!ticketId) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      fetchAdminTicketById(ticketId)
        .then((data) => {
          if (!ignore) {
            setTicket(data);
            setIsLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            const msg = err instanceof Error ? err.message : 'Failed to load ticket audit details';
            setError(msg);
            setIsLoading(false);
          }
        });
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ticketId]);

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md p-5 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">{ticketId}</span>
              {ticket && (
                <DecisionBadge
                  decision={ticket.decision}
                  confidenceScore={ticket.confidence_score}
                  riskLevel={ticket.risk_level}
                  size="sm"
                />
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Audit & Deliberation Inspection Trail</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col gap-5">
          {isLoading && (
            <div className="p-12 text-center text-slate-400 text-xs">Loading ticket audit trace...</div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {ticket && (
            <>
              {/* Injection Alert Banner */}
              {ticket.prompt_injection_detected && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-900">Security Threat Intercepted</span>
                    Prompt injection or adversarial instruction override was intercepted by the Guardrail service before policy execution.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Supervisor Action</span>
                  <span className="text-[11px] text-slate-500">Override automated decision with reason note</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenOverride(ticket)}
                  className="px-4 py-2 bg-[#3861FB] hover:bg-[#2E52E0] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Manual Override</span>
                </button>
              </div>

              {/* Customer & Order Context */}
              <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#3861FB]" />
                    Customer Profile
                  </span>
                  <span className="text-slate-500 font-mono">{ticket.customer_id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>Name: <span className="text-slate-900 font-semibold">{ticket.customer_name}</span></div>
                  <div>Loyalty Tier: <span className="text-slate-900 font-semibold">{ticket.loyalty_tier}</span></div>
                  <div>Order ID: <span className="text-slate-900 font-mono">{ticket.order_id}</span></div>
                  <div>Claim Amount: <span className="text-[#3861FB] font-bold">${ticket.requested_amount.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Customer Raw Message */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Customer Claim Reason:
                </span>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-800 italic">
                  &quot;{ticket.reason}&quot;
                </div>
              </div>

              {/* AI Deliberation Reasoning */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3861FB]" />
                  AI Deliberation Reasoning:
                </span>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 flex flex-col gap-3">
                  <p className="leading-relaxed font-medium">{ticket.reasoning_summary}</p>

                  {/* Matched Policies */}
                  {ticket.policy_clauses && ticket.policy_clauses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Policies Enforced:</span>
                      {ticket.policy_clauses.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#3861FB] border border-blue-100 text-[10px] font-mono font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Emitted Customer Response */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  Customer-Facing Response:
                </span>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium">
                  {ticket.customer_response}
                </div>
              </div>

              {/* Order Line Items */}
              {ticket.items && ticket.items.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    Items In Order:
                  </span>
                  <div className="flex flex-col gap-2">
                    {ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold">{item.product_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.is_final_sale === 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              FINAL SALE
                            </span>
                          )}
                          <span className="font-extrabold text-slate-900">${item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronological Audit Log History */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Chronological Audit Trail:
                </span>
                <div className="flex flex-col gap-2">
                  {ticket.auditLogs && ticket.auditLogs.length > 0 ? (
                    ticket.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${log.actor === 'HUMAN_SUPERVISOR' ? 'text-[#3861FB]' : 'text-slate-700'}`}>
                            {log.actor === 'HUMAN_SUPERVISOR' ? '👤 Supervisor Override' : '🤖 AI Automated Deliberation'}
                          </span>
                          <span className="text-slate-400 text-[10px] font-medium">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 text-xs mt-0.5">{log.notes}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No audit entries found.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
