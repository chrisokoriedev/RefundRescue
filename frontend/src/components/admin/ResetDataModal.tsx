'use client';

import React, { useState } from 'react';
import { resetDatabaseData } from '../../lib/refundApi';
import { AlertTriangle, RotateCcw, X, CheckCircle2 } from 'lucide-react';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetDataModal({ isOpen, onClose, onSuccess }: ResetDataModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await resetDatabaseData();
      setSuccessMsg(res.message || 'Database reset successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg(null);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset database';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-modal apple-glass-elevated bg-white/95 rounded-3xl shadow-2xl border border-white/80 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center shadow-2xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Reset Demo Database</h3>
              <p className="text-xs text-slate-500 font-medium">Restore clean demo tickets and customer states</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#FFFBEB]/90 border border-[#FDE68A] text-amber-950 flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold block mb-0.5 text-[#D97706]">Are you sure?</span>
              This will remove all recently evaluated test refund claims and chat records, and restore the initial 15 baseline test scenarios with clean demo stats.
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs shadow-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/60 backdrop-blur-xl border-t border-slate-200/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
            <span>{isSubmitting ? 'Resetting Data…' : 'Yes, Reset Test Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
