'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function CustomerGrowthBubbles() {
  const [selectedPeriod, setSelectedPeriod] = useState('Today');

  const locations = [
    { country: 'United States', code: 'US', flag: '🇺🇸', percent: '42%' },
    { country: 'Germany', code: 'DE', flag: '🇩🇪', percent: '28%' },
    { country: 'Australia', code: 'AU', flag: '🇦🇺', percent: '18%' },
    { country: 'France', code: 'FR', flag: '🇫🇷', percent: '12%' },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Customer Growth</h3>
          <p className="text-xs text-slate-400 mt-0.5">Track customer by locations</p>
        </div>

        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl border border-slate-200/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3861FB]"
          >
            <option value="Today">Today</option>
            <option value="This week">This week</option>
            <option value="This month">This month</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Bubble Clusters + Locations */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        
        {/* Overlapping Blue Bubble Clusters (DealDeck Replica) */}
        <div className="relative w-44 h-40 flex items-center justify-center flex-shrink-0">
          
          {/* Main Top-Right Bubble: 2.417 */}
          <div className="absolute top-2 right-4 w-24 h-24 rounded-full bg-[#3861FB] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/30 z-20 hover:scale-105 transition-transform cursor-pointer">
            2.417
          </div>

          {/* Bottom-Left Bubble: 2.281 */}
          <div className="absolute bottom-1 left-2 w-24 h-24 rounded-full bg-[#4A72FF] text-white flex items-center justify-center font-bold text-sm shadow-sm z-10 hover:scale-105 transition-transform cursor-pointer">
            2.281
          </div>

          {/* Top-Left Small Bubble: 287 */}
          <div className="absolute top-4 left-3 w-14 h-14 rounded-full bg-[#8EA8FF] text-white flex items-center justify-center font-bold text-xs shadow-xs z-30 hover:scale-105 transition-transform cursor-pointer">
            287
          </div>

          {/* Bottom-Right Small Bubble: 812 */}
          <div className="absolute bottom-3 right-6 w-14 h-14 rounded-full bg-[#6287FF] text-white flex items-center justify-center font-bold text-xs shadow-xs z-25 hover:scale-105 transition-transform cursor-pointer">
            812
          </div>

        </div>

        {/* Countries List */}
        <div className="flex-1 flex flex-col gap-2.5 w-full">
          {locations.map((loc) => (
            <div key={loc.code} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-base leading-none">{loc.flag}</span>
                <span className="font-semibold text-slate-700">{loc.country}</span>
              </div>
              <span className="font-mono text-slate-400 font-medium">{loc.percent}</span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
