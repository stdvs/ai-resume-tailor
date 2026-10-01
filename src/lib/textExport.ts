import { ResumeBuilderData } from '../types';

/**
 * Generates an ultra-clean plain text (.txt) resume formatted for optimal ATS parsing
 */
export function generatePlainText(data: ResumeBuilderData): string {
  const parts: string[] = [];

  // Name & Title
  parts.push(data.contact.fullName.toUpperCase());
  if (data.contact.jobTitle) {
    parts.push(data.contact.jobTitle);
  }

  // Contact
  const contactItems: string[] = [];
  if (data.contact.location) contactItems.push(data.contact.location);
  if (data.contact.email) contactItems.push(data.contact.email);
  if (data.contact.phone) contactItems.push(data.contact.phone);
  if (data.contact.linkedin) contactItems.push(data.contact.linkedin);
  if (data.contact.github) contactItems.push(data.contact.github);
  if (data.contact.website) contactItems.push(data.contact.website);
  if (contactItems.length > 0) {
    parts.push(contactItems.join(' | '));
  }
  parts.push('--------------------------------------------------');

  const order = data.sectionOrder || ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages'];

  for (const sec of order) {
    if (sec === 'summary' && data.summary?.trim()) {
      parts.push('\nPROFESSIONAL SUMMARY');
      parts.push(data.summary.trim());
    } else if (sec === 'skills' && data.skillCategories?.length > 0) {
      parts.push('\nTECHNICAL SKILLS');
      for (const cat of data.skillCategories) {
        if (cat.skills?.length > 0) {
          parts.push(`${cat.categoryName}: ${cat.skills.join(', ')}`);
        }
      }
    } else if (sec === 'experience' && data.experience?.length > 0) {
      parts.push('\nWORK EXPERIENCE');
      for (const exp of data.experience) {
        const dateRange = `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`.trim();
        parts.push(`${exp.role} | ${exp.company}${exp.location ? ` | ${exp.location}` : ''} (${dateRange})`);
        if (exp.bullets) {
          for (const b of exp.bullets) {
            if (b.trim()) parts.push(`• ${b.trim()}`);
          }
        }
        parts.push('');
      }
    } else if (sec === 'projects' && data.projects?.length > 0) {
      parts.push('\nPROJECTS');
      for (const p of data.projects) {
        parts.push(`${p.title}${p.techStack ? ` [${p.techStack}]` : ''}${p.link ? ` (${p.link})` : ''}`);
        if (p.bullets) {
          for (const b of p.bullets) {
            if (b.trim()) parts.push(`• ${b.trim()}`);
          }
        }
        parts.push('');
      }
    } else if (sec === 'education' && data.education?.length > 0) {
      parts.push('\nEDUCATION');
      for (const ed of data.education) {
        const deg = [ed.degree, ed.field].filter(Boolean).join(' in ');
        parts.push(`${deg} | ${ed.school}${ed.graduationDate ? ` (${ed.graduationDate})` : ''}`);
        if (ed.gpaOrHonors) parts.push(`Honors/GPA: ${ed.gpaOrHonors}`);
      }
    } else if (sec === 'certifications' && data.certifications?.length > 0) {
      parts.push('\nCERTIFICATIONS');
      for (const c of data.certifications) {
        parts.push(`• ${c.name}${c.issuer ? ` - ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}`);
      }
    } else if (sec === 'achievements' && data.achievements?.length > 0) {
      parts.push('\nACHIEVEMENTS & AWARDS');
      for (const a of data.achievements) {
        parts.push(`• ${a.title}: ${a.description}${a.date ? ` (${a.date})` : ''}`);
      }
    } else if (sec === 'languages' && data.languages?.length > 0) {
      parts.push('\nLANGUAGES');
      parts.push(data.languages.map((l: any) => `${l.language} (${l.proficiency})`).join(', '));
    }
  }

  return parts.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Generates formatted Markdown (.md) representation
 */
export function generateMarkdown(data: ResumeBuilderData): string {
  const parts: string[] = [];

  parts.push(`# ${data.contact.fullName || 'Candidate Name'}`);
  if (data.contact.jobTitle) {
    parts.push(`### ${data.contact.jobTitle}`);
  }

  const contactItems: string[] = [];
  if (data.contact.location) contactItems.push(data.contact.location);
  if (data.contact.email) contactItems.push(`[${data.contact.email}](mailto:${data.contact.email})`);
  if (data.contact.phone) contactItems.push(data.contact.phone);
  if (data.contact.linkedin) contactItems.push(`[LinkedIn](${data.contact.linkedin})`);
  if (data.contact.github) contactItems.push(`[GitHub](${data.contact.github})`);
  if (data.contact.website) contactItems.push(`[Website](${data.contact.website})`);
  if (contactItems.length > 0) {
    parts.push(contactItems.join(' • '));
  }
  parts.push('\n---\n');

  const order = data.sectionOrder || ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages'];

  for (const sec of order) {
    if (sec === 'summary' && data.summary?.trim()) {
      parts.push('## Professional Summary');
      parts.push(data.summary.trim());
      parts.push('');
    } else if (sec === 'skills' && data.skillCategories?.length > 0) {
      parts.push('## Technical Skills');
      for (const cat of data.skillCategories) {
        if (cat.skills?.length > 0) {
          parts.push(`- **${cat.categoryName}:** ${cat.skills.join(', ')}`);
        }
      }
      parts.push('');
    } else if (sec === 'experience' && data.experience?.length > 0) {
      parts.push('## Work Experience');
      for (const exp of data.experience) {
        const dateRange = `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`.trim();
        parts.push(`### **${exp.role}** | *${exp.company}* ${exp.location ? `(${exp.location})` : ''}`);
        parts.push(`*${dateRange}*\n`);
        if (exp.bullets) {
          for (const b of exp.bullets) {
            if (b.trim()) parts.push(`- ${b.trim()}`);
          }
        }
        parts.push('');
      }
    } else if (sec === 'projects' && data.projects?.length > 0) {
      parts.push('## Projects');
      for (const p of data.projects) {
        parts.push(`### **${p.title}** ${p.techStack ? `\`${p.techStack}\`` : ''}`);
        if (p.link) parts.push(`*Link: [${p.link}](${p.link})*\n`);
        if (p.bullets) {
          for (const b of p.bullets) {
            if (b.trim()) parts.push(`- ${b.trim()}`);
          }
        }
        parts.push('');
      }
    } else if (sec === 'education' && data.education?.length > 0) {
      parts.push('## Education');
      for (const ed of data.education) {
        const deg = [ed.degree, ed.field].filter(Boolean).join(' in ');
        parts.push(`- **${deg}**, *${ed.school}* ${ed.graduationDate ? `(${ed.graduationDate})` : ''}${ed.gpaOrHonors ? ` — *Honors: ${ed.gpaOrHonors}*` : ''}`);
      }
      parts.push('');
    } else if (sec === 'certifications' && data.certifications?.length > 0) {
      parts.push('## Certifications');
      for (const c of data.certifications) {
        parts.push(`- **${c.name}** ${c.issuer ? `(${c.issuer})` : ''} ${c.date ? `— ${c.date}` : ''}`);
      }
      parts.push('');
    } else if (sec === 'achievements' && data.achievements?.length > 0) {
      parts.push('## Achievements');
      for (const a of data.achievements) {
        parts.push(`- **${a.title}**: ${a.description}`);
      }
      parts.push('');
    } else if (sec === 'languages' && data.languages?.length > 0) {
      parts.push('## Languages');
      parts.push(data.languages.map((l: any) => `**${l.language}** (${l.proficiency})`).join(' • '));
      parts.push('');
    }
  }

  return parts.join('\n');
}
