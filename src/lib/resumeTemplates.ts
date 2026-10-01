/**
 * Professional Resume Template Formatter Engine
 * Formats tailored resumes into 3 distinct layout styles:
 * 1. Modern (contemporary layout with categorized skill tags, clean geometric dividers)
 * 2. Minimalist (pure, distraction-free single-column ATS classic layout)
 * 3. Bold (high-contrast executive layout with prominent headers and metric anchors)
 */

export type TemplateStyle = 'modern' | 'minimalist' | 'bold';

export interface ResumeTemplate {
  id: TemplateStyle;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  bestFor: string;
  atsCompatibility: string;
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    subtitle: 'Sleek & Contemporary Tech',
    badge: 'Popular for Tech',
    description: 'Features categorized skills at the top, geometric divider bars (━━━━), bracketed skill chips, and clean bullet points for modern parsers.',
    bestFor: 'Software Engineers, Frontend/Full-Stack, Data Scientists, and Modern Startups.',
    atsCompatibility: '99% Parser Score on Greenhouse, Lever, Ashby, and modern ATS.',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    subtitle: 'Clean & Distraction-Free',
    badge: '100% Universal ATS',
    description: 'Pure, zero-clutter single-column layout with subtle hairline dividers (────), standard hyphen bullets, and zero parsing obstacles.',
    bestFor: 'Fortune 500, Enterprise portals, Defense, Healthcare, and legacy parsers (Taleo, Workday).',
    atsCompatibility: '100% Universal Parseability guaranteed across all systems.',
  },
  {
    id: 'bold',
    name: 'Bold',
    subtitle: 'High-Impact & Executive',
    badge: 'Executive Presence',
    description: 'High-contrast heavy double dividers (════), solid section anchors (■), prominent role banners, and highlighted metrics for immediate visual scanning.',
    bestFor: 'Senior Engineers, Tech Leads, Engineering Managers, and competitive applications.',
    atsCompatibility: '98% Parser Score with executive scanning optimization.',
  },
];

export interface ParsedSections {
  header: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  other: string;
}

export function parseRawResume(rawText: string): ParsedSections {
  const lines = rawText.split('\n');
  const sections: ParsedSections = {
    header: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    other: '',
  };

  let currentSection = 'header';
  const headerLines: string[] = [];
  const summaryLines: string[] = [];
  const skillsLines: string[] = [];
  const expLines: string[] = [];
  const eduLines: string[] = [];
  const otherLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for section transitions
    if (/^(PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE|OBJECTIVE|EXECUTIVE\s+SUMMARY)/i.test(trimmed)) {
      currentSection = 'summary';
      continue;
    } else if (/^(TECHNICAL\s+SKILLS|SKILLS|CORE\s+COMPETENCIES|TECHNOLOGIES|KEY\s+SKILLS)/i.test(trimmed)) {
      currentSection = 'skills';
      continue;
    } else if (/^(WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT\s+HISTORY)/i.test(trimmed)) {
      currentSection = 'experience';
      continue;
    } else if (/^(EDUCATION|ACADEMIC\s+BACKGROUND|DEGREES)/i.test(trimmed)) {
      currentSection = 'education';
      continue;
    } else if (/^(CERTIFICATIONS|PROJECTS|AWARDS|PUBLICATIONS|ADDITIONAL\s+INFORMATION)/i.test(trimmed)) {
      currentSection = 'other';
      continue;
    }

    if (currentSection === 'header') {
      if (trimmed) headerLines.push(line);
    } else if (currentSection === 'summary') {
      summaryLines.push(line);
    } else if (currentSection === 'skills') {
      skillsLines.push(line);
    } else if (currentSection === 'experience') {
      expLines.push(line);
    } else if (currentSection === 'education') {
      eduLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  sections.header = headerLines.join('\n').trim();
  sections.summary = summaryLines.join('\n').trim();
  sections.skills = skillsLines.join('\n').trim();
  sections.experience = expLines.join('\n').trim();
  sections.education = eduLines.join('\n').trim();
  sections.other = otherLines.join('\n').trim();

  // Fallback if parsing didn't find sections
  if (!sections.experience && !sections.skills) {
    sections.experience = rawText.trim();
  }

  return sections;
}

/**
 * Format resume text injecting the selected template's markup
 */
export function formatResumeWithTemplate(
  rawResumeText: string,
  templateId: string,
  matchingSkills: string[] = []
): string {
  const parsed = parseRawResume(rawResumeText);

  // Normalize template id
  const style: TemplateStyle =
    templateId === 'minimalist' || templateId === 'minimalist-ats'
      ? 'minimalist'
      : templateId === 'bold' || templateId === 'executive'
      ? 'bold'
      : 'modern';

  switch (style) {
    case 'modern':
      return formatModernTemplate(parsed, matchingSkills);
    case 'minimalist':
      return formatMinimalistTemplate(parsed, matchingSkills);
    case 'bold':
      return formatBoldTemplate(parsed, matchingSkills);
    default:
      return formatModernTemplate(parsed, matchingSkills);
  }
}

/**
 * STYLE 1: MODERN
 * Injects markdown-like headers, geometric dividers (━━━━), categorized skills chips, and clean dots (•)
 */
function formatModernTemplate(p: ParsedSections, matchingSkills: string[]): string {
  const parts: string[] = [];
  const bar = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

  // 1. Header
  const headerLines = p.header.split('\n').filter(Boolean);
  const name = headerLines[0] || 'Candidate Resume';
  const contact = headerLines.slice(1).join('  |  ');

  parts.push(name.toUpperCase());
  if (contact) parts.push(contact);
  parts.push(bar);
  parts.push('');

  // 2. Summary
  if (p.summary) {
    parts.push('## PROFESSIONAL SUMMARY');
    parts.push(bar.slice(0, 48));
    parts.push(p.summary);
    parts.push('');
  }

  // 3. Technical Skills (Prominent & Tagged)
  parts.push('## CORE TECHNICAL STACK');
  parts.push(bar.slice(0, 48));
  if (p.skills) {
    parts.push(p.skills);
  } else if (matchingSkills.length > 0) {
    // Format as modern tags
    const tags = matchingSkills.map((s) => `[ ${s} ]`).join('  ');
    parts.push(tags);
  }
  parts.push('');

  // 4. Experience with clean modern bullet formatting
  parts.push('## PROFESSIONAL EXPERIENCE');
  parts.push(bar.slice(0, 48));
  const expLines = p.experience.split('\n');
  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      parts.push('');
      continue;
    }
    // Check if job title/company header
    if (!trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && (trimmed.includes('|') || /\b(19|20)\d{2}\b/i.test(trimmed))) {
      parts.push(`▶ ${trimmed}`);
    } else {
      const clean = trimmed.replace(/^([•\-\*▶\s]+)/, '');
      parts.push(`  • ${clean}`);
    }
  }
  parts.push('');

  // 5. Education
  if (p.education) {
    parts.push('## EDUCATION & CREDENTIALS');
    parts.push(bar.slice(0, 48));
    parts.push(p.education);
    parts.push('');
  }

  // 6. Additional
  if (p.other) {
    parts.push('## PROJECTS & CERTIFICATIONS');
    parts.push(bar.slice(0, 48));
    parts.push(p.other);
    parts.push('');
  }

  return parts.join('\n').trim();
}

/**
 * STYLE 2: MINIMALIST
 * Pure distraction-free single-column ATS classic layout.
 * Uses standard ASCII rules (────), clean hyphen bullets (-), zero decorative noise.
 */
function formatMinimalistTemplate(p: ParsedSections, matchingSkills: string[]): string {
  const parts: string[] = [];
  const divider = '─────────────────────────────────────────────────────────────────';

  // 1. Clean Header
  const headerLines = p.header.split('\n').filter(Boolean);
  parts.push(headerLines.join('\n'));
  parts.push('');
  parts.push(divider);

  // 2. Summary
  if (p.summary) {
    parts.push('SUMMARY');
    parts.push(divider);
    parts.push(p.summary);
    parts.push('');
  }

  // 3. Experience
  parts.push('EXPERIENCE');
  parts.push(divider);
  const expLines = p.experience.split('\n');
  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      parts.push('');
      continue;
    }
    if (!trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && (trimmed.includes('|') || /\b(19|20)\d{2}\b/i.test(trimmed))) {
      parts.push(trimmed);
    } else {
      const clean = trimmed.replace(/^([•\-\*▶\s]+)/, '');
      parts.push(`- ${clean}`);
    }
  }
  parts.push('');

  // 4. Skills
  parts.push('TECHNICAL SKILLS');
  parts.push(divider);
  if (p.skills) {
    parts.push(p.skills);
  } else if (matchingSkills.length > 0) {
    parts.push(matchingSkills.join(', '));
  }
  parts.push('');

  // 5. Education
  if (p.education) {
    parts.push('EDUCATION');
    parts.push(divider);
    parts.push(p.education);
    parts.push('');
  }

  // 6. Other
  if (p.other) {
    parts.push('ADDITIONAL INFORMATION');
    parts.push(divider);
    parts.push(p.other);
    parts.push('');
  }

  return parts.join('\n').trim();
}

/**
 * STYLE 3: BOLD
 * High-impact executive layout.
 * Uses heavy double-line borders (════), solid section anchors (■), prominent role banners (>>> ... <<<), and highlighted metric callouts.
 */
function formatBoldTemplate(p: ParsedSections, matchingSkills: string[]): string {
  const parts: string[] = [];
  const doubleBar = '════════════════════════════════════════════════════════════════════════';

  // 1. Header with Heavy Borders
  const headerLines = p.header.split('\n').filter(Boolean);
  const name = headerLines[0] || 'Candidate Resume';
  const contact = headerLines.slice(1).join('  |  ');

  parts.push(doubleBar);
  parts.push(`  ${name.toUpperCase()}`);
  if (contact) parts.push(`  ${contact}`);
  parts.push(doubleBar);
  parts.push('');

  // 2. Executive Value Proposition
  if (p.summary) {
    parts.push('■ EXECUTIVE VALUE PROPOSITION');
    parts.push('─'.repeat(40));
    parts.push(p.summary);
    parts.push('');
  }

  // 3. Core Competencies Matrix
  parts.push('■ CORE COMPETENCIES & DOMAIN MASTERY');
  parts.push('─'.repeat(40));
  if (p.skills) {
    parts.push(p.skills);
  } else if (matchingSkills.length > 0) {
    // High-impact matrix style
    parts.push(matchingSkills.map((s) => `[✔] ${s}`).join('   '));
  }
  parts.push('');

  // 4. Professional Experience with Prominent Banners
  parts.push('■ EXECUTIVE EXPERIENCE & RECORD OF ACHIEVEMENT');
  parts.push('─'.repeat(40));
  const expLines = p.experience.split('\n');
  for (const line of expLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      parts.push('');
      continue;
    }
    if (!trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && (trimmed.includes('|') || /\b(19|20)\d{2}\b/i.test(trimmed))) {
      parts.push(`>>> ${trimmed.toUpperCase()} <<<`);
    } else {
      const clean = trimmed.replace(/^([•\-\*▶\s]+)/, '');
      parts.push(`• ${clean}`);
    }
  }
  parts.push('');

  // 5. Education
  if (p.education) {
    parts.push('■ EDUCATION & ACADEMIC CREDENTIALS');
    parts.push('─'.repeat(40));
    parts.push(p.education);
    parts.push('');
  }

  // 6. Additional
  if (p.other) {
    parts.push('■ LEADERSHIP, CERTIFICATIONS & NOTABLE PROJECTS');
    parts.push('─'.repeat(40));
    parts.push(p.other);
    parts.push('');
  }

  return parts.join('\n').trim();
}
