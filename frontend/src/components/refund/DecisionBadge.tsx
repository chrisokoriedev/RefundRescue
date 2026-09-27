import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Rim } from 'react-glass-rim';

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
      <span className="opacity-75 text-[10px] font-mono font-bold">{pct}%</span>
    </span>
  );
}

export function DecisionBadge({ decision, confidenceScore, riskLevel, size = 'md' }: DecisionBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-4 py-1.5 gap-2 font-black'
  }[size];

  const meter = confidenceScore !== undefined
    ? <ConfidenceMeter
        score={confidenceScore}
        tone={decision === 'APPROVED' ? 'emerald' : decision === 'DENIED' ? 'rose' : 'amber'}
      />
    : null;

  if (decision === 'APPROVED') {
    return (
      <Rim
        as="span"
        intensity={0.4}
        accentColor="52, 211, 153"
        className={`inline-flex items-center rounded-full bg-emerald-50/80 backdrop-blur-md text-emerald-800 border border-emerald-300/80 shadow-[0_2px_10px_rgba(16,185,129,0.12)] ${sizeClasses}`}
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
        <span>Approved</span>
        {size !== 'sm' && meter}
        {size === 'sm' && confidenceScore !== undefined && (
          <span className="opacity-80 text-[10px] ml-0.5 font-mono">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </Rim>
    );
  }

  if (decision === 'DENIED') {
    return (
      <Rim
        as="span"
        intensity={0.4}
        accentColor="251, 113, 133"
        className={`inline-flex items-center rounded-full bg-rose-50/80 backdrop-blur-md text-rose-800 border border-rose-300/80 shadow-[0_2px_10px_rgba(244,63,94,0.12)] ${sizeClasses}`}
      >
        <XCircle className={size === 'sm' ? 'w-3.5 h-3.5 text-rose-600' : 'w-4 h-4 text-rose-600'} />
        <span>Denied</span>
        {size !== 'sm' && meter}
        {size === 'sm' && confidenceScore !== undefined && (
          <span className="opacity-80 text-[10px] ml-0.5 font-mono">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </Rim>
    );
  }

  return (
    <Rim
      as="span"
      intensity={0.4}
      accentColor={riskLevel === 'HIGH' ? '255, 85, 0' : '245, 158, 11'}
      className={`inline-flex items-center rounded-full ${
        riskLevel === 'HIGH'
          ? 'bg-rose-50/90 text-rose-900 border border-rose-300/90 font-extrabold shadow-[0_2px_12px_rgba(244,63,94,0.15)]'
          : 'bg-amber-50/80 text-amber-900 border border-amber-300/80 shadow-[0_2px_10px_rgba(245,158,11,0.12)]'
      } backdrop-blur-md ${sizeClasses}`}
    >
      {riskLevel === 'HIGH' ? (
        <ShieldAlert className={size === 'sm' ? 'w-3.5 h-3.5 text-rose-600' : 'w-4 h-4 text-rose-600'} />
      ) : (
        <AlertTriangle className={size === 'sm' ? 'w-3.5 h-3.5 text-amber-600' : 'w-4 h-4 text-amber-600'} />
      )}
      <span>{riskLevel === 'HIGH' ? 'Escalated (Security)' : 'Escalated'}</span>
      {size !== 'sm' && meter}
      {size === 'sm' && confidenceScore !== undefined && (
        <span className="opacity-80 text-[10px] ml-0.5 font-mono">({Math.round(confidenceScore * 100)}%)</span>
      )}
    </Rim>
  );
}
