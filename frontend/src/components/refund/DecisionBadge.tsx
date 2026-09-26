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
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  if (decision === 'APPROVED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Approved</span>
        {confidenceScore !== undefined && (
          <span className="opacity-70 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </span>
    );
  }

  if (decision === 'DENIED') {
    return (
      <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
        <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>Denied</span>
        {confidenceScore !== undefined && (
          <span className="opacity-70 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
      {riskLevel === 'HIGH' ? (
        <ShieldAlert className={size === 'sm' ? 'w-3 h-3 text-red-400' : 'w-4 h-4 text-red-400'} />
      ) : (
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      <span>{riskLevel === 'HIGH' ? 'Escalated (Security)' : 'Escalated'}</span>
      {confidenceScore !== undefined && (
        <span className="opacity-70 text-[10px] ml-0.5">({Math.round(confidenceScore * 100)}%)</span>
      )}
    </span>
  );
}
