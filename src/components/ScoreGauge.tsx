import React from 'react';
import { Award, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  explanation: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, explanation }) => {
  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Determine color scheme based on user specifications:
  // red < 50, amber 50-75, green > 75
  let colorCategory: 'red' | 'amber' | 'green';
  let strokeColor: string;
  let textColor: string;
  let bgBadge: string;
  let label: string;
  let StatusIcon: React.ElementType;

  if (normalizedScore > 75) {
    colorCategory = 'green';
    strokeColor = '#059669'; // emerald-600
    textColor = 'text-emerald-700';
    bgBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    label = 'Strong ATS Match';
    StatusIcon = CheckCircle;
  } else if (normalizedScore >= 50) {
    colorCategory = 'amber';
    strokeColor = '#D97706'; // amber-600
    textColor = 'text-amber-700';
    bgBadge = 'bg-amber-50 text-amber-800 border-amber-200';
    label = 'Moderate Alignment';
    StatusIcon = TrendingUp;
  } else {
    colorCategory = 'red';
    strokeColor = '#E11D48'; // rose-600
    textColor = 'text-rose-700';
    bgBadge = 'bg-rose-50 text-rose-800 border-rose-200';
    label = 'Requires Optimization';
    StatusIcon = AlertTriangle;
  }

  // SVG Circle calculations
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        {/* Circular Gauge */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            aria-label={`Match score: ${normalizedScore} out of 100`}
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Stroke */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${textColor}`}>
              {normalizedScore}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              / 100
            </span>
          </div>
        </div>

        {/* Recruiter Evaluation & Explanation */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ATS Match Analysis
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgBadge}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {label}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            {normalizedScore > 75
              ? 'High Probability of Recruiter Screening'
              : normalizedScore >= 50
              ? 'Competitive Foundation, Key Gaps Identified'
              : 'Significant ATS Keyword & Experience Gaps'}
          </h2>

          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            {explanation}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>&gt;75 Strong Match</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>50–75 Moderate Match</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>&lt;50 Needs Work</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
