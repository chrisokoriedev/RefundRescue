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
function ConfidenceMeter({ score, tone }: { score: number; tone: 'emerald' | 'rose' | 'amber' | 'orange' }) {
  const pct = Math.round(score * 100);
  const barColor = {
    emerald: 'bg-[#059669]',
    rose: 'bg-[#DC2626]',
    amber: 'bg-[#D97706]',
    orange: 'bg-[#FF5500]'
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

  const tone = decision === 'APPROVED' 
    ? 'emerald' 
    : decision === 'DENIED' 
      ? 'rose' 
      : riskLevel === 'HIGH' 
        ? 'orange' 
        : 'amber';

  const meter = confidenceScore !== undefined
    ? <ConfidenceMeter score={confidenceScore} tone={tone} />
    : null;

  if (decision === 'APPROVED') {
    return (
      <Rim
        as="span"
        intensity={0.4}
        accentColor="5, 150, 105"
        className={`inline-flex items-center rounded-full bg-[#ECFDF5]/90 backdrop-blur-md text-[#059669] border border-[#A7F3D0] shadow-[0_2px_10px_rgba(5,150,105,0.12)] ${sizeClasses}`}
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5 text-[#059669]' : 'w-4 h-4 text-[#059669]'} />
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
        accentColor="220, 38, 38"
        className={`inline-flex items-center rounded-full bg-[#FEF2F2]/90 backdrop-blur-md text-[#DC2626] border border-[#FECACA] shadow-[0_2px_10px_rgba(220,38,38,0.12)] ${sizeClasses}`}
      >
        <XCircle className={size === 'sm' ? 'w-3.5 h-3.5 text-[#DC2626]' : 'w-4 h-4 text-[#DC2626]'} />
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
      accentColor={riskLevel === 'HIGH' ? '255, 85, 0' : '217, 119, 6'}
      className={`inline-flex items-center rounded-full ${
        riskLevel === 'HIGH'
          ? 'bg-[#FFF5ED]/95 text-[#FF5500] border border-[#FFD8C2] font-extrabold shadow-[0_2px_12px_rgba(255,85,0,0.15)]'
          : 'bg-[#FFFBEB]/90 text-[#D97706] border border-[#FDE68A] shadow-[0_2px_10px_rgba(217,119,6,0.12)]'
      } backdrop-blur-md ${sizeClasses}`}
    >
      {riskLevel === 'HIGH' ? (
        <ShieldAlert className={size === 'sm' ? 'w-3.5 h-3.5 text-[#FF5500]' : 'w-4 h-4 text-[#FF5500]'} />
      ) : (
        <AlertTriangle className={size === 'sm' ? 'w-3.5 h-3.5 text-[#D97706]' : 'w-4 h-4 text-[#D97706]'} />
      )}
      <span>{riskLevel === 'HIGH' ? 'Escalated (Security)' : 'Escalated'}</span>
      {size !== 'sm' && meter}
      {size === 'sm' && confidenceScore !== undefined && (
        <span className="opacity-80 text-[10px] ml-0.5 font-mono">({Math.round(confidenceScore * 100)}%)</span>
      )}
    </Rim>
  );
}
