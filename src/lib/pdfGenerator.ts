/**
 * Professional PDF Resume Generator using jsPDF
 * Creates ATS-compliant, print-ready, beautifully typeset PDF documents
 * tailored to the selected professional template.
 */

import { jsPDF } from 'jspdf';
import { parseRawResume } from './resumeTemplates';

export interface PdfExportOptions {
  filename?: string;
  templateId?: string;
  matchingSkills?: string[];
}

export function generatePdfResume(
  rawResumeText: string,
  options: PdfExportOptions = {}
): jsPDF {
  const {
    templateId = 'modern-tech',
    matchingSkills = [],
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  const parsed = parseRawResume(rawResumeText);

  // Document dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 45; // 45 pt margin
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 45;

  let y = margin;

  // Normalize template style to modern, minimalist, or bold
  const style =
    templateId === 'minimalist' || templateId === 'minimalist-ats'
      ? 'minimalist'
      : templateId === 'bold' || templateId === 'executive'
      ? 'bold'
      : 'modern';

  // Colors based on template
  let primaryColor: [number, number, number] = [15, 23, 42]; // slate-900
  let accentColor: [number, number, number] = [79, 70, 229]; // indigo-600
  let mutedColor: [number, number, number] = [100, 116, 139]; // slate-500
  let lineWidth = 1.0;

  if (style === 'bold') {
    accentColor = [30, 58, 138]; // navy blue-900
    primaryColor = [15, 23, 42]; // deep slate-900
    lineWidth = 2.0;
  } else if (style === 'minimalist') {
    accentColor = [71, 85, 105]; // slate-600
    primaryColor = [30, 41, 59]; // slate-800
    lineWidth = 0.5;
  }

  // Helper: check page break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper: draw section heading
  const drawSectionHeader = (title: string) => {
    ensureSpace(32);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(style === 'bold' ? 12 : 11);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(title.toUpperCase(), margin, y);

    // Accent line underneath
    y += 4;
    doc.setDrawColor(style === 'minimalist' ? 203 : style === 'bold' ? 30 : 226, 
                     style === 'minimalist' ? 213 : style === 'bold' ? 58 : 232, 
                     style === 'minimalist' ? 225 : style === 'bold' ? 138 : 240);
    doc.setLineWidth(lineWidth);
    doc.line(margin, y, margin + contentWidth, y);

    if (style !== 'minimalist') {
      // Accent lead line
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(style === 'bold' ? 2.5 : 1.5);
      doc.line(margin, y, margin + (style === 'bold' ? 60 : 40), y);
    }

    y += 12;
  };

  // 1. Header (Name & Contact Info)
  const headerLines = parsed.header.split('\n').filter(Boolean);
  const candidateName = headerLines[0] || 'Candidate Resume';
  const contactInfo = headerLines.slice(1).join('  •  ');

  // Candidate Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(candidateName, margin, y);
  y += 16;

  // Contact line
  if (contactInfo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    const splitContact = doc.splitTextToSize(contactInfo, contentWidth);
    doc.text(splitContact, margin, y);
    y += splitContact.length * 11 + 6;
  }

  // Header separator line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  // 2. Professional Summary
  if (parsed.summary) {
    drawSectionHeader(
      style === 'bold'
        ? 'Executive Value Proposition'
        : 'Professional Summary'
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    const summaryLines = doc.splitTextToSize(parsed.summary, contentWidth);
    for (const line of summaryLines) {
      ensureSpace(13);
      doc.text(line, margin, y);
      y += 13;
    }
  }

  // 3. Technical Skills
  const skillsContent = parsed.skills || (matchingSkills.length > 0 ? matchingSkills.join('  •  ') : '');
  if (skillsContent) {
    drawSectionHeader(
      style === 'bold'
        ? 'Core Competencies & Domain Mastery'
        : style === 'modern'
        ? 'Core Technical Stack'
        : 'Technical Skills'
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const rawSkillsLines = skillsContent.split('\n');
    for (const rawLine of rawSkillsLines) {
      if (!rawLine.trim()) continue;
      const wrapped = doc.splitTextToSize(rawLine.trim(), contentWidth);
      for (const line of wrapped) {
        ensureSpace(13);
        doc.text(line, margin, y);
        y += 13;
      }
    }
  }

  // 4. Experience & Bullet Points
  if (parsed.experience) {
    drawSectionHeader(
      style === 'bold'
        ? 'Executive Experience & Record of Achievement'
        : 'Professional Experience'
    );

    const expLines = parsed.experience.split('\n');
    for (const line of expLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 4;
        continue;
      }

      // Detect job title / company / date header line
      const isHeaderLine =
        !trimmed.startsWith('•') &&
        !trimmed.startsWith('-') &&
        !trimmed.startsWith('*') &&
        (trimmed.includes('|') || /\b(19|20)\d{2}\b/i.test(trimmed));

      if (isHeaderLine) {
        ensureSpace(20);
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        const wrapped = doc.splitTextToSize(trimmed, contentWidth);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 13 + 2;
      } else {
        // Bullet point line
        ensureSpace(14);
        const cleanBulletText = trimmed.replace(/^([•\-\*]\s*)/, '');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);

        // Bullet bullet symbol
        doc.text('•', margin + 4, y);

        // Text with hanging indent
        const bulletWidth = contentWidth - 16;
        const wrapped = doc.splitTextToSize(cleanBulletText, bulletWidth);
        for (let i = 0; i < wrapped.length; i++) {
          if (i > 0) ensureSpace(13);
          doc.text(wrapped[i], margin + 16, y);
          y += 13;
        }
      }
    }
  }

  // 5. Education
  if (parsed.education) {
    drawSectionHeader('Education & Credentials');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const eduLines = parsed.education.split('\n');
    for (const line of eduLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      ensureSpace(14);
      const isEduTitle = !trimmed.startsWith('•') && !trimmed.startsWith('-') && (trimmed.includes('|') || /\b(19|20)\d{2}\b/.test(trimmed));
      if (isEduTitle) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
      }
      const wrapped = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 13 + 2;
    }
  }

  // 6. Additional / Certifications
  if (parsed.other) {
    drawSectionHeader('Additional Information & Certifications');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const otherLines = parsed.other.split('\n');
    for (const line of otherLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      ensureSpace(14);
      const wrapped = doc.splitTextToSize(trimmed, contentWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 13;
    }
  }

  // Document metadata
  doc.setProperties({
    title: `${candidateName} - Tailored Resume`,
    subject: 'Tailored Resume generated by Resume Match AI',
    author: 'Resume Match AI',
    creator: 'Resume Match AI (jsPDF)',
  });

  return doc;
}
