import React, { useState } from 'react';
import {
  FileEdit,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { BulletRewrite } from '../types';

interface GlassBulletRewritesCardProps {
  bullets: BulletRewrite[];
}

export const GlassBulletRewritesCard: React.FC<GlassBulletRewritesCardProps> = ({
  bullets,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [highlightDiff, setHighlightDiff] = useState<boolean>(true);
  const [activeReasonIndex, setActiveReasonIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // Helper to highlight "[add metric]" and keywords in the improved text
  const renderImprovedText = (text: string) => {
    if (!highlightDiff) {
      return <span>{text}</span>;
    }

    // Split text by "[add metric]" or "[add metric]%" markers
    const parts = text.split(/(\[add\s+metric(?:\%|\b)?\]|\[add\s+tool\])/gi);

    return (
      <span>
        {parts.map((part, i) => {
          if (/^\[add/i.test(part)) {
            return (
              <span
                key={i}
                className="inline-block px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/40 text-amber-200 font-mono text-[11px] font-bold mx-0.5"
                title="Fill in your verified metric or tool"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  if (!bullets || bullets.length === 0) return null;

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6">
      {/* Header with Diff Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Action-Oriented Bullet Rewrites ({bullets.length})
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side comparison re-engineered with ATS action verbs and impact metrics
            </p>
          </div>
        </div>

        {/* Diff Highlight Toggle */}
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl border border-white/15 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setHighlightDiff(!highlightDiff)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              highlightDiff
                ? 'bg-white/20 text-white shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Highlight Metrics Diff: {highlightDiff ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Bullet Comparisons Grid */}
      <div className="space-y-4">
        {bullets.map((bullet, idx) => {
          const isCopied = copiedIndex === idx;
          const isReasonOpen = activeReasonIndex === idx;

          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/25 transition-all space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE (Original) */}
                <div className="p-3.5 rounded-xl bg-black/25 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                      Original Bullet
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{bullet.original}"
                  </p>
                </div>

                {/* AFTER (Improved) */}
                <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/25 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      Improved ATS Rewrite
                    </span>

                    <button
                      onClick={() => handleCopy(bullet.improved, idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-0.5 rounded-md border border-emerald-500/30 transition-colors cursor-pointer"
                      title="Copy improved bullet point"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-white leading-relaxed font-medium">
                    {renderImprovedText(bullet.improved)}
                  </p>
                </div>
              </div>

              {/* Recruiter Strategy Reason Tooltip / Toggle */}
              <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setActiveReasonIndex(isReasonOpen ? null : idx)
                  }
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer self-start"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="underline decoration-dotted">
                    {isReasonOpen ? 'Hide recruiter rationale' : 'Why this works for ATS & recruiters'}
                  </span>
                </button>

                {isReasonOpen && (
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-200 leading-relaxed sm:max-w-md animate-in fade-in duration-150">
                    <span className="font-bold text-white">Recruiter Strategy: </span>
                    {bullet.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
