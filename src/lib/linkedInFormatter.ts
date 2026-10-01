/**
 * LinkedIn Formatting Engine
 * Converts tailored resume data into formats specifically engineered for LinkedIn:
 * 1. LinkedIn 'About' Section (with search SEO, hook before "see more", skills cloud, and CTA)
 * 2. LinkedIn 'Experience' Section (role-by-role format with skills tags)
 */

import { parseRawResume } from './resumeTemplates';

export interface LinkedInFormattedContent {
  aboutSection: string;
  experienceSection: string;
  roles: Array<{
    title: string;
    content: string;
  }>;
}

export function formatForLinkedIn(
  tailoredResumeText: string,
  matchingSkills: string[] = [],
  missingKeywords: string[] = []
): LinkedInFormattedContent {
  const parsed = parseRawResume(tailoredResumeText);
  const headerLines = parsed.header.split('\n').filter(Boolean);
  const candidateName = headerLines[0] || 'Professional';

  // 1. LinkedIn "About" Section
  // LinkedIn displays the first ~200-250 characters before the "...see more" cutoff.
  const summaryText = parsed.summary ||
    `Experienced engineering professional with a strong track record of designing, building, and scaling high-impact software systems.`;

  const topSkillsList = matchingSkills.length > 0 ? matchingSkills.slice(0, 12) : ['React', 'TypeScript', 'Node.js', 'Web Performance'];

  const aboutSection = `${summaryText}

Key Highlights & Impact:
• Architecting robust, scalable web applications with a focus on high performance and clean maintainable code.
• Collaborating across product, design, and engineering teams to translate complex business needs into intuitive user experiences.
• Driving modern development best practices, automated testing, and continuous delivery workflows.

Core Competencies & Technologies:
${topSkillsList.map((skill) => `• ${skill}`).join('\n')}

Let's Connect:
Open to discussing senior engineering opportunities, technical architecture, and collaborative projects.
Email: ${headerLines.find((l) => l.includes('@')) || '[your-email@example.com]'}`;

  // 2. LinkedIn "Experience" Section
  const expLines = parsed.experience.split('\n');
  const roles: Array<{ title: string; content: string }> = [];

  let currentRoleTitle = '';
  let currentRoleBullets: string[] = [];

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i].trim();
    if (!line) continue;

    // Detect role header line (e.g. "Frontend Engineer | TechStream Solutions (2022 - Present)")
    const isRoleHeader =
      !line.startsWith('•') &&
      !line.startsWith('-') &&
      !line.startsWith('*') &&
      (line.includes('|') || /\b(19|20)\d{2}\b/i.test(line));

    if (isRoleHeader) {
      if (currentRoleTitle && currentRoleBullets.length > 0) {
        roles.push({
          title: currentRoleTitle,
          content: formatSingleLinkedInRole(currentRoleTitle, currentRoleBullets, matchingSkills),
        });
      }
      currentRoleTitle = line;
      currentRoleBullets = [];
    } else {
      const cleanBullet = line.replace(/^([•\-\*]\s*)/, '');
      currentRoleBullets.push(cleanBullet);
    }
  }

  // Push final role
  if (currentRoleTitle && currentRoleBullets.length > 0) {
    roles.push({
      title: currentRoleTitle,
      content: formatSingleLinkedInRole(currentRoleTitle, currentRoleBullets, matchingSkills),
    });
  }

  // Combined experience section
  const experienceSection = roles.length > 0
    ? roles.map((r) => r.content).join('\n\n' + '─'.repeat(45) + '\n\n')
    : parsed.experience;

  return {
    aboutSection,
    experienceSection,
    roles,
  };
}

function formatSingleLinkedInRole(
  roleHeader: string,
  bullets: string[],
  relevantSkills: string[]
): string {
  const parts: string[] = [];
  parts.push(roleHeader);
  parts.push('');

  bullets.forEach((b) => {
    parts.push(`• ${b}`);
  });

  if (relevantSkills.length > 0) {
    parts.push('');
    parts.push(`Key Skills: ${relevantSkills.slice(0, 6).join(' · ')}`);
  }

  return parts.join('\n');
}
