'use client';

import React, { useState } from 'react';
import { DealDeckShell } from '../../components/layout/DealDeckShell';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function MerchantPortalPage() {
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(500);
  const [returnWindowDays, setReturnWindowDays] = useState(30);
  const [enforceFinalSale, setEnforceFinalSale] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);

  const highReturnItems = [
    {
      name: 'Stainless Steel Cookware Set (10-Piece)',
      sku: 'COOK-SS-10',
      category: 'Kitchenware',
      returnRate: '9.4%',
      primaryReason: 'Damaged in transit (glass lids)',
      financialImpact: '$1,299.90',
      status: 'Packaging Supplier Alert',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      name: 'Ultra-Clear 4K OLED TV 55"',
      sku: 'TV-OLED-55',
      category: 'Electronics',
      returnRate: '5.8%',
      primaryReason: 'High value shipping damage',
      financialImpact: '$3,400.00',
      status: 'Requires Supervisor Gate',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      name: 'Silk Blend Patterned Scarf (Clearance)',
      sku: 'SCARF-SLK-01',
      category: 'Apparel',
      returnRate: '3.1%',
      primaryReason: 'Buyer remorse on final sale',
      financialImpact: '$385.00',
      status: 'Strict Gate (POL-001)',
      statusColor: 'bg-blue-50 text-[#3861FB] border-blue-200'
    }
  ];

  const handleSaveSettings = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  return (
    <DealDeckShell
      activeView="merchant"
      title="Store Return Financials & Analytics"
      subtitle="Friday, December 15th 2023"
      userProfile={{
        name: 'Apex Retail Store',
        role: 'Merchant Client'
      }}
    >
      {/* Top 4 KPI Cards in DealDeck / Apple UI Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Vibrant Blue Card (Revenue Saved) */}
        <div className="bg-[#3861FB] text-white rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2ECC71]/25 text-[#7DF3B2] border border-[#2ECC71]/35">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+8.4%</span>
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-blue-100 font-medium tracking-wide">Net Revenue Protected</span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              $48,250.00
            </div>
            <span className="text-[11px] text-blue-200 mt-1 block">Saved by AI policy gates</span>
          </div>
        </div>

        {/* Card 2: Return Rate */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-1.4%</span>
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium tracking-wide">Store Return Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              3.2%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">vs 4.8% industry avg</span>
          </div>
        </div>

        {/* Card 3: Dispute Win Rate */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+3.1%</span>
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium tracking-wide">Dispute Win Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              99.2%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Chargebacks blocked</span>
          </div>
        </div>

        {/* Card 4: Automated Resolution */}
        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700">
              <Clock className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+5.2%</span>
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium tracking-wide">Instant Resolution Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              86.5%
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Zero-touch decisions</span>
          </div>
        </div>

      </div>

      {/* Main Merchant Content: High-Return Inventory + Policy Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: High-Return Product Inventory */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">High-Return Products & Anomaly Detection</h3>
              <p className="text-xs text-slate-400 mt-0.5">Identified packaging and defect patterns</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              3 Flagged
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {highReturnItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col gap-2 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                    <span className="text-xs text-slate-400 font-mono">SKU: {item.sku} • Category: {item.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Return Frequency</span>
                    <strong className="text-slate-900">{item.returnRate} of orders</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Primary Diagnosis</span>
                    <span className="text-slate-700 font-medium">{item.primaryReason}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Refund Exposure</span>
                    <strong className="text-rose-600 font-bold">{item.financialImpact}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Return Policy Automation Controls */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#3861FB] border border-blue-100 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Policy Automation Rules</h3>
              <p className="text-xs text-slate-400">Configure guardrails for your store</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* Auto Approval Threshold */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Max Auto-Approval Limit</span>
                <span className="font-bold text-[#3861FB] font-mono">${autoApprovalLimit}.00</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Claims exceeding this threshold will automatically escalate to human supervisor review (POL-003).
              </p>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={autoApprovalLimit}
                onChange={(e) => setAutoApprovalLimit(Number(e.target.value))}
                className="w-full accent-[#3861FB] cursor-pointer mt-1"
              />
            </div>

            {/* Return Window */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Eligible Return Window</span>
                <span className="font-bold text-[#3861FB] font-mono">{returnWindowDays} Days</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Orders delivered past this window are automatically denied by deterministic code (POL-002).
              </p>
              <input
                type="range"
                min="14"
                max="90"
                step="1"
                value={returnWindowDays}
                onChange={(e) => setReturnWindowDays(Number(e.target.value))}
                className="w-full accent-[#3861FB] cursor-pointer mt-1"
              />
            </div>

            {/* Final Sale Enforcement */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Strict Final-Sale Gate</span>
                <span className="text-[11px] text-slate-500">Block clearance and final-sale claims (POL-001)</span>
              </div>
              <button
                type="button"
                onClick={() => setEnforceFinalSale(!enforceFinalSale)}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                  enforceFinalSale ? 'bg-[#3861FB]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${
                    enforceFinalSale ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-lg bg-[#3861FB] hover:bg-[#2E52E0] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-1"
            >
              {savedSettings ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Store Guardrails Updated!</span>
                </>
              ) : (
                <span>Save Store Policy Settings</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </DealDeckShell>
  );
}
