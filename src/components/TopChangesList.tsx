import React from 'react';
import { Target, ArrowUpRight } from 'lucide-react';

interface TopChangesListProps {
  changes: string[];
}

export const TopChangesList: React.FC<TopChangesListProps> = ({ changes }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <Target className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Top 5 High-Impact Changes
            </h3>
            <p className="text-xs text-slate-500">
              Prioritized adjustments that will yield the biggest ATS & recruiter boost
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
          Ranked Priority
        </span>
      </div>

      <div className="space-y-3">
        {changes.map((change, index) => {
          const numberLabel = String(index + 1).padStart(2, '0');
          return (
            <div
              key={index}
              className="flex items-start gap-3.5 p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <span className="flex-shrink-0 font-mono text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-1 rounded-md shadow-2xs">
                {numberLabel}
              </span>
              <p className="text-sm text-slate-800 leading-relaxed font-normal pt-0.5">
                {change}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
