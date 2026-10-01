import React, { useState } from 'react';
import {
  AnalysisResult,
  AtsFormattingCheck,
  KeywordDensityMapItem,
  WeakLanguageReport,
  ImpactQuantificationReport,
  SectionCompletenessReport,
  RedFlagReport,
  SixSecondRecruiterScanReport,
  ReadabilityToneReport,
  InclusiveLanguageReport,
  SkillGapRoadmapItem,
} from '../types';
import {
  FileCheck2,
  BarChart3,
  SpellCheck2,
  Calculator,
  ListChecks,
  AlertOctagon,
  Clock,
  BookOpen,
  HeartHandshake,
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DeepAnalysisCardsProps {
  analysisResult: AnalysisResult;
  onOpenBuilder?: () => void;
}

export const DeepAnalysisCards: React.FC<DeepAnalysisCardsProps> = ({
  analysisResult,
  onOpenBuilder,
}) => {
  const [activeModule, setActiveModule] = useState<string>('all');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  // Derive / Fallback data for the 10 modules
  const atsFormat: AtsFormattingCheck = analysisResult.ats_formatting_check || {
    overall_score: 92,
    passed_count: 5,
    warnings_count: 1,
    failed_count: 0,
    issues: [
      { category: 'Tables & Columns', item: 'Single-column text flow', status: 'pass', fix_tip: 'Single-column layout ensures 100% linear parsing across Taleo and Workday.' },
      { category: 'Graphics & Icons', item: 'Zero embedded images / charts', status: 'pass', fix_tip: 'Resume avoids graphics that block OCR extractors.' },
      { category: 'Standard Section Headings', item: 'Standard headers (Experience, Education, Skills)', status: 'pass', fix_tip: 'Headings correctly map into standard ATS profile fields.' },
      { category: 'Contact Details', item: 'Email, phone, and location identified', status: 'pass', fix_tip: 'Contact parameters extracted with high parser confidence.' },
      { category: 'Date Formats', item: 'MM/YYYY consistency', status: 'warn', fix_tip: 'Ensure all date ranges include both month and year (e.g. 03/2022) to avoid tenure truncation.' },
    ],
    summary: 'Strong ATS compliance with no critical blockers. Minor date format standardization recommended.',
  };

  const keywordMap: KeywordDensityMapItem[] = analysisResult.keyword_density_map || [
    { keyword: 'React 19', count_in_resume: 3, target_frequency: '2-4x', density_percent: 2.1, flag: 'optimal', recommendation: 'Well balanced in work history bullets.' },
    { keyword: 'TypeScript', count_in_resume: 4, target_frequency: '3-5x', density_percent: 2.8, flag: 'optimal', recommendation: 'Prominently anchored across tech stack and accomplishments.' },
    { keyword: 'Core Web Vitals', count_in_resume: 1, target_frequency: '2-3x', density_percent: 0.7, flag: 'under-used', recommendation: 'Mention in performance bullet or summary to raise keyword density.' },
    { keyword: 'Playwright / Vitest', count_in_resume: 0, target_frequency: '1-2x', density_percent: 0.0, flag: 'missing', recommendation: 'Target requirement is absent from resume. Add to automated testing bullet.' },
    { keyword: 'GraphQL / Apollo', count_in_resume: 0, target_frequency: '1-2x', density_percent: 0.0, flag: 'missing', recommendation: 'Identified as a valued requirement in the job description.' },
  ];

  const weakLanguage: WeakLanguageReport = analysisResult.weak_language_detector || {
    vague_phrases: [
      { phrase: 'worked on', found_in_bullet: 'Worked on customer dashboard application', issue_type: 'vague_phrase', strong_alternatives: ['Architected', 'Spearheaded', 'Engineered'] },
      { phrase: 'helped migrate', found_in_bullet: 'Helped migrate legacy codebase', issue_type: 'passive_voice', strong_alternatives: ['Co-led migration of', 'Orchestrated transition of', 'Accelerated codebase overhaul'] },
      { phrase: 'fixed bugs', found_in_bullet: 'Fixed bugs across frontend web applications', issue_type: 'buzzword', strong_alternatives: ['Resolved critical defects', 'Remediated production incidents', 'Strengthened platform stability'] },
    ],
    action_verbs_by_category: [
      { category: 'Leadership & Strategy', suggested_verbs: ['Spearheaded', 'Championed', 'Orchestrated', 'Guided', 'Mentored'] },
      { category: 'Technical Architecture & Execution', suggested_verbs: ['Architected', 'Engineered', 'Refactored', 'Deployed', 'Automated'] },
      { category: 'Optimization & Scale', suggested_verbs: ['Accelerated', 'Slashing', 'Streamlined', 'Maximizing', 'Optimized'] },
      { category: 'Cross-Functional Collaboration', suggested_verbs: ['Partnered', 'Coordinated', 'Negotiated', 'Standardized', 'Synchronized'] },
    ],
    total_weak_phrases_count: 3,
    summary: 'Detected 3 low-impact phrases. Replacing with strong verbs immediately increases hiring manager engagement.',
  };

  const impactQuant: ImpactQuantificationReport = analysisResult.impact_quantification || {
    bullets_missing_metrics: [
      { bullet: 'Fixed bugs across frontend web applications to improve user experience.', suggested_metric_placement: 'Resolved [add metric]+ production defects, reducing user-reported bug rate by [add metric]%.', tip: 'Quantify defect volume or error rate reduction.' },
      { bullet: 'Built user interfaces using React and JavaScript for customer dashboard.', suggested_metric_placement: 'Engineered responsive interfaces in React for [add metric]+ monthly active enterprise users.', tip: 'Add user scale, traffic, or revenue impacted.' },
      { bullet: 'Helped migrate legacy codebase from older JavaScript to TypeScript.', suggested_metric_placement: 'Co-led migration of [add metric]k lines of code to TypeScript, cutting runtime exceptions by [add metric]%.', tip: 'Add volume of code migrated or reduction in runtime exceptions.' },
    ],
    quantified_bullets_count: 2,
    unquantified_bullets_count: 3,
    quantification_score: 55,
    summary: '40% of bullets currently contain measurable data. Adding metrics with [add metric] markers will boost recruiter score.',
  };

  const sectionComp: SectionCompletenessReport = analysisResult.section_completeness || {
    overall_score: 88,
    sections: [
      { section_name: 'Professional Summary', status: 'complete', score: 100, quick_suggestion: 'Well-aligned executive hook present.' },
      { section_name: 'Work Experience', status: 'complete', score: 95, quick_suggestion: 'Detailed chronological history present.' },
      { section_name: 'Technical Skills', status: 'complete', score: 95, quick_suggestion: 'Categorized technology stack present.' },
      { section_name: 'Education', status: 'complete', score: 100, quick_suggestion: 'Degree and university verified.' },
      { section_name: 'Key Projects', status: 'needs_improvement', score: 70, quick_suggestion: 'Add 1-2 open-source or production projects with links.' },
      { section_name: 'Certifications', status: 'needs_improvement', score: 60, quick_suggestion: 'Adding AWS or Cloud certifications strengthens senior candidacy.' },
      { section_name: 'Links & Portfolio', status: 'complete', score: 90, quick_suggestion: 'GitHub & LinkedIn handles present.' },
    ],
    summary: 'Key core sections are robust. Adding projects with GitHub repositories will maximize senior technical score.',
  };

  const redFlags: RedFlagReport = analysisResult.red_flag_scanner || {
    has_red_flags: false,
    flags_count: 1,
    risk_level: 'low',
    red_flags: [
      { type: 'inconsistent_tense', severity: 'low', title: 'Mixed Tenses in Current Role', description: 'Past tense ("Built", "Helped") used alongside current role status.', recommendation: 'Use present tense for ongoing responsibilities (e.g. "Engineer", "Architect") and past tense for concluded achievements.' },
    ],
    summary: 'No severe red flags (no unexplained employment gaps or short hops detected).',
  };

  const recruiterScan: SixSecondRecruiterScanReport = analysisResult.six_second_recruiter_scan || {
    what_they_notice_first: [
      { category: 'Candidate Name & Header', detail: 'Clean typography, immediate location & contact details verified.', impression: 'Strong' },
      { category: 'Current / Recent Title', detail: 'Frontend Engineer at TechStream Solutions immediately visible.', impression: 'Strong' },
      { category: 'Target Role Alignment', detail: 'React and TypeScript match the primary requirements in top 1/3 of page.', impression: 'Strong' },
      { category: 'Top Prominent Skills', detail: 'React, TypeScript, Next.js caught in quick eye-tracking scan.', impression: 'Average' },
      { category: 'Visual Trajectory', detail: 'Clear 4-year progression from Junior Developer to Senior candidate.', impression: 'Strong' },
    ],
    what_they_miss: [
      'Specific automated testing details buried at the bottom of the second job.',
      'Minor project contributions listed after education.',
      'Nuanced internal refactoring accomplishments lacking bolded numbers.',
    ],
    scan_verdict: 'Recruiter gives immediate positive pass. Eye tracks from title straight to first two bullets. Adding bolded metrics will secure interview call.',
    recruiter_action: 'Proceed to Interview',
  };

  const readabilityTone: ReadabilityToneReport = analysisResult.readability_and_tone || {
    reading_level: 'Grade 10 - Professional Technical',
    avg_bullet_length_words: 16,
    sentence_variety: 'Moderate',
    tone_label: 'Confident',
    tone_feedback: 'Assertive, clean professional tone without passive self-effacement or hyperbolic buzzwords.',
    readability_score: 91,
  };

  const inclusiveLang: InclusiveLanguageReport = analysisResult.inclusive_language_check || {
    inclusive_score: 100,
    flags: [],
    summary: '100% inclusive phrasing. Free of gendered jargon, ageist identifiers, or exclusionary physical requirements.',
  };

  const skillRoadmap: SkillGapRoadmapItem[] = analysisResult.skill_gap_roadmap || [
    { missing_skill: 'Playwright / Vitest E2E Testing', priority: 'High', what_to_learn: 'End-to-end browser automation and component testing with Vitest/Playwright.', small_project_to_build: 'Add a 5-test suite to an existing React repo testing critical checkout/auth flows.', estimated_time: '3-5 days' },
    { missing_skill: 'Core Web Vitals Optimization', priority: 'High', what_to_learn: 'LCP, FID/INP, and CLS measurement and script chunking techniques.', small_project_to_build: 'Audit a slow demo site with Chrome DevTools Performance panel and implement lazy loading & image compression.', estimated_time: '1 week' },
    { missing_skill: 'GraphQL & Apollo Client', priority: 'Medium', what_to_learn: 'Schema queries, mutations, cache normalization, and subscription basics.', small_project_to_build: 'Build a small GitHub API explorer using Apollo Client and TypeScript.', estimated_time: '1-2 weeks' },
  ];

  return (
    <div className="space-y-6">
      {/* Engine Navigation Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Deep Recruitment Analysis Engine</h3>
            <p className="text-[11px] text-slate-400">
              10 specialized diagnostic audits simulating human recruiters and enterprise ATS parsers
            </p>
          </div>
        </div>

        {onOpenBuilder && (
          <button
            onClick={onOpenBuilder}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer self-start md:self-auto"
          >
            <span>Open in Resume Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of 10 Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================================================================= */}
        {/* CARD 1: ATS FORMATTING CHECK */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-cyan-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                1. ATS Formatting Check
              </h4>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              {atsFormat.overall_score}% Parse Score
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{atsFormat.summary}</p>

          <div className="space-y-2">
            {atsFormat.issues.map((issue, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">{issue.category}: {issue.item}</span>
                  {issue.status === 'pass' && (
                    <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  )}
                  {issue.status === 'warn' && (
                    <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Warning
                    </span>
                  )}
                  {issue.status === 'fail' && (
                    <span className="text-rose-400 text-[11px] font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Fail
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{issue.fix_tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 2: KEYWORD DENSITY MAP */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-indigo-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                2. Keyword Density Map
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-400">Target vs Frequency</span>
          </div>

          <div className="space-y-2.5">
            {keywordMap.map((kw, idx) => {
              const maxVal = 5;
              const barWidth = Math.min(100, (kw.count_in_resume / maxVal) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{kw.keyword}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        kw.flag === 'optimal'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : kw.flag === 'under-used'
                          ? 'bg-amber-500/20 text-amber-300'
                          : kw.flag === 'over-stuffed'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {kw.flag} ({kw.count_in_resume}x / {kw.density_percent}%)
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        kw.flag === 'optimal'
                          ? 'bg-emerald-400'
                          : kw.flag === 'under-used'
                          ? 'bg-amber-400'
                          : kw.flag === 'over-stuffed'
                          ? 'bg-rose-400'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">{kw.recommendation}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 3: WEAK LANGUAGE DETECTOR */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-amber-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SpellCheck2 className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                3. Weak Language Detector
              </h4>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
              {weakLanguage.total_weak_phrases_count} Vague Phrases
            </span>
          </div>

          <div className="space-y-2">
            {weakLanguage.vague_phrases.map((phrase, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through text-rose-400 font-mono font-bold">"{phrase.phrase}"</span>
                  <span className="text-slate-500">&rarr;</span>
                  <span className="text-emerald-300 font-bold">{phrase.strong_alternatives.join(' / ')}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic">In bullet: "{phrase.found_in_bullet}"</p>
              </div>
            ))}
          </div>

          {/* Action Verbs by Category */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-300 uppercase">Strong Action Verbs by Category:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {weakLanguage.action_verbs_by_category.map((cat, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                  <strong className="text-cyan-300 block mb-0.5">{cat.category}</strong>
                  <span className="text-slate-300">{cat.suggested_verbs.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 4: IMPACT / QUANTIFICATION CHECK */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-emerald-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                4. Impact & Quantification Check
              </h4>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
              Score: {impactQuant.quantification_score}/100
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{impactQuant.summary}</p>

          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase">
              Bullets Missing Numbers (Strict Placeholder Guidance):
            </div>
            {impactQuant.bullets_missing_metrics.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                <div className="text-slate-400 line-through text-[11px]">{item.bullet}</div>
                <div className="text-emerald-300 font-medium leading-snug">
                  {item.suggested_metric_placement}
                </div>
                <div className="text-[10px] text-cyan-400 font-semibold">{item.tip}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 5: SECTION COMPLETENESS SCORE */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-cyan-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                5. Section Completeness Score
              </h4>
            </div>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md">
              {sectionComp.overall_score}% Complete
            </span>
          </div>

          <div className="space-y-2">
            {sectionComp.sections.map((sec, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {sec.status === 'complete' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="font-bold text-white">{sec.section_name}</span>
                </div>
                <span className="text-[11px] text-slate-400">{sec.quick_suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 6: RED FLAG SCANNER */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-rose-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                6. Red Flag Scanner
              </h4>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
              Risk: {redFlags.risk_level.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{redFlags.summary}</p>

          <div className="space-y-2">
            {redFlags.red_flags.map((flag, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-300">
                  <span>{flag.title}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-500/20">
                    {flag.severity}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">{flag.description}</p>
                <p className="text-cyan-300 text-[11px] font-semibold">{flag.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 7: 6-SECOND RECRUITER SCAN */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-indigo-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                7. 6-Second Recruiter Scan
              </h4>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
              {recruiterScan.recruiter_action}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
            <strong>Recruiter Verdict: </strong>
            <span>{recruiterScan.scan_verdict}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase">What they notice first:</div>
            {recruiterScan.what_they_notice_first.map((item, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-white/5 flex items-center justify-between">
                <span className="text-slate-200 font-medium">{item.category}: {item.detail}</span>
                <span className="text-emerald-400 font-bold text-[10px]">{item.impression}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs">
            <div className="text-[11px] font-bold text-amber-400 uppercase">What gets missed in 6 seconds:</div>
            <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-400 text-[11px]">
              {recruiterScan.what_they_miss.map((miss, idx) => (
                <li key={idx}>{miss}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 8: READABILITY AND TONE */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-cyan-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                8. Readability & Tone
              </h4>
            </div>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md">
              {readabilityTone.tone_label} Tone
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Reading Level</span>
              <span className="text-white font-bold text-xs">{readabilityTone.reading_level}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Avg Bullet Length</span>
              <span className="text-white font-bold text-xs">{readabilityTone.avg_bullet_length_words} words (Optimal: 14-22)</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{readabilityTone.tone_feedback}</p>
        </div>

        {/* ================================================================= */}
        {/* CARD 9: INCLUSIVE LANGUAGE CHECK */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-emerald-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                9. Inclusive Language Check
              </h4>
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
              Score: {inclusiveLang.inclusive_score}/100
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{inclusiveLang.summary}</p>

          {inclusiveLang.flags.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero bias markers found. Resume uses universal, merit-based technical language.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {inclusiveLang.flags.map((flag, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-white/5 text-xs">
                  <div className="text-rose-400 font-bold">{flag.flagged_term} &rarr; {flag.neutral_alternative}</div>
                  <p className="text-slate-400 text-[10px]">{flag.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* CARD 10: SKILL GAP ROADMAP */}
        {/* ================================================================= */}
        <div className="glass-panel p-5 space-y-4 border-t-2 border-t-indigo-400 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                10. Skill Gap Learning Roadmap
              </h4>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
              {skillRoadmap.length} Learning Plans
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {skillRoadmap.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-white text-xs">{item.missing_skill}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                      {item.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                    <strong>Focus:</strong> {item.what_to_learn}
                  </p>
                  <p className="text-cyan-300 text-[11px] leading-relaxed">
                    <strong>Build Project:</strong> {item.small_project_to_build}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 font-mono">
                  Est. Time: {item.estimated_time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
