'use client';

import React, { useState } from 'react';
import { RefundTicket, overrideTicket } from '../../lib/refundApi';
import { DecisionBadge } from '../refund/DecisionBadge';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: RefundTicket | null;
  onSuccess: () => void;
}

export function OverrideModal({ isOpen, onClose, ticket, onSuccess }: OverrideModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<'APPROVED' | 'DENIED' | 'ESCALATED'>('APPROVED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Supervisor reason/audit notes are mandatory for overriding a decision.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await overrideTicket(ticket.id, {
        decision: selectedDecision,
        notes: notes.trim()
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit override.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="apple-glass-elevated bg-white/95 border border-white/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#4F46E5] border border-indigo-100 flex items-center justify-center shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Manual Decision Override</h3>
            <p className="text-xs text-slate-500 font-medium">Human review decision, saved to the audit log</p>
          </div>
        </div>

        {/* Current Ticket Context */}
        <div className="p-4 bg-white/70 rounded-2xl border border-slate-200/70 text-xs flex flex-col gap-2 mb-4 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-600 font-bold">Ticket: {ticket.id}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px] font-medium">Current:</span>
              <DecisionBadge decision={ticket.decision} size="sm" />
            </div>
          </div>
          <div className="text-slate-700 font-medium">
            <span className="text-slate-400">Customer:</span> <strong className="text-slate-900">{ticket.customer_name}</strong> • Order total: <strong className="text-slate-900 font-black">${ticket.requested_amount.toFixed(2)}</strong>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select New Decision:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['APPROVED', 'DENIED', 'ESCALATED'] as const).map((dec) => (
                <button
                  type="button"
                  key={dec}
                  onClick={() => setSelectedDecision(dec)}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    selectedDecision === dec
                      ? dec === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : dec === 'DENIED'
                        ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-xs'
                        : 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                      : 'bg-white/60 text-slate-600 border-slate-200/80 hover:bg-white'
                  }`}
                >
                  {dec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Mandatory Audit Reason / Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified customer shipping photos and serial number. Approving exception under supervisor discretion."
              rows={3}
              required
              className="w-full bg-white/70 hover:bg-white border border-slate-200/80 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5] focus:bg-white placeholder-slate-400 resize-none font-medium transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className="px-5 py-2.5 text-xs font-bold bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? 'Recording Override...' : 'Confirm Decision Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
