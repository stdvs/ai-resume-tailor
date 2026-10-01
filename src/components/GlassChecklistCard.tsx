import React, { useState } from 'react';
import { CheckSquare, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface GlassChecklistCardProps {
  items: string[];
}

export const GlassChecklistCard: React.FC<GlassChecklistCardProps> = ({ items }) => {
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  if (!items || items.length === 0) return null;

  const total = items.length;
  const checkedCount = Object.values(checkedState).filter(Boolean).length;
  const percentage = Math.round((checkedCount / total) * 100);

  const toggleCheck = (index: number) => {
    setCheckedState((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // SVG circular progress ring calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6">
      {/* Header with Circular Progress Ring */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent-2)' }}
          >
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Pre-Application Quality Checklist
            </h3>
            <p className="text-xs text-slate-400">
              Complete these verified checks before submitting to maximize screening pass rates
            </p>
          </div>
        </div>

        {/* Progress Ring Widget */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="stroke-white/10 fill-none"
                strokeWidth="5"
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="fill-none transition-all duration-500 ease-out"
                strokeWidth="5"
                strokeLinecap="round"
                stroke={percentage === 100 ? '#10B981' : 'var(--accent)'}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            <span className="absolute text-[11px] font-mono font-black text-white">
              {percentage}%
            </span>
          </div>

          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold text-white block">
              {checkedCount}/{total} Ticked
            </span>
            <span className="text-[10px] text-slate-400">
              {percentage === 100 ? 'Ready to Submit!' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, index) => {
          const isChecked = Boolean(checkedState[index]);

          return (
            <label
              key={index}
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                isChecked
                  ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-white'
                  : 'bg-white/[0.04] border-white/10 hover:border-white/20 text-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCheck(index)}
                className="sr-only"
              />

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all mt-0.5 flex-shrink-0 ${
                  isChecked
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                    : 'border-white/30 bg-white/10'
                }`}
              >
                {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>

              <div className="flex-1 text-xs leading-relaxed font-medium">
                <span className={isChecked ? 'line-through text-slate-400' : 'text-slate-100'}>
                  {item}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {percentage === 100 && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-bold">Checklist Complete!</span>
          <span>Your tailored application meets top enterprise submission criteria.</span>
        </div>
      )}
    </div>
  );
};
