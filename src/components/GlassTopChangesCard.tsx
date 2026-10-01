import React from 'react';
import { ListOrdered, AlertCircle, ArrowUpRight } from 'lucide-react';

interface GlassTopChangesCardProps {
  changes: string[];
}

export const GlassTopChangesCard: React.FC<GlassTopChangesCardProps> = ({ changes }) => {
  if (!changes || changes.length === 0) return null;

  const getPriorityStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          badge: 'High Impact #1',
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          numberBg: 'bg-rose-500 text-white',
        };
      case 1:
        return {
          badge: 'High Impact #2',
          bg: 'bg-orange-500/15 border-orange-500/30 text-orange-300',
          numberBg: 'bg-orange-500 text-white',
        };
      case 2:
        return {
          badge: 'Medium Priority #3',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          numberBg: 'bg-amber-500 text-slate-900 font-bold',
        };
      case 3:
        return {
          badge: 'Priority #4',
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
          numberBg: 'bg-cyan-500 text-slate-900 font-bold',
        };
      default:
        return {
          badge: 'Polish #5',
          bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
          numberBg: 'bg-indigo-500 text-white',
        };
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Top 5 High-Impact Changes
            </h3>
            <p className="text-xs text-slate-400">
              Prioritized by potential score increase in enterprise applicant tracking systems
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/80">
          Ranked Order
        </span>
      </div>

      {/* Numbered List */}
      <div className="space-y-3">
        {changes.slice(0, 5).map((change, index) => {
          const style = getPriorityStyle(index);

          return (
            <div
              key={index}
              className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3.5 transition-all ${style.bg}`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-xs flex-shrink-0 mt-0.5 ${style.numberBg}`}
              >
                {index + 1}
              </span>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-80">
                    {style.badge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  {change}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
