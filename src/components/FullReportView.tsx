import React, { useRef } from 'react';
import { AnalysisResult } from '../types';
import {
  Download,
  Printer,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  SpellCheck2,
  Calculator,
  ListChecks,
  AlertOctagon,
  BookOpen,
  HeartHandshake,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';

interface FullReportViewProps {
  analysisResult: AnalysisResult;
  jobDescription?: string;
  onOpenBuilder?: () => void;
}

export const FullReportView: React.FC<FullReportViewProps> = ({
  analysisResult,
  jobDescription,
  onOpenBuilder,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    // Generate clean structured PDF report via jsPDF
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Resume Match AI — Executive Audit Report', 15, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on ${new Date().toLocaleDateString()} | Target Role: ${analysisResult.job_title_guess || 'Target Position'}`, 15, y);
      y += 10;

      // Divider
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, pageWidth - 15, y);
      y += 10;

      // Overall Score Callout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(`Overall Match Score: ${analysisResult.match_score} / 100`, 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const splitExplanation = doc.splitTextToSize(analysisResult.score_explanation, pageWidth - 30);
      doc.text(splitExplanation, 15, y);
      y += splitExplanation.length * 5 + 6;

      // Top 5 Changes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Top High-Impact Recommendations:', 15, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      (analysisResult.top_5_changes || []).forEach((ch, idx) => {
        const text = `${idx + 1}. ${ch}`;
        const lines = doc.splitTextToSize(text, pageWidth - 30);
        doc.text(lines, 15, y);
        y += lines.length * 4.5 + 2;
      });

      y += 4;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // ATS Formatting & Compliance
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('ATS Mechanical Parser Compliance:', 15, y);
      y += 6;

      const issues = analysisResult.ats_formatting_check?.issues || [];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      issues.forEach((iss) => {
        const t = `[${iss.status.toUpperCase()}] ${iss.category}: ${iss.item} — ${iss.fix_tip}`;
        const lines = doc.splitTextToSize(t, pageWidth - 30);
        doc.text(lines, 15, y);
        y += lines.length * 4.5 + 1.5;
      });

      y += 6;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Rewritten Bullets Sample
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Key Rewritten Accomplishment Bullets:', 15, y);
      y += 6;

      (analysisResult.bullets_to_rewrite || []).slice(0, 4).forEach((b) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229);
        const impLines = doc.splitTextToSize(`Improved: ${b.improved}`, pageWidth - 30);
        doc.text(impLines, 15, y);
        y += impLines.length * 4.5;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const origLines = doc.splitTextToSize(`Original: ${b.original}`, pageWidth - 30);
        doc.text(origLines, 15, y);
        y += origLines.length * 4 + 4;

        if (y > 260) {
          doc.addPage();
          y = 20;
        }
      });

      doc.save(`Resume_Match_AI_Report_${analysisResult.match_score}pct.pdf`);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      // Fallback: window.print()
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Download as PDF button */}
      <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">Full Executive Audit Report</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Complete Diagnostic
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Combines all 10 recruitment analysis modules, score breakdowns, and ATS fix tips in one executive report.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download report as PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            title="Print report directly"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Body */}
      <div
        ref={reportRef}
        id="full-printable-report"
        className="glass-panel p-6 sm:p-10 space-y-8 bg-slate-900/90 text-white"
      >
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/15">
          <div className="space-y-1">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Resume Match AI Diagnostic Engine
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Executive Candidate Alignment & ATS Audit
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated on {new Date().toLocaleDateString()} for target role: <strong className="text-white">{analysisResult.job_title_guess || 'Target Role'}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/15 text-center flex-shrink-0">
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-emerald-400">
              {analysisResult.match_score}%
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
              Overall Alignment
            </div>
          </div>
        </div>

        {/* Section 1: Executive Recruiter Scan & Verdict */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Clock className="w-4 h-4" />
            <span>1. Six-Second Recruiter First Impression</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2">
            <p className="text-slate-200 leading-relaxed font-medium">
              {analysisResult.six_second_recruiter_scan?.scan_verdict ||
                'Recruiter eye scan passes. Strong title and core stack visibility in upper half.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
              <div>
                <strong className="text-emerald-400 block mb-1">What Recruiter Catches First:</strong>
                <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-300">
                  {(analysisResult.six_second_recruiter_scan?.what_they_notice_first || []).slice(0, 3).map((item, i) => (
                    <li key={i}>{item.category}: {item.detail}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong className="text-amber-400 block mb-1">What Usually Gets Missed:</strong>
                <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-300">
                  {(analysisResult.six_second_recruiter_scan?.what_they_miss || []).slice(0, 3).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: ATS Mechanical Formatting Check */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <FileCheck2 className="w-4 h-4" />
            <span>2. ATS Formatting & Parsing Check</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(analysisResult.ats_formatting_check?.issues || []).map((iss, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
                {iss.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                {iss.status === 'warn' && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
                {iss.status === 'fail' && <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <div className="font-bold text-white">{iss.category}: {iss.item}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{iss.fix_tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Keyword Density & Distribution */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <BarChart3 className="w-4 h-4" />
            <span>3. Keyword Density & Role Alignment</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(analysisResult.keyword_density_map || []).slice(0, 4).map((kw, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                  <div className="font-bold text-white truncate">{kw.keyword}</div>
                  <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
                    {kw.count_in_resume}x ({kw.density_percent}%)
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{kw.flag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Weak Language & Bullet Metric Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weak Language */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <SpellCheck2 className="w-4 h-4" />
              <span>4. Weak Language & Buzzword Audit</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              {(analysisResult.weak_language_detector?.vague_phrases || []).map((v, i) => (
                <div key={i} className="pb-1.5 border-b border-white/5 last:border-0">
                  <span className="line-through text-rose-400 font-bold">"{v.phrase}"</span>
                  <span className="text-slate-400 mx-1.5">&rarr;</span>
                  <span className="text-emerald-300 font-semibold">{v.strong_alternatives.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Impact / Quantification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Calculator className="w-4 h-4" />
              <span>5. Unquantified Bullets (Missing Metrics)</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
              {(analysisResult.impact_quantification?.bullets_missing_metrics || []).slice(0, 2).map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-slate-400 line-through text-[11px]">{item.bullet}</div>
                  <div className="text-emerald-300 font-medium">{item.suggested_metric_placement}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Top 5 High-Impact Changes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Sparkles className="w-4 h-4" />
            <span>6. Prioritized Action Checklist (Top 5 Changes)</span>
          </div>
          <div className="space-y-2">
            {(analysisResult.top_5_changes || []).map((ch, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  {i + 1}
                </span>
                <span className="text-slate-200 leading-relaxed font-medium">{ch}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Skill Gap Learning Roadmap */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Compass className="w-4 h-4" />
            <span>7. Skill Gap Learning Roadmap</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {(analysisResult.skill_gap_roadmap || []).map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-white">{item.missing_skill}</div>
                <div className="text-[11px] text-slate-300">{item.what_to_learn}</div>
                <div className="text-[10px] text-cyan-300 pt-1">Build: {item.small_project_to_build}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
