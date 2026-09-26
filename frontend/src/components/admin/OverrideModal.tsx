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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Supervisor Manual Override</h3>
            <p className="text-xs text-zinc-400">Human-in-the-loop decision adjustment with audit logging</p>
          </div>
        </div>

        {/* Current Ticket Context */}
        <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-xs flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-zinc-400">Ticket: {ticket.id}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 text-[10px]">Current:</span>
              <DecisionBadge decision={ticket.decision} size="sm" />
            </div>
          </div>
          <div className="text-zinc-300">
            <span className="text-zinc-500">Customer:</span> {ticket.customer_name} • Order total: ${ticket.requested_amount.toFixed(2)}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-2">
              Select New Decision:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['APPROVED', 'DENIED', 'ESCALATED'] as const).map((dec) => (
                <button
                  type="button"
                  key={dec}
                  onClick={() => setSelectedDecision(dec)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    selectedDecision === dec
                      ? dec === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                        : dec === 'DENIED'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {dec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Mandatory Audit Reason / Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified customer shipping photos and serial number. Approving exception under manager discretion."
              rows={3}
              required
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording Override...' : 'Confirm Decision Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
