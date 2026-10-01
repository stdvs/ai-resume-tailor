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
  status: 'optimal' | 'stuffed' | 'sparse' | 'under-used';
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

// -------------------------------------------------------------
// 10 DEEP ANALYSIS ENGINE TYPES
// -------------------------------------------------------------

// 1. ATS FORMATTING CHECK
export interface AtsFormattingCheckItem {
  category: string; // e.g. "Tables & Columns", "Graphics & Icons", "Fonts & Symbols", "Standard Section Headings", "Contact Details", "Date Formats"
  item: string;
  status: 'pass' | 'warn' | 'fail';
  fix_tip: string;
}

export interface AtsFormattingCheck {
  overall_score: number;
  passed_count: number;
  warnings_count: number;
  failed_count: number;
  issues: AtsFormattingCheckItem[];
  summary: string;
}

// 2. KEYWORD DENSITY MAP
export interface KeywordDensityMapItem {
  keyword: string;
  count_in_resume: number;
  target_frequency: string;
  density_percent: number;
  flag: 'optimal' | 'under-used' | 'over-stuffed' | 'missing';
  recommendation: string;
}

// 3. WEAK LANGUAGE DETECTOR
export interface WeakLanguageItem {
  phrase: string;
  found_in_bullet: string;
  issue_type: 'vague_phrase' | 'passive_voice' | 'buzzword';
  strong_alternatives: string[];
}

export interface ActionVerbCategory {
  category: string; // e.g. "Leadership & Strategy", "Technical Execution", "Optimization & Impact", "Collaboration"
  suggested_verbs: string[];
}

export interface WeakLanguageReport {
  vague_phrases: WeakLanguageItem[];
  action_verbs_by_category: ActionVerbCategory[];
  total_weak_phrases_count: number;
  summary: string;
}

// 4. IMPACT / QUANTIFICATION CHECK
export interface UnquantifiedBulletItem {
  bullet: string;
  suggested_metric_placement: string; // contains "[add metric]" placeholder
  tip: string;
}

export interface ImpactQuantificationReport {
  bullets_missing_metrics: UnquantifiedBulletItem[];
  quantified_bullets_count: number;
  unquantified_bullets_count: number;
  quantification_score: number; // 0 - 100
  summary: string;
}

// 5. SECTION COMPLETENESS SCORE
export interface SectionCompletenessItem {
  section_name: string; // Summary, Skills, Experience, Education, Projects, Certifications, Links
  status: 'complete' | 'needs_improvement' | 'missing';
  score: number; // 0 - 100
  quick_suggestion: string;
}

export interface SectionCompletenessReport {
  overall_completeness_score?: number; // 0 - 100
  overall_score?: number; // 0 - 100 alias
  sections: SectionCompletenessItem[];
  summary: string;
}

// 6. RED FLAG SCANNER
export interface RedFlagItem {
  type: 'employment_gap' | 'short_stint' | 'typo' | 'inconsistent_tense' | 'length_issue' | 'missing_date';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

export interface RedFlagReport {
  has_red_flags: boolean;
  flags_count: number;
  red_flags: RedFlagItem[];
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
}

// 7. 6-SECOND RECRUITER SCAN
export interface RecruiterScanItem {
  category: string; // Name & Contact, Current/Recent Title, Target Role Alignment, Prominent Skills, Visual Trajectory
  detail: string;
  impression: 'Strong' | 'Average' | 'Weak';
}

export interface SixSecondRecruiterScanReport {
  what_they_notice_first: RecruiterScanItem[];
  what_they_miss: string[];
  scan_verdict: string;
  recruiter_action: 'Proceed to Interview' | 'Detailed Review' | 'Likely Pass';
}

// 8. READABILITY AND TONE
export interface ReadabilityToneReport {
  reading_level: string; // e.g. "Grade 10 - Professional Technical"
  avg_bullet_length_words: number;
  sentence_variety: 'Low' | 'Moderate' | 'High';
  tone_label: 'Confident' | 'Neutral' | 'Passive';
  tone_feedback: string;
  readability_score: number; // 0 - 100
}

// 9. INCLUSIVE LANGUAGE CHECK
export interface InclusiveLanguageFlag {
  flagged_term: string;
  context_sentence: string;
  bias_type: 'gendered' | 'ageist' | 'exclusionary' | 'ableist';
  neutral_alternative: string;
  explanation: string;
}

export interface InclusiveLanguageReport {
  inclusive_score: number; // 0 - 100
  flags: InclusiveLanguageFlag[];
  summary: string;
}

// 10. SKILL GAP ROADMAP
export interface SkillGapRoadmapItem {
  missing_skill: string;
  priority: 'High' | 'Medium' | 'Low';
  what_to_learn: string;
  small_project_to_build: string;
  estimated_time: string; // e.g. "1-2 weeks", "3-5 days"
}

// -------------------------------------------------------------
// CORE ANALYSIS RESULT (COMBINED ENGINE)
// -------------------------------------------------------------
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

  // New Deep Analysis Engine Modules
  ats_formatting_check?: AtsFormattingCheck;
  keyword_density_map?: KeywordDensityMapItem[];
  weak_language_detector?: WeakLanguageReport;
  impact_quantification?: ImpactQuantificationReport;
  section_completeness?: SectionCompletenessReport;
  red_flag_scanner?: RedFlagReport;
  six_second_recruiter_scan?: SixSecondRecruiterScanReport;
  readability_and_tone?: ReadabilityToneReport;
  inclusive_language_check?: InclusiveLanguageReport;
  skill_gap_roadmap?: SkillGapRoadmapItem[];
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
  ats_formatting_check?: AtsFormattingCheck;
  keyword_density_map?: KeywordDensityMapItem[];
  weak_language_detector?: WeakLanguageReport;
  impact_quantification?: ImpactQuantificationReport;
  section_completeness?: SectionCompletenessReport;
  red_flag_scanner?: RedFlagReport;
  six_second_recruiter_scan?: SixSecondRecruiterScanReport;
  readability_and_tone?: ReadabilityToneReport;
  inclusive_language_check?: InclusiveLanguageReport;
  skill_gap_roadmap?: SkillGapRoadmapItem[];
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

// -------------------------------------------------------------
// RESUME BUILDER & EXPORT SYSTEM TYPES
// -------------------------------------------------------------

export type BuilderTemplateId = 'classic' | 'modern' | 'minimal' | 'sidebar' | 'compact';
export type BuilderFontFamily = 'inter' | 'roboto' | 'merriweather' | 'playfair' | 'fira' | 'jetbrains' | 'poppins';

export interface ResumeContactInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ResumeSkillCategory {
  id: string;
  categoryName: string;
  skills: string[];
}

export interface ResumeExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface ResumeEducationItem {
  id: string;
  degree: string;
  field: string;
  school: string;
  location: string;
  graduationDate: string;
  gpaOrHonors?: string;
  bullets?: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  techStack: string;
  link: string;
  bullets: string[];
}

export interface ResumeCertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ResumeAchievementItem {
  id: string;
  title: string;
  date?: string;
  description: string;
}

export interface ResumeLanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export interface ResumeBuilderData {
  contact: ResumeContactInfo;
  summary: string;
  skillCategories: ResumeSkillCategory[];
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
  projects: ResumeProjectItem[];
  certifications: ResumeCertificationItem[];
  achievements: ResumeAchievementItem[];
  languages: ResumeLanguageItem[];
  sectionOrder?: string[];
}

export interface ResumeVersion {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  data: ResumeBuilderData;
  templateId: BuilderTemplateId;
  accentColor: string;
  fontFamily: BuilderFontFamily;
}

// -------------------------------------------------------------
// JOB SEARCH TOOLS TYPES
// -------------------------------------------------------------

export type JobTrackerStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobTrackerCard {
  id: string;
  company: string;
  role: string;
  link?: string;
  dateAdded: string;
  status: JobTrackerStatus;
  matchScore?: number;
  notes?: string;
  resumeVersionUsed?: string;
  followUpDate?: string; // YYYY-MM-DD
  salary?: string;
  location?: string;
}

export interface MultiJobInputItem {
  id: string;
  jobTitle: string;
  company: string;
  description: string;
}

export interface MultiJobComparisonItem {
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  fitRank: number;
  verdict: string;
  pros: string[];
  risks: string[];
}

export interface MultiJobComparisonReport {
  comparedJobs: MultiJobComparisonItem[];
  recommendation: {
    applyFirstJobId: string;
    applyFirstTitle: string;
    applyFirstCompany: string;
    primaryReason: string;
    strategicActionPlan: string[];
  };
}

export type CoverLetterTone = 'Professional' | 'Confident' | 'Friendly' | 'Concise';
export type CoverLetterLength = 'concise' | 'standard' | 'detailed';

export interface EmailMessageTemplates {
  coldOutreach: string;
  linkedInNote: string;
  recruiterMessage: string;
  applicationFollowUp: string;
  thankYouEmail: string;
  salaryNegotiation: string;
}

export interface LinkedInOptimizationData {
  headlineOptions: string[];
  improvedAbout: string;
  coreKeywords: string[];
  skillsToHighlight: string[];
  profileTips: string[];
}

export interface TechnicalQuestionItem {
  question: string;
  category: string;
  expectedTopics: string[];
  sampleApproach: string;
}

export interface BehavioralQuestionItem {
  question: string;
  competency: string;
  starOutline: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export interface InterviewPrepPackage {
  elevatorPitch: string;
  technicalQuestions: TechnicalQuestionItem[];
  behavioralQuestions: BehavioralQuestionItem[];
}

export interface MockAnswerFeedback {
  score: number; // 0-100
  verdict: 'Excellent' | 'Strong' | 'Needs Improvement' | 'Weak';
  strengths: string[];
  missedElements: string[];
  coachingTip: string;
  enhancedAnswer: string;
}

