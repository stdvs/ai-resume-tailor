/**
 * Resume Match AI - Core Types
 */

export interface BulletRewrite {
  original: string;
  improved: string;
  reason: string;
}

export interface ScoreBreakdown {
  keywords_match: number;
  skills_match: number;
  experience_relevance: number;
  formatting_readiness: number;
  bullet_impact: number;
}

export interface MissingKeywordWithPriority {
  keyword: string;
  priority: 'High' | 'Medium' | 'Low';
  reason?: string;
}

export interface KeywordDensityItem {
  keyword: string;
  count: number;
  density: number; // percentage
  status: 'optimal' | 'stuffed' | 'sparse';
  recommendation: string;
}

export interface ParsingVulnerability {
  category: 'formatting' | 'dates' | 'sections' | 'layout' | 'contact_info';
  severity: 'low' | 'medium' | 'high';
  issue: string;
  recommendation: string;
}

export interface AtsSimulationReport {
  parser_score: number; // 0 - 100
  risk_level: 'low' | 'medium' | 'high';
  parsed_sections_found: string[];
  parsed_sections_missing: string[];
  date_format_status: 'standardized' | 'inconsistent' | 'warning';
  date_format_details: string;
  keyword_density_warnings: KeywordDensityItem[];
  formatting_issues: ParsingVulnerability[];
  specific_mitigation_steps: string[];
  raw_parser_simulation_text?: string;
}

export interface AnalysisResult {
  match_score: number;
  score_explanation: string;
  score_breakdown?: ScoreBreakdown;
  matching_skills: string[];
  missing_keywords: string[];
  missing_keywords_with_priority?: MissingKeywordWithPriority[];
  bullets_to_rewrite: BulletRewrite[];
  top_5_changes: string[];
  pre_apply_checklist: string[];
  tailored_resume_text: string;
  ats_formatting_tips?: string[];
  job_title_guess?: string;
  ats_simulation?: AtsSimulationReport;
}

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  extractedText: string;
  charCount?: number;
  wordCount?: number;
}

export interface UserHistoryItem {
  id: string;
  createdAt: string;
  jobTitle: string;
  matchScore: number;
  scoreExplanation: string;
  scoreBreakdown?: ScoreBreakdown;
  matchingSkills: string[];
  missingKeywords: string[];
  bulletsToRewrite: BulletRewrite[];
  top5Changes: string[];
  preApplyChecklist: string[];
  tailoredResumeText: string;
  atsSimulation?: AtsSimulationReport;
}

export type ThemePreset = 'auto' | 'aurora' | 'sunset' | 'ocean' | 'forest';

export interface ThemeConfig {
  name: string;
  accent: string;
  accent2: string;
  glow: string;
  blob1: string;
  blob2: string;
  blob3: string;
  badge: string;
}
