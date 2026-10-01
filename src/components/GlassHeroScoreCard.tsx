import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface GlassHeroScoreCardProps {
  score: number;
  explanation: string;
  deltaScore?: number | null;
}

export const GlassHeroScoreCard: React.FC<GlassHeroScoreCardProps> = ({
  score,
  explanation,
  deltaScore = null,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animated Count-Up
  useEffect(() => {
    let start = 0;
    const duration = 1200; // 1.2s
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  // Determine verdict
  const getVerdict = (s: number) => {
    if (s >= 75) {
      return {
        label: 'Strong Match',
        sub: 'High probability of passing recruiter & ATS screening',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        icon: CheckCircle2,
      };
    }
    if (s >= 50) {
      return {
        label: 'Good Match',
        sub: 'Solid foundation; apply high-impact bullet rewrites to elevate',
        color: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        icon: TrendingUp,
      };
    }
    return {
      label: 'Needs Work',
      sub: 'Critical keywords and metrics missing relative to job requirements',
      color: 'text-rose-400',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      icon: AlertTriangle,
    };
  };

  const verdict = getVerdict(score);
  const VerdictIcon = verdict.icon;

  // SVG circular gauge math
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="glass-panel p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <Award className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            ATS Match Score
          </h3>
        </div>

        {/* Delta score badge if re-analyzed */}
        {deltaScore !== null && deltaScore !== undefined && deltaScore !== 0 && (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border shadow-xs animate-bounce ${
              deltaScore > 0
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{deltaScore > 0 ? `▲ +${deltaScore}` : `▼ ${deltaScore}`}</span>
            <span className="text-[10px] font-medium opacity-80">Score Change</span>
          </div>
        )}
      </div>

      {/* Main Content: Gauge + Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center my-4">
        {/* Animated Circular Gauge */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white/10 fill-none"
                strokeWidth="12"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="fill-none transition-all duration-300 ease-out"
                strokeWidth="12"
                strokeLinecap="round"
                stroke="var(--accent)"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  filter: 'drop-shadow(0 0 8px var(--glow))',
                }}
              />
            </svg>

            {/* Inner Score Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-black text-white font-mono tracking-tighter drop-shadow-md">
                {animatedScore}
              </span>
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest mt-0.5">
                Out of 100
              </span>
            </div>
          </div>

          {/* Verdict Pill */}
          <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${verdict.bg}`}>
            <VerdictIcon className="w-3.5 h-3.5" />
            <span>{verdict.label}</span>
          </div>
        </div>

        {/* Recruiter Evaluation Explanation */}
        <div className="sm:col-span-7 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>Recruiter Assessment</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-normal">
            {explanation}
          </p>
          <div className="pt-2 border-t border-white/10 text-xs text-slate-400">
            {verdict.sub}
          </div>
        </div>
      </div>
    </div>
  );
};
