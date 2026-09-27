import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DecisionBadgeProps {
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  confidenceScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: 'sm' | 'md' | 'lg';
}

/** Tiny horizontal confidence bar shown inside the badge (md/lg only). */
function ConfidenceMeter({ score, tone }: { score: number; tone: 'emerald' | 'rose' | 'amber' }) {
  const pct = Math.round(score * 100);
  const barColor = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500'
  }[tone];

  return (
    <span className="inline-flex items-center gap-1.5 ml-1" title={`AI confidence: ${pct}%`}>
      <span className="relative inline-block w-12 h-1.5 rounded-full bg-slate-200/80 overflow-hidden align-middle">
        <span
          className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="opacity-75 text-[10px]">{pct}%</span>
    </span>
  );
}

export function DecisionBadge({ decision, confidenceScore, riskLevel, size = 'md' }: DecisionBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold'
  }[size];

  const meter = confidenceScore !== undefined
    ? <ConfidenceMeter
        score={confidenceScore}
        tone={decision === 'APPROVED' ? 'emerald' : decision === 'DENIED' ? 'rose' : 'amber'}
      />
    : null;

  if (decision === 'APPROVED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs ${sizeClasses}`}>
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
        <span>Approved</span>
        {size !== 'sm' && meter}
        {size === 'sm' && confidenceScore !== undefined && (
          <span className="opacity-75 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </span>
    );
  }

  if (decision === 'DENIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs ${sizeClasses}`}>
        <XCircle className={size === 'sm' ? 'w-3 h-3 text-rose-600' : 'w-4 h-4 text-rose-600'} />
        <span>Denied</span>
        {size !== 'sm' && meter}
        {size === 'sm' && confidenceScore !== undefined && (
          <span className="opacity-75 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full ${
      riskLevel === 'HIGH'
        ? 'bg-rose-50 text-rose-800 border border-rose-300 font-bold'
        : 'bg-amber-50 text-amber-700 border border-amber-200/80'
    } shadow-2xs ${sizeClasses}`}>
      {riskLevel === 'HIGH' ? (
        <ShieldAlert className={size === 'sm' ? 'w-3 h-3 text-rose-600' : 'w-4 h-4 text-rose-600'} />
      ) : (
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-amber-600' : 'w-4 h-4 text-amber-600'} />
      )}
      <span>{riskLevel === 'HIGH' ? 'Escalated (Security)' : 'Escalated'}</span>
      {size !== 'sm' && meter}
      {size === 'sm' && confidenceScore !== undefined && (
        <span className="opacity-75 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
      )}
    </span>
  );
}
