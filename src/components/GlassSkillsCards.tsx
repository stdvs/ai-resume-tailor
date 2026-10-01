import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Copy, Check, Sparkles } from 'lucide-react';
import { MissingKeywordWithPriority } from '../types';

interface GlassSkillsCardsProps {
  matchingSkills: string[];
  missingKeywords: string[];
  missingKeywordsWithPriority?: MissingKeywordWithPriority[];
}

export const GlassSkillsCards: React.FC<GlassSkillsCardsProps> = ({
  matchingSkills,
  missingKeywords,
  missingKeywordsWithPriority,
}) => {
  const [copiedChip, setCopiedChip] = useState<string | null>(null);

  const handleCopyChip = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedChip(keyword);
    setTimeout(() => {
      setCopiedChip(null);
    }, 1800);
  };

  // Build normalized list of prioritized missing keywords
  const prioritizedMissing: MissingKeywordWithPriority[] =
    missingKeywordsWithPriority && missingKeywordsWithPriority.length > 0
      ? missingKeywordsWithPriority
      : missingKeywords.map((kw, i) => ({
          keyword: kw,
          priority: i < 3 ? 'High' : i < 6 ? 'Medium' : 'Low',
        }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. MATCHING SKILLS CARD (Green Glass Chips) */}
      <div className="glass-panel p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Matching Skills & Technologies
                </h4>
                <p className="text-xs text-slate-400">
                  Verified overlaps found in both your resume and the job description
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
              {matchingSkills.length} Verified
            </span>
          </div>

          {/* Green Glass Chips */}
          {matchingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {matchingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 transition-all shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-4">
              No direct technical keywords were matched with the target job description.
            </p>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-white/10">
          Tip: Emphasize these validated skills in your executive summary.
        </p>
      </div>

      {/* 2. MISSING KEYWORDS CARD (Red/Amber Glass Chips with Priority & Click-to-Copy) */}
      <div className="glass-panel p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-sm">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Missing Keywords & Requirements
                </h4>
                <p className="text-xs text-slate-400">
                  Ordered by recruiter priority. Click any chip to copy to clipboard
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300">
              {prioritizedMissing.length} Critical
            </span>
          </div>

          {/* Red/Amber Glass Chips with Click-to-Copy */}
          {prioritizedMissing.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {prioritizedMissing.map((item, idx) => {
                const isHigh = item.priority === 'High';
                const isCopied = copiedChip === item.keyword;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleCopyChip(item.keyword)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isHigh
                        ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-200'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-200'
                    }`}
                    title={`Click to copy "${item.keyword}". Priority: ${item.priority}`}
                  >
                    <span>{item.keyword}</span>

                    {/* Priority Badge */}
                    <span
                      className={`text-[9px] font-mono uppercase font-black px-1.5 py-0.2 rounded ${
                        isHigh
                          ? 'bg-rose-500/30 text-rose-200'
                          : 'bg-amber-500/30 text-amber-200'
                      }`}
                    >
                      {item.priority}
                    </span>

                    {/* Copy indicator */}
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in-75 duration-100" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-50 hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-emerald-300 py-4 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              All primary job description keywords are represented in your resume!
            </p>
          )}
        </div>

        <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <span>Click any chip to copy into your experience section</span>
          {copiedChip && (
            <span className="text-emerald-400 font-bold animate-pulse text-[11px]">
              Copied "{copiedChip}"!
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
