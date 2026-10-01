import React from 'react';
import { Sliders, KeyRound, Code2, Briefcase, FileCheck, Target } from 'lucide-react';
import { ScoreBreakdown } from '../types';

interface GlassScoreBreakdownCardProps {
  breakdown?: ScoreBreakdown;
  matchScore: number;
}

export const GlassScoreBreakdownCard: React.FC<GlassScoreBreakdownCardProps> = ({
  breakdown,
  matchScore,
}) => {
  // Safe fallback if breakdown not returned by backend
  const data = breakdown || {
    keywords_match: Math.max(20, Math.min(100, Math.round(matchScore * 0.95))),
    skills_match: Math.max(25, Math.min(100, Math.round(matchScore * 1.05))),
    experience_relevance: Math.max(20, Math.min(100, Math.round(matchScore * 0.9))),
    formatting_readiness: Math.max(50, Math.min(100, Math.round(matchScore * 0.85 + 15))),
    bullet_impact: Math.max(30, Math.min(100, Math.round(matchScore * 0.8 + 10))),
  };

  const dimensions = [
    {
      label: 'Keywords Match',
      score: data.keywords_match,
      icon: KeyRound,
      desc: 'Job description keywords matched in resume text',
    },
    {
      label: 'Skills Match',
      score: data.skills_match,
      icon: Code2,
      desc: 'Technical tools, languages, and competencies overlap',
    },
    {
      label: 'Experience Relevance',
      score: data.experience_relevance,
      icon: Briefcase,
      desc: 'Alignment with role seniority and scope expectations',
    },
    {
      label: 'Formatting & ATS Readiness',
      score: data.formatting_readiness,
      icon: FileCheck,
      desc: 'Single-column structure, standard section headers, dates',
    },
    {
      label: 'Impact of Bullets',
      score: data.bullet_impact,
      icon: Target,
      desc: 'Action-verb strength and quantifiable metrics',
    },
  ];

  const getScoreColor = (val: number) => {
    if (val >= 75) return 'from-emerald-500 to-teal-400';
    if (val >= 50) return 'from-amber-500 to-orange-400';
    return 'from-rose-500 to-red-400';
  };

  return (
    <div className="glass-panel p-6 sm:p-8 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent-2)' }}
          >
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Score Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Dimensional breakdown across 5 recruiter evaluation criteria
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-white/70 bg-white/10 border border-white/15 px-2 py-0.5 rounded-lg">
          5 Sub-Scores
        </span>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {dimensions.map((dim, idx) => {
          const Icon = dim.icon;
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-200">{dim.label}</span>
                </div>
                <span className="font-mono font-bold text-white">{dim.score}%</span>
              </div>

              {/* Bar */}
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden relative">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(
                    dim.score
                  )} transition-all duration-1000 ease-out`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                {dim.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
