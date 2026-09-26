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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-md p-5 border-b border-zinc-800 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{ticketId}</span>
              {ticket && (
                <DecisionBadge
                  decision={ticket.decision}
                  confidenceScore={ticket.confidence_score}
                  riskLevel={ticket.risk_level}
                  size="sm"
                />
              )}
            </div>
            <span className="text-[11px] text-zinc-400">Audit & Deliberation Inspection Trail</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col gap-5">
          {isLoading && (
            <div className="p-12 text-center text-zinc-400 text-xs">Loading ticket audit trace...</div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {ticket && (
            <>
              {/* Injection Alert Banner */}
              {ticket.prompt_injection_detected && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">High Security Threat Flagged</span>
                    Prompt injection or system override pattern was intercepted by the Guardrail service before policy execution.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-2xl">
                <div>
                  <span className="text-xs font-semibold text-white block">Supervisor Action</span>
                  <span className="text-[11px] text-zinc-400">Override automated decision with reason</span>
                </div>
                <button
                  onClick={() => onOpenOverride(ticket)}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Manual Override</span>
                </button>
              </div>

              {/* Customer & Order Context */}
              <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Customer Profile
                  </span>
                  <span className="text-zinc-500 font-mono">{ticket.customer_id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px]">
                  <div>Name: <span className="text-zinc-200 font-medium">{ticket.customer_name}</span></div>
                  <div>Loyalty Tier: <span className="text-zinc-200 font-medium">{ticket.loyalty_tier}</span></div>
                  <div>Order ID: <span className="text-zinc-200 font-mono">{ticket.order_id}</span></div>
                  <div>Claim Amount: <span className="text-cyan-400 font-bold">${ticket.requested_amount.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Customer Raw Message */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
                  Customer Claim Reason:
                </span>
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 italic">
                  &quot;{ticket.reason}&quot;
                </div>
              </div>

              {/* AI Deliberation Reasoning */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  AI Deliberation Reasoning:
                </span>
                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 flex flex-col gap-3">
                  <p className="leading-relaxed">{ticket.reasoning_summary}</p>

                  {/* Matched Policies */}
                  {ticket.policy_clauses && ticket.policy_clauses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/70">
                      <span className="text-[10px] uppercase font-bold text-zinc-500">Policies Enforced:</span>
                      {ticket.policy_clauses.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700 text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Emitted Customer Response */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
                  Customer-Facing Response:
                </span>
                <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 leading-relaxed">
                  {ticket.customer_response}
                </div>
              </div>

              {/* Order Line Items */}
              {ticket.items && ticket.items.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-zinc-500" />
                    Items In Order:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="text-zinc-200 font-medium">{item.product_name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">SKU: {item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.is_final_sale === 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              FINAL SALE
                            </span>
                          )}
                          <span className="font-semibold text-zinc-100">${item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronological Audit Log History */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-zinc-500" />
                  Chronological Audit Trail:
                </span>
                <div className="flex flex-col gap-2">
                  {ticket.auditLogs && ticket.auditLogs.length > 0 ? (
                    ticket.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-semibold ${log.actor === 'HUMAN_SUPERVISOR' ? 'text-cyan-400' : 'text-blue-400'}`}>
                            {log.actor === 'HUMAN_SUPERVISOR' ? '👤 Supervisor Override' : '🤖 AI Automated Deliberation'}
                          </span>
                          <span className="text-zinc-500 text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-300 text-[11px]">{log.notes}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-500 italic">No audit entries found.</div>
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
