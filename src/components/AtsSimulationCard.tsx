import React, { useState } from 'react';
import { AtsSimulationReport } from '../types';
import {
  Cpu,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

interface AtsSimulationCardProps {
  report: AtsSimulationReport | null | undefined;
  isLoading: boolean;
  onRunSimulation: () => void;
  tailoredResumeText: string;
}

export const AtsSimulationCard: React.FC<AtsSimulationCardProps> = ({
  report,
  isLoading,
  onRunSimulation,
  tailoredResumeText,
}) => {
  const [showRawParsed, setShowRawParsed] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs animate-pulse">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Cpu className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-3 w-80 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="space-y-4 py-4">
          <div className="h-16 bg-slate-100 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-slate-100 rounded-lg"></div>
            <div className="h-28 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-6 sm:p-8 shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-400/10 text-indigo-300 text-xs font-medium border border-indigo-400/20 mb-1">
                <span>ATS Engine Simulation Mode</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Simulate Real Enterprise ATS Parsing
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                Test how parsers (Workday, Taleo, Greenhouse, iCIMS) extract sections, calculate keyword density, evaluate date formatting, and detect formatting vulnerabilities.
              </p>
            </div>
          </div>

          <button
            onClick={onRunSimulation}
            disabled={!tailoredResumeText}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run ATS Simulation</span>
          </button>
        </div>
      </div>
    );
  }

  const parserScore = report.parser_score || 90;
  let scoreBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let scoreText = 'text-emerald-700';
  if (parserScore < 70) {
    scoreBadgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
    scoreText = 'text-rose-700';
  } else if (parserScore < 85) {
    scoreBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    scoreText = 'text-amber-700';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                ATS Parser Simulation Report
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreBadgeColor}`}>
                {report.risk_level.toUpperCase()} RISK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated parser audit across Workday, Taleo, Greenhouse, and iCIMS criteria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onRunSimulation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Re-run ATS simulation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-simulate</span>
          </button>
        </div>
      </div>

      {/* Score and Core Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Parser Readiness Gauge */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-4">
          <div className="text-center flex-shrink-0">
            <span className={`text-3xl font-extrabold ${scoreText}`}>
              {parserScore}
            </span>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">/ 100</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Parser Confidence</span>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {parserScore >= 85
                ? 'High parser legibility. Minimal risk of corrupted tables or dropped data.'
                : 'Potential parser confusion detected in structure or dates.'}
            </p>
          </div>
        </div>

        {/* Section Structure Status */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Section Parsing</span>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {report.parsed_sections_found.length} standard headers detected.
              {report.parsed_sections_missing.length > 0 && ` Missing: ${report.parsed_sections_missing.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Date Format Status */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            report.date_format_status === 'standardized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Date Standardization</span>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5 capitalize">
              Status: {report.date_format_status}
            </p>
          </div>
        </div>
      </div>

      {/* Date Formatting Analysis Card */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Date Formatting & Tenure Calculation Audit</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {report.date_format_details}
        </p>
      </div>

      {/* Keyword Density Warnings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Keyword Density & Stuffing Audit
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Target density: 1.0% – 3.0%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.keyword_density_warnings.map((kw, idx) => {
            let statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (kw.status === 'stuffed') {
              statusBadge = 'bg-rose-50 text-rose-800 border-rose-200';
            } else if (kw.status === 'sparse') {
              statusBadge = 'bg-amber-50 text-amber-800 border-amber-200';
            }

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate">{kw.keyword}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${statusBadge}`}>
                    {kw.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Frequency: {kw.count}x</span>
                  <span>Density: {kw.density}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${
                      kw.status === 'stuffed'
                        ? 'bg-rose-500'
                        : kw.status === 'sparse'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, kw.density * 25)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-600 italic leading-snug">
                  {kw.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formatting & Parsing Vulnerabilities */}
      {report.formatting_issues && report.formatting_issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Identified Parsing Vulnerabilities & Structural Risks
            </h4>
          </div>

          <div className="space-y-2">
            {report.formatting_issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3"
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  issue.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                }`} />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-slate-900">{issue.issue}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700">Adjustment: </span>
                    {issue.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specific Mitigation Adjustments */}
      <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>Recommended Adjustments to Mitigate All Parsing Risks</span>
        </div>
        <ul className="space-y-2 text-xs text-indigo-950">
          {report.specific_mitigation_steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
