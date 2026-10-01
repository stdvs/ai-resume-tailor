import React, { useState } from 'react';
import { BulletRewrite } from '../types';
import { Copy, Check, Sparkles, ArrowRight, Info } from 'lucide-react';

interface BulletRewritesProps {
  bullets: BulletRewrite[];
}

export const BulletRewrites: React.FC<BulletRewritesProps> = ({ bullets }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyBullet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleCopyAll = () => {
    const allText = bullets.map((b) => `• ${b.improved}`).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => {
      setCopiedAll(false);
    }, 2000);
  };

  // Helper to highlight "[add metric]" in improved bullets
  const renderImprovedText = (text: string) => {
    const parts = text.split(/(\[add metric\])/gi);
    return parts.map((part, i) => {
      if (part.toLowerCase() === '[add metric]') {
        return (
          <span
            key={i}
            className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300"
            title="Replace with your authentic quantified result (e.g., 25%, 3x, 500k users)"
          >
            [add metric]
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Bullet Point Rewrites (Before & After)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {bullets.length} recommendations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rephrased with high-impact action verbs and job keywords. Flags <span className="font-semibold text-amber-700">[add metric]</span> where numbers strengthen your claim.
          </p>
        </div>

        <button
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors self-start sm:self-auto cursor-pointer"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied All Bullets!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Improved</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {bullets.map((item, index) => {
          const isCopied = copiedIndex === index;
          return (
            <div
              key={index}
              className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 transition-all hover:border-slate-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* BEFORE (Original) */}
                <div className="flex flex-col justify-between bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span>Before (Original Resume)</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      "{item.original}"
                    </p>
                  </div>
                </div>

                {/* AFTER (Improved) */}
                <div className="flex flex-col justify-between bg-indigo-50/40 rounded-lg p-3.5 border border-indigo-200/80 shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>After (ATS & Impact Optimized)</span>
                      </div>
                      <button
                        onClick={() => handleCopyBullet(item.improved, index)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                        title="Copy improved bullet to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-900 leading-relaxed font-medium">
                      {renderImprovedText(item.improved)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recruiter Rationale */}
              {item.reason && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-start gap-2 text-xs text-slate-600">
                  <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Recruiter rationale: </span>
                    <span>{item.reason}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
