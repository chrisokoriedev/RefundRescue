'use client';

import React, { useState } from 'react';
import { ChevronDown, Tv, Gamepad2, Armchair } from 'lucide-react';

export function ProductStatisticRings() {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Product Statistic</h3>
          <p className="text-xs text-slate-400 mt-0.5">Track your product return reasons</p>
        </div>

        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg border border-slate-200/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3861FB]"
          >
            <option value="Today">Today</option>
            <option value="This week">This week</option>
            <option value="This month">This month</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Concentric Rings Visual + Central Metric */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        
        {/* SVG Concentric Arcs */}
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background tracks */}
            <circle cx="80" cy="80" r="68" stroke="#F1F4F9" strokeWidth="8" fill="none" />
            <circle cx="80" cy="80" r="53" stroke="#F1F4F9" strokeWidth="8" fill="none" />
            <circle cx="80" cy="80" r="38" stroke="#F1F4F9" strokeWidth="8" fill="none" />

            {/* Inner Ring: Light Slate Blue / Games (270 deg) */}
            <circle
              cx="80"
              cy="80"
              r="38"
              stroke="#CBD5E1"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * (1 - 0.72)}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-1000"
            />

            {/* Middle Ring: Coral Red / Furniture (230 deg) */}
            <circle
              cx="80"
              cy="80"
              r="53"
              stroke="#FF4757"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 53}
              strokeDashoffset={2 * Math.PI * 53 * (1 - 0.58)}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-1000"
            />

            {/* Outer Ring: Vibrant Blue / Electronics (310 deg) */}
            <circle
              cx="80"
              cy="80"
              r="68"
              stroke="#3861FB"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 68}
              strokeDashoffset={2 * Math.PI * 68 * (1 - 0.82)}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Central Metric Indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">9.829</span>
            <span className="text-[10px] text-slate-400 font-medium">Products Sales</span>
            <span className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              +5.34%
            </span>
          </div>
        </div>

        {/* Category Breakdown List */}
        <div className="flex-1 flex flex-col gap-3 w-full">
          
          {/* Electronic */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#3861FB] flex items-center justify-center">
                <Tv className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-700">Electronic</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-slate-900">2.487</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                +1.8%
              </span>
            </div>
          </div>

          {/* Games */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-700">Games</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-slate-900">1.828</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                +2.3%
              </span>
            </div>
          </div>

          {/* Furniture */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-500 flex items-center justify-center">
                <Armchair className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-700">Furniture</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-slate-900">1.463</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100">
                -1.04%
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
