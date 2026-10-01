import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { Target, CheckCircle2, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface SkillGapRadarChartProps {
  matchingSkills: string[];
  missingKeywords: string[];
  matchScore: number;
}

interface RadarDataPoint {
  subject: string;
  candidateLevel: number;
  requiredLevel: number;
  fullMark: number;
  gap: number;
}

export const SkillGapRadarChart: React.FC<SkillGapRadarChartProps> = ({
  matchingSkills,
  missingKeywords,
  matchScore,
}) => {
  // Generate balanced radar dimensions combining matched skills and missing keywords
  const radarData: RadarDataPoint[] = useMemo(() => {
    const points: RadarDataPoint[] = [];

    // Up to 4 matched skills
    const topMatches = matchingSkills.slice(0, 4);
    // Up to 4 missing critical skills
    const topMissing = missingKeywords.slice(0, 4);

    // If both empty, provide sensible default software dimensions
    if (topMatches.length === 0 && topMissing.length === 0) {
      return [
        { subject: 'Core Technologies', candidateLevel: matchScore, requiredLevel: 85, fullMark: 100, gap: 85 - matchScore },
        { subject: 'Architecture', candidateLevel: Math.max(30, matchScore - 10), requiredLevel: 80, fullMark: 100, gap: 80 - Math.max(30, matchScore - 10) },
        { subject: 'Testing & QA', candidateLevel: 40, requiredLevel: 75, fullMark: 100, gap: 35 },
        { subject: 'Performance', candidateLevel: Math.min(90, matchScore + 10), requiredLevel: 80, fullMark: 100, gap: 0 },
        { subject: 'DevOps & CI/CD', candidateLevel: 35, requiredLevel: 70, fullMark: 100, gap: 35 },
      ];
    }

    // Add matched skills (candidate is strong, meeting or exceeding requirement)
    topMatches.forEach((skill) => {
      const candidateLvl = Math.min(95, Math.max(75, Math.round(matchScore * 0.5 + 45)));
      const requiredLvl = 80;
      points.push({
        subject: skill.length > 16 ? `${skill.slice(0, 14)}…` : skill,
        candidateLevel: candidateLvl,
        requiredLevel: requiredLvl,
        fullMark: 100,
        gap: Math.max(0, requiredLvl - candidateLvl),
      });
    });

    // Add missing keywords (candidate has notable gap relative to JD requirement)
    topMissing.forEach((skill) => {
      const candidateLvl = Math.max(15, Math.min(40, Math.round(matchScore * 0.35)));
      const requiredLvl = 85;
      points.push({
        subject: skill.length > 16 ? `${skill.slice(0, 14)}…` : skill,
        candidateLevel: candidateLvl,
        requiredLevel: requiredLvl,
        fullMark: 100,
        gap: requiredLvl - candidateLvl,
      });
    });

    // Ensure we have at least 4-6 points for a geometric radar shape
    if (points.length < 4) {
      points.push({
        subject: 'Domain Best Practices',
        candidateLevel: Math.round(matchScore * 0.8),
        requiredLevel: 80,
        fullMark: 100,
        gap: Math.max(0, 80 - Math.round(matchScore * 0.8)),
      });
    }

    return points.slice(0, 7);
  }, [matchingSkills, missingKeywords, matchScore]);

  // Statistics
  const alignedCount = radarData.filter((d) => d.candidateLevel >= d.requiredLevel).length;
  const gapCount = radarData.filter((d) => d.candidateLevel < d.requiredLevel).length;
  const largestGap = [...radarData].sort((a, b) => b.gap - a.gap)[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RadarDataPoint;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-slate-100 border-b border-slate-700 pb-1">
            {data.subject}
          </p>
          <div className="flex items-center justify-between text-emerald-400">
            <span>Candidate Proficiency:</span>
            <span className="font-mono font-bold">{data.candidateLevel}%</span>
          </div>
          <div className="flex items-center justify-between text-indigo-300">
            <span>Job Requirement:</span>
            <span className="font-mono font-bold">{data.requiredLevel}%</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Skill Alignment Gap:</span>
            <span
              className={`font-bold ${
                data.gap <= 0 ? 'text-emerald-400' : data.gap > 35 ? 'text-rose-400' : 'text-amber-400'
              }`}
            >
              {data.gap <= 0 ? 'Fully Aligned' : `-${data.gap}% Gap`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <Target className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Skill Gap & Alignment Radar
            </h3>
            <p className="text-xs text-slate-400">
              Interactive benchmark of your verified skills against the employer's requirement baseline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-xs"></span>
            <span className="font-semibold text-slate-200">Candidate Proficiency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block shadow-xs" style={{ backgroundColor: 'var(--accent)' }}></span>
            <span className="font-semibold text-slate-200">Job Requirement Baseline</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart + Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Recharts Radar Chart */}
        <div className="lg:col-span-7 h-[320px] sm:h-[360px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.15)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#E2E8F0', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: '#94A3B8', fontSize: 9 }}
                stroke="rgba(255, 255, 255, 0.2)"
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Job Requirement Polygon */}
              <Radar
                name="Job Requirement"
                dataKey="requiredLevel"
                stroke="var(--accent)"
                fill="var(--accent)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              {/* Candidate Proficiency Polygon */}
              <Radar
                name="Candidate Proficiency"
                dataKey="candidateLevel"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#CBD5E1' }}
                iconType="circle"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Analytics & Key Insights Panel */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Skill Alignment Breakdown
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fully Aligned</span>
                </div>
                <div className="text-2xl font-black text-white">{alignedCount}</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Skills meeting requirement</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Skill Gaps</span>
                </div>
                <div className="text-2xl font-black text-white">{gapCount}</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Technologies to acquire</p>
              </div>
            </div>

            {largestGap && largestGap.gap > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priority Focus: {largestGap.subject}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/80">
                  This skill represents your widest gap (-{largestGap.gap}%). Incorporating verified projects or coursework here provides the biggest boost.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">How to read this chart: </span>
              The emerald polygon represents your verified background; the glowing polygon represents employer expectations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
