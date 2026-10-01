import React, { useState, useMemo } from 'react';
import { Highlighter, Eye, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface GlassKeywordHighlighterProps {
  jobDescription: string;
  matchingSkills: string[];
  missingKeywords: string[];
}

export const GlassKeywordHighlighter: React.FC<GlassKeywordHighlighterProps> = ({
  jobDescription,
  matchingSkills,
  missingKeywords,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'matched' | 'missing'>('all');

  // Tokenize and highlight job description text
  const highlightedContent = useMemo(() => {
    if (!jobDescription) return null;

    // Build regex of terms to highlight
    const matchedSet = new Set(matchingSkills.map((s) => s.toLowerCase()));
    const missingSet = new Set(missingKeywords.map((s) => s.toLowerCase()));

    // Combine all terms, sorted by length descending to match longest phrases first
    const allTerms = [...matchingSkills, ...missingKeywords]
      .filter((t) => t && t.trim().length > 1)
      .sort((a, b) => b.length - a.length);

    if (allTerms.length === 0) return jobDescription;

    // Escape special regex characters
    const escapedTerms = allTerms.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    const regex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');

    const parts = jobDescription.split(regex);

    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      const isMatched = matchedSet.has(lower);
      const isMissing = missingSet.has(lower);

      if (isMatched && (filterMode === 'all' || filterMode === 'matched')) {
        return (
          <mark
            key={index}
            className="bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.5 rounded font-semibold text-xs inline-block shadow-2xs mx-0.5"
            title="Matched in your resume"
          >
            {part}
          </mark>
        );
      }

      if (isMissing && (filterMode === 'all' || filterMode === 'missing')) {
        return (
          <mark
            key={index}
            className="bg-rose-500/25 text-rose-200 border border-rose-500/40 px-1.5 py-0.5 rounded font-semibold text-xs inline-block shadow-2xs mx-0.5"
            title="Missing requirement in your resume"
          >
            {part}
          </mark>
        );
      }

      return <span key={index}>{part}</span>;
    });
  }, [jobDescription, matchingSkills, missingKeywords, filterMode]);

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <Highlighter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Job Description Keyword Scanner
            </h3>
            <p className="text-xs text-slate-400">
              Visual map showing requirements present in your resume (green) vs absent (red)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/15 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'all' ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            All Keywords
          </button>
          <button
            onClick={() => setFilterMode('matched')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'matched' ? 'bg-emerald-500/30 text-emerald-200 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Matched ({matchingSkills.length})</span>
          </button>
          <button
            onClick={() => setFilterMode('missing')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              filterMode === 'missing' ? 'bg-rose-500/30 text-rose-200 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Missing ({missingKeywords.length})</span>
          </button>
        </div>
      </div>

      {/* Highlighted Text Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 max-h-[360px] overflow-y-auto leading-relaxed text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-sans selection:bg-indigo-500">
        {highlightedContent}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Matched Keyword</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            <span>Missing Keyword</span>
          </span>
        </div>
        <span>Exact keyword density alignment</span>
      </div>
    </div>
  );
};
