import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Analyzing resume alignment with Gemini...">
      {/* Score Gauge Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="w-40 h-40 rounded-full bg-slate-200 flex-shrink-0"></div>
          <div className="flex-1 w-full space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-7 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
            <div className="flex gap-4 pt-2">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-4 w-28 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Keywords Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-5 w-20 bg-slate-200 rounded"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-7 w-24 bg-emerald-100/60 rounded-lg"></div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-5 w-20 bg-slate-200 rounded"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-28 bg-rose-100/60 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Bullets Rewrites Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="h-5 w-56 bg-slate-200 rounded"></div>
        <div className="space-y-4 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-20 bg-white rounded-lg border border-slate-200"></div>
                <div className="h-20 bg-indigo-50/50 rounded-lg border border-indigo-200"></div>
              </div>
              <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Changes Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
        <div className="h-5 w-44 bg-slate-200 rounded mb-4"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
};
