import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DecisionBadgeProps {
  decision: 'APPROVED' | 'DENIED' | 'ESCALATED';
  confidenceScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: 'sm' | 'md' | 'lg';
}

export function DecisionBadge({ decision, confidenceScore, riskLevel, size = 'md' }: DecisionBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold'
  }[size];

  if (decision === 'APPROVED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs ${sizeClasses}`}>
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-emerald-600' : 'w-4 h-4 text-emerald-600'} />
        <span>Approved</span>
        {confidenceScore !== undefined && (
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
        {confidenceScore !== undefined && (
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
      {confidenceScore !== undefined && (
        <span className="opacity-75 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
      )}
    </span>
  );
}
