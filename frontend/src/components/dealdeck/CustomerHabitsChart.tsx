'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DataPoint {
  month: string;
  seen: number;     // gray bar (0 - 60k)
  sales: number;    // blue bar (0 - 60k)
  seenFormatted: string;
  salesFormatted: string;
}

const defaultMonthlyData: DataPoint[] = [
  { month: 'Jan', seen: 34, sales: 28, seenFormatted: '34.120', salesFormatted: '28.450' },
  { month: 'Feb', seen: 48, sales: 42, seenFormatted: '48.910', salesFormatted: '42.100' },
  { month: 'Mar', seen: 38, sales: 30, seenFormatted: '38.400', salesFormatted: '30.120' },
  { month: 'Apr', seen: 56, sales: 45, seenFormatted: '43.787', salesFormatted: '39.784' },
  { month: 'May', seen: 40, sales: 32, seenFormatted: '40.230', salesFormatted: '32.180' },
  { month: 'Jun', seen: 50, sales: 44, seenFormatted: '50.150', salesFormatted: '44.890' },
  { month: 'Jul', seen: 44, sales: 38, seenFormatted: '44.200', salesFormatted: '38.640' }
];

export function CustomerHabitsChart() {
  const [selectedPeriod, setSelectedPeriod] = useState('This year');
  const [activeHoverIdx, setActiveHoverIdx] = useState<number>(3); // Apr selected by default as in screenshot

  return (
    <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between relative">
      
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Customer Habbits</h2>
          <p className="text-xs text-slate-400 mt-0.5">Track your customer habbits & claim patterns</p>
        </div>

        {/* Dropdown selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg border border-slate-200/80 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3861FB]"
            >
              <option value="This year">This year</option>
              <option value="Last 6 months">Last 6 months</option>
              <option value="This month">This month</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
          <span>Seen product</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3861FB]"></span>
          <span>Sales</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative h-64 w-full flex flex-col justify-end pt-8">
        
        {/* Horizontal gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-mono pr-2">
          <div className="border-b border-dashed border-slate-100 flex items-center justify-between pb-1">
            <span>60K</span>
          </div>
          <div className="border-b border-dashed border-slate-100 flex items-center justify-between pb-1">
            <span>40K</span>
          </div>
          <div className="border-b border-dashed border-slate-100 flex items-center justify-between pb-1">
            <span>20K</span>
          </div>
          <div className="border-b border-dashed border-slate-100 flex items-center justify-between pb-1">
            <span>10K</span>
          </div>
          <div className="border-b border-slate-100 flex items-center justify-between pb-1">
            <span>0K</span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="relative z-10 flex items-end justify-between h-48 px-6 sm:px-10">
          {defaultMonthlyData.map((d, idx) => {
            const isHovered = activeHoverIdx === idx;
            const seenHeight = `${(d.seen / 60) * 100}%`;
            const salesHeight = `${(d.sales / 60) * 100}%`;

            return (
              <div
                key={d.month}
                className="flex flex-col items-center group relative cursor-pointer"
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onClick={() => setActiveHoverIdx(idx)}
              >
                {/* Floating Tooltip Pill (DealDeck Style) */}
                {isHovered && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#12141C] text-white text-[11px] font-semibold py-2 px-3 rounded-xl shadow-xl flex flex-col gap-1 z-30 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                      <span>{d.seenFormatted} Products</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3861FB]"></span>
                      <span>{d.salesFormatted} Products</span>
                    </div>
                    {/* Tooltip triangle caret */}
                    <div className="w-2 h-2 bg-[#12141C] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                  </div>
                )}

                {/* Dot indicator on hovered bar top */}
                {isHovered && (
                  <div
                    className="absolute w-2 h-2 rounded-full bg-[#12141C] ring-4 ring-white z-20"
                    style={{ bottom: seenHeight }}
                  />
                )}

                {/* The Two Bars (Seen = Light Gray, Sales = Vibrant Blue) */}
                <div className="flex items-end gap-1.5 h-44">
                  {/* Gray bar: Seen */}
                  <div
                    className="w-3.5 sm:w-4.5 bg-[#E2E8F0] rounded-t-md transition-all duration-300 hover:bg-[#CBD5E1]"
                    style={{ height: seenHeight }}
                  />
                  {/* Blue bar: Sales */}
                  <div
                    className="w-3.5 sm:w-4.5 bg-[#3861FB] rounded-t-md transition-all duration-300 hover:brightness-110 shadow-2xs shadow-blue-500/20"
                    style={{ height: salesHeight }}
                  />
                </div>

                {/* Month label */}
                <span className={`text-xs mt-3 font-medium transition-colors ${
                  isHovered ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}>
                  {d.month}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
