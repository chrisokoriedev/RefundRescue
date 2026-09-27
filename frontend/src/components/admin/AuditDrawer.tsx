'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefundTicket, fetchAdminTicketById, fetchChatHistory, sendAgentChatMessage, ChatMessageRecord } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { X, ShieldAlert, User, Package, History, ArrowRightLeft, Sparkles, Headset, Send, CheckCircle2 } from 'lucide-react';

interface AuditDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onOpenOverride: (ticket: RefundTicket) => void;
}

export function AuditDrawer({ ticketId, onClose, onOpenOverride }: AuditDrawerProps) {
  const [ticket, setTicket] = useState<RefundTicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Human Chat Takeover states
  const [isChatTakeoverOpen, setIsChatTakeoverOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessageRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [agentMessageText, setAgentMessageText] = useState('');
  const [isSendingAgent, setIsSendingAgent] = useState(false);
  const [takeoverNotice, setTakeoverNotice] = useState<string | null>(null);

  const loadHistory = useCallback(async (orderId: string, customerId: string) => {
    try {
      setIsLoadingHistory(true);
      const history = await fetchChatHistory(orderId, customerId);
      setChatHistory(history);
    } catch {
      // Ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

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
            if (data.order_id && data.customer_id) {
              loadHistory(data.order_id, data.customer_id);
            }
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
  }, [ticketId, loadHistory]);

  const handleSendAgentReply = async (textToSend?: string) => {
    const text = (textToSend || agentMessageText).trim();
    if (!text || !ticket || isSendingAgent) return;

    setIsSendingAgent(true);
    try {
      await sendAgentChatMessage({
        orderId: ticket.order_id,
        customerId: ticket.customer_id,
        message: text,
        ticketId: ticket.id,
      });

      setAgentMessageText('');
      setTakeoverNotice('Specialist reply sent to customer live chat.');
      setTimeout(() => setTakeoverNotice(null), 4000);

      // Refresh chat stream and ticket audit trail
      await loadHistory(ticket.order_id, ticket.customer_id);
      const updatedTicket = await fetchAdminTicketById(ticket.id);
      setTicket(updatedTicket);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send agent reply';
      setError(msg);
    } finally {
      setIsSendingAgent(false);
    }
  };

  if (!ticketId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl apple-glass-elevated bg-white/95 border-l border-white/80 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl p-5 border-b border-slate-200/60 flex items-center justify-between z-10 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black text-slate-900">{ticketId}</span>
              {ticket && (
                <DecisionBadge
                  decision={ticket.decision}
                  confidenceScore={ticket.confidence_score}
                  riskLevel={ticket.risk_level}
                  size="sm"
                />
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">AI reasoning & decision audit trail</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          {isLoading && (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading ticket audit trace...</div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {ticket && (
            <>
              {/* Injection Alert Banner */}
              {ticket.prompt_injection_detected && (
                <div className="p-4 rounded-2xl bg-[#FFF5ED] border border-[#FFD8C2] text-xs text-[#FF5500] flex items-start gap-2.5 shadow-xs">
                  <ShieldAlert className="w-4 h-4 text-[#FF5500] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">Suspicious Message Blocked</span>
                    This message looked like an attempt to trick the system and was stopped by the security check before any policy rules ran.
                  </div>
                </div>
              )}

              {/* Private AI Admin Alert */}
              {(ticket.reasoning_summary?.includes('[Private Admin Alert]') || (ticket.confidence_score < 0.75 && ticket.decision === 'ESCALATED')) && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2.5 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    ⚠️
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 text-xs">Private AI Admin Alert</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-bold">
                        Confidence: {Math.round(ticket.confidence_score * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      {ticket.reasoning_summary?.includes('[Private Admin Alert]:')
                        ? ticket.reasoning_summary.split('[Private Admin Alert]:')[1]?.trim()
                        : "“I'm not confident about this one — can you take a look at it?”"}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 bg-white/70 border border-slate-200/70 rounded-2xl shadow-xs backdrop-blur-md flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Manual Decision & Live Actions</span>
                    <span className="text-[11px] text-slate-500">Take over customer chat or change the automated refund decision</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChatTakeoverOpen((prev) => !prev)}
                    className={`flex-1 min-w-[150px] px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border ${
                      isChatTakeoverOpen
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
                    }`}
                  >
                    <Headset className="w-4 h-4" />
                    <span>{isChatTakeoverOpen ? 'Hide Live Chat Console' : 'Take Over Chat'}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenOverride(ticket)}
                    className="flex-1 min-w-[140px] px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manual Override</span>
                  </button>
                </div>
              </div>

              {/* Live Human Chat Takeover Console */}
              {isChatTakeoverOpen && (
                <div className="p-4 bg-gradient-to-b from-[#F5F3FF]/80 to-white/95 border-2 border-[#DDD6FE] rounded-2xl flex flex-col gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-[#DDD6FE]/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shadow-2xs">
                        <Headset className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">Live Human Chat Takeover</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Specialist Connected
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Chatting with {ticket.customer_name} on Order #{ticket.order_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {takeoverNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{takeoverNotice}</span>
                    </div>
                  )}

                  {/* Real-time message thread */}
                  <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                    {isLoadingHistory ? (
                      <div className="py-6 text-center text-slate-400 text-xs font-medium">Loading session conversation...</div>
                    ) : chatHistory.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs italic">No messages recorded for this order yet.</div>
                    ) : (
                      chatHistory.map((m) => {
                        const isCust = m.sender === 'customer';
                        const isAgent = m.sender === 'agent';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col text-xs max-w-[90%] ${
                              isAgent
                                ? 'self-end items-end'
                                : isCust
                                ? 'self-start items-start'
                                : 'self-start items-start'
                            }`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                              {isAgent ? '🛡️ You (Human Specialist)' : isCust ? `👤 ${ticket.customer_name}` : '🤖 RevRescue AI'}
                            </span>
                            <div
                              className={`p-2.5 rounded-xl leading-relaxed text-xs ${
                                isAgent
                                  ? 'bg-[#7C3AED] text-white rounded-tr-xs shadow-xs font-medium'
                                  : isCust
                                  ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs font-medium'
                                  : 'bg-purple-50/80 border border-purple-200/80 text-purple-950 rounded-tl-xs shadow-2xs'
                              }`}
                            >
                              {m.text}
                            </div>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Canned Quick Response Chips */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Quick Specialist Responses:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        `Hello ${ticket.customer_name}! I am a support specialist taking over from AI to assist you personally.`,
                        "I've reviewed your request and would be glad to help resolve this for you.",
                        "Could you please share a photo of the damaged items so we can process this?",
                        "I have authorized your refund request right away. You'll see credit back in 3-5 business days."
                      ].map((canned, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAgentMessageText(canned)}
                          className="text-[10px] text-left font-medium bg-white hover:bg-[#F5F3FF] text-slate-700 hover:text-[#7C3AED] border border-slate-200 hover:border-[#DDD6FE] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          &quot;{canned.length > 45 ? canned.slice(0, 45) + '...' : canned}&quot;
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input box */}
                  <div className="flex flex-col gap-2 pt-1">
                    <textarea
                      rows={2}
                      value={agentMessageText}
                      onChange={(e) => setAgentMessageText(e.target.value)}
                      placeholder={`Type direct message to ${ticket.customer_name} as Human Specialist...`}
                      disabled={isSendingAgent}
                      className="w-full text-xs p-3 rounded-xl border-2 border-slate-300 focus:border-[#7C3AED] focus:outline-none bg-white text-slate-900 resize-none font-medium placeholder-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendAgentReply();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Press <kbd className="px-1 py-0.5 bg-slate-100 rounded border text-[9px]">Enter</kbd> to send directly
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSendAgentReply()}
                        disabled={!agentMessageText.trim() || isSendingAgent}
                        className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSendingAgent ? 'Sending...' : 'Send as Specialist'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Order Context */}
              <div className="p-4 bg-white/70 border border-slate-200/70 rounded-2xl flex flex-col gap-2.5 text-xs shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#7C3AED]" />
                    Customer Profile
                  </span>
                  <span className="text-slate-500 font-mono font-medium">{ticket.customer_id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>Name: <span className="text-slate-900 font-semibold">{ticket.customer_name}</span></div>
                  <div>Loyalty Tier: <span className="text-slate-900 font-semibold">{ticket.loyalty_tier}</span></div>
                  <div>Order ID: <span className="text-slate-900 font-mono font-medium">{ticket.order_id}</span></div>
                  <div>Claim Amount: <span className="text-[#7C3AED] font-black">${ticket.requested_amount.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Customer Raw Message */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Customer Claim Reason:
                </span>
                <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl text-xs text-slate-800 italic">
                  &quot;{ticket.reason}&quot;
                </div>
              </div>

              {/* AI reasoning */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  AI Reasoning:
                </span>
                <div className="p-4 bg-white/80 border border-slate-200/70 rounded-2xl text-xs text-slate-700 flex flex-col gap-3 shadow-xs">
                  <p className="leading-relaxed font-medium">{ticket.reasoning_summary}</p>

                  {/* Matched Policies */}
                  {ticket.policy_clauses && ticket.policy_clauses.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-200/60">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Policies:</span>
                      {ticket.policy_clauses.map((p) => (
                        <span key={p} className="px-2.5 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] text-[10px] font-mono font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Emitted Customer Response */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Customer-Facing Response:
                </span>
                <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium">
                  {ticket.customer_response}
                </div>
              </div>

              {/* Order Line Items */}
              {ticket.items && ticket.items.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    Items In Order:
                  </span>
                  <div className="flex flex-col gap-2">
                    {ticket.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white/70 border border-slate-200/70 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold">{item.product_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.is_final_sale === 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
                              FINAL SALE
                            </span>
                          )}
                          <span className="font-black text-slate-900">${item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronological Audit Log History */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Audit Trail:
                </span>
                <div className="flex flex-col gap-2">
                  {ticket.auditLogs && ticket.auditLogs.length > 0 ? (
                    ticket.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 bg-white/70 border border-slate-200/70 rounded-xl text-xs flex flex-col gap-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${log.actor === 'HUMAN_SUPERVISOR' ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                            {log.actor === 'HUMAN_SUPERVISOR' ? '👤 Manual Override' : '🤖 AI Review'}
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
