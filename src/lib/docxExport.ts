import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { ResumeBuilderData } from '../types';

/**
 * Exports ResumeBuilderData into a formatted, ATS-compliant Microsoft Word (.docx) file
 */
export async function generateDocxBlob(data: ResumeBuilderData, accentColor: string = '#4f46e5'): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  // Header: Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: data.contact.fullName || 'Candidate Name',
          bold: true,
          size: 36, // 18pt
          font: 'Arial',
        }),
      ],
    })
  );

  // Job Title (if present)
  if (data.contact.jobTitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: data.contact.jobTitle,
            size: 24, // 12pt
            color: '555555',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // Contact line
  const contactParts: string[] = [];
  if (data.contact.location) contactParts.push(data.contact.location);
  if (data.contact.email) contactParts.push(data.contact.email);
  if (data.contact.phone) contactParts.push(data.contact.phone);
  if (data.contact.linkedin) contactParts.push(data.contact.linkedin);
  if (data.contact.github) contactParts.push(data.contact.github);
  if (data.contact.website) contactParts.push(data.contact.website);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: contactParts.join('  •  '),
            size: 20, // 10pt
            color: '666666',
            font: 'Arial',
          }),
        ],
      })
    );
  }

  // Helper for Section Headings
  const addSectionHeading = (title: string) => {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 120 },
        border: {
          bottom: {
            color: accentColor.replace('#', ''),
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            color: accentColor.replace('#', ''),
            font: 'Arial',
          }),
        ],
      })
    );
  };

  // Section Ordering
  const order = data.sectionOrder || ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'languages'];

  for (const sectionKey of order) {
    if (sectionKey === 'summary' && data.summary?.trim()) {
      addSectionHeading('Professional Summary');
      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: data.summary.trim(),
              size: 21,
              font: 'Arial',
            }),
          ],
        })
      );
    } else if (sectionKey === 'skills' && data.skillCategories?.length > 0) {
      addSectionHeading('Technical Skills');
      for (const cat of data.skillCategories) {
        if (!cat.skills || cat.skills.length === 0) continue;
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `${cat.categoryName || 'Skills'}: `,
                bold: true,
                size: 21,
                font: 'Arial',
              }),
              new TextRun({
                text: cat.skills.join(', '),
                size: 21,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    } else if (sectionKey === 'experience' && data.experience?.length > 0) {
      addSectionHeading('Work Experience');
      for (const exp of data.experience) {
        // Role & Company Row
        const dateRange = `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`.trim();
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              new TextRun({
                text: exp.role || 'Role',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: `  |  ${exp.company || 'Company'}`,
                bold: false,
                color: '444444',
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: dateRange ? `  (${dateRange})` : '',
                italics: true,
                color: '666666',
                size: 20,
                font: 'Arial',
              }),
            ],
          })
        );

        // Bullets
        if (exp.bullets && exp.bullets.length > 0) {
          for (const bullet of exp.bullets) {
            if (!bullet.trim()) continue;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: bullet.trim(),
                    size: 21,
                    font: 'Arial',
                  }),
                ],
              })
            );
          }
        }
      }
    } else if (sectionKey === 'projects' && data.projects?.length > 0) {
      addSectionHeading('Projects');
      for (const proj of data.projects) {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              new TextRun({
                text: proj.title || 'Project',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: proj.techStack ? `  [${proj.techStack}]` : '',
                color: '666666',
                size: 20,
                font: 'Arial',
              }),
              new TextRun({
                text: proj.link ? `  - ${proj.link}` : '',
                color: '0066cc',
                size: 20,
                font: 'Arial',
              }),
            ],
          })
        );

        if (proj.bullets && proj.bullets.length > 0) {
          for (const bullet of proj.bullets) {
            if (!bullet.trim()) continue;
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: bullet.trim(),
                    size: 21,
                    font: 'Arial',
                  }),
                ],
              })
            );
          }
        }
      }
    } else if (sectionKey === 'education' && data.education?.length > 0) {
      addSectionHeading('Education');
      for (const edu of data.education) {
        const degreeStr = [edu.degree, edu.field].filter(Boolean).join(' in ');
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 40 },
            children: [
              new TextRun({
                text: degreeStr || 'Degree',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
              new TextRun({
                text: `  |  ${edu.school || 'Institution'}`,
                color: '444444',
                size: 21,
                font: 'Arial',
              }),
              new TextRun({
                text: edu.graduationDate ? `  (${edu.graduationDate})` : '',
                italics: true,
                color: '666666',
                size: 20,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    } else if (sectionKey === 'certifications' && data.certifications?.length > 0) {
      addSectionHeading('Certifications');
      for (const cert of data.certifications) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: cert.name,
                bold: true,
                size: 21,
                font: 'Arial',
              }),
              new TextRun({
                text: cert.issuer ? ` - ${cert.issuer}` : '',
                size: 21,
                font: 'Arial',
              }),
              new TextRun({
                text: cert.date ? ` (${cert.date})` : '',
                color: '666666',
                size: 20,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    } else if (sectionKey === 'achievements' && data.achievements?.length > 0) {
      addSectionHeading('Achievements & Awards');
      for (const ach of data.achievements) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `${ach.title}: `,
                bold: true,
                size: 21,
                font: 'Arial',
              }),
              new TextRun({
                text: ach.description,
                size: 21,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    } else if (sectionKey === 'languages' && data.languages?.length > 0) {
      addSectionHeading('Languages');
      const langStr = data.languages.map((l: any) => `${l.language} (${l.proficiency})`).join(', ');
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: langStr,
              size: 21,
              font: 'Arial',
            }),
          ],
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
