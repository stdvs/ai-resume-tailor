import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, CheckCircle2, RotateCcw } from 'lucide-react';

interface PreApplyChecklistProps {
  items: string[];
}

export const PreApplyChecklist: React.FC<PreApplyChecklistProps> = ({ items }) => {
  // Track checked indices
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  // Reset checklist when new items arrive
  useEffect(() => {
    setCheckedState({});
  }, [items]);

  const toggleItem = (index: number) => {
    setCheckedState((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = items.filter((_, idx) => Boolean(checkedState[idx])).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const isAllCompleted = items.length > 0 && completedCount === items.length;

  const handleReset = () => {
    setCheckedState({});
  };

  const handleCheckAll = () => {
    const nextState: Record<number, boolean> = {};
    items.forEach((_, idx) => {
      nextState[idx] = true;
    });
    setCheckedState(nextState);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Pre-Application Checklist
            </h3>
            <p className="text-xs text-slate-500">
              Verify these final quality gates before submitting to employer ATS portals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {completedCount > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reset checklist"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={handleCheckAll}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            Mark all done
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5 bg-slate-50 rounded-lg p-3 border border-slate-100">
        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
          <span className="text-slate-600">
            {completedCount} of {items.length} tasks ready
          </span>
          <span className={isAllCompleted ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
            {progressPercent}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAllCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5">
        {items.map((item, index) => {
          const isChecked = Boolean(checkedState[index]);
          return (
            <div
              key={index}
              onClick={() => toggleItem(index)}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                isChecked
                  ? 'bg-emerald-50/40 border-emerald-200 text-slate-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <span
                className={`text-sm leading-relaxed ${
                  isChecked ? 'line-through text-slate-500' : 'font-medium text-slate-900'
                }`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {isAllCompleted && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>All checks passed! Your tailored resume is ready to submit.</span>
        </div>
      )}
    </div>
  );
};
