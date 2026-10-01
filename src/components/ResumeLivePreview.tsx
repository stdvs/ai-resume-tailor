import React from 'react';
import {
  ResumeBuilderData,
  BuilderTemplateId,
  BuilderFontFamily,
} from '../types';
import { Mail, Phone, MapPin, Globe, Linkedin, Github, ExternalLink } from 'lucide-react';

interface ResumeLivePreviewProps {
  data: ResumeBuilderData;
  templateId: BuilderTemplateId;
  accentColor: string;
  fontFamily: BuilderFontFamily;
  compactSpacing?: boolean;
}

export const ResumeLivePreview: React.FC<ResumeLivePreviewProps> = ({
  data,
  templateId,
  accentColor,
  fontFamily,
  compactSpacing = false,
}) => {
  const getFontClass = () => {
    switch (fontFamily) {
      case 'merriweather':
        return 'font-serif';
      case 'jetbrains':
        return 'font-mono';
      case 'roboto':
        return 'font-sans tracking-tight';
      case 'poppins':
        return 'font-sans tracking-wide';
      case 'inter':
      default:
        return 'font-sans';
    }
  };

  const spacingClass = compactSpacing ? 'space-y-3 text-[12px]' : 'space-y-4 text-[13px]';
  const headingMargin = compactSpacing ? 'mb-1 mt-2.5' : 'mb-1.5 mt-3.5';

  const order = data.sectionOrder || [
    'summary',
    'skills',
    'experience',
    'projects',
    'education',
    'certifications',
    'achievements',
    'languages',
  ];

  // Helper for Section Headings based on template
  const renderSectionHeader = (title: string) => {
    if (templateId === 'minimal') {
      return (
        <div className={`${headingMargin} border-b border-slate-300 pb-0.5`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === 'modern') {
      return (
        <div className={`${headingMargin} flex items-center gap-2 border-b-2 pb-1`} style={{ borderColor: accentColor }}>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: accentColor }}>
            {title}
          </h3>
        </div>
      );
    }

    if (templateId === 'compact') {
      return (
        <div className={`${headingMargin} border-b border-slate-200 pb-0.5 flex items-center justify-between`}>
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
            {title}
          </h3>
          <div className="w-12 h-0.5 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>
      );
    }

    // Classic default
    return (
      <div className={`${headingMargin} border-b pb-0.5`} style={{ borderColor: `${accentColor}55` }}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900" style={{ color: accentColor }}>
          {title}
        </h3>
      </div>
    );
  };

  // Content Blocks
  const renderSummary = () => {
    if (!data.summary?.trim()) return null;
    return (
      <div key="summary">
        {renderSectionHeader('Professional Summary')}
        <p className="text-slate-700 leading-relaxed text-justify">{data.summary}</p>
      </div>
    );
  };

  const renderSkills = () => {
    if (!data.skillCategories || data.skillCategories.length === 0) return null;
    const hasAny = data.skillCategories.some((c) => c.skills?.length > 0);
    if (!hasAny) return null;

    return (
      <div key="skills">
        {renderSectionHeader('Technical Skills')}
        <div className="space-y-1">
          {data.skillCategories.map((cat) => {
            if (!cat.skills || cat.skills.length === 0) return null;
            return (
              <div key={cat.id} className="text-slate-800 flex flex-wrap items-baseline gap-1.5">
                <span className="font-bold text-slate-900">{cat.categoryName}:</span>
                <span className="text-slate-700">{cat.skills.join(', ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderExperience = () => {
    if (!data.experience || data.experience.length === 0) return null;
    return (
      <div key="experience">
        {renderSectionHeader('Work Experience')}
        <div className="space-y-3">
          {data.experience.map((exp) => (
            <div key={exp.id} className="space-y-0.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5">
                <div className="font-bold text-slate-900">
                  <span>{exp.role || 'Role'}</span>
                  <span className="font-normal text-slate-600"> — {exp.company || 'Company'}</span>
                  {exp.location && <span className="font-normal text-slate-400 text-xs"> ({exp.location})</span>}
                </div>
                <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'Present'}
                </div>
              </div>

              {exp.bullets && exp.bullets.length > 0 && (
                <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                  {exp.bullets.map((b, bIdx) => {
                    if (!b.trim()) return null;
                    return (
                      <li key={bIdx} className="leading-snug">
                        {b.includes('[add metric]') ? (
                          <span>
                            {b.split('[add metric]').map((part, pIdx, arr) => (
                              <React.Fragment key={pIdx}>
                                {part}
                                {pIdx < arr.length - 1 && (
                                  <span className="bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-mono text-[10px] font-bold">
                                    [add metric]
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </span>
                        ) : (
                          b
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    if (!data.projects || data.projects.length === 0) return null;
    return (
      <div key="projects">
        {renderSectionHeader('Key Projects')}
        <div className="space-y-2.5">
          {data.projects.map((proj) => (
            <div key={proj.id} className="space-y-0.5">
              <div className="flex items-baseline justify-between gap-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span>{proj.title}</span>
                  {proj.techStack && (
                    <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {proj.techStack}
                    </span>
                  )}
                </div>
                {proj.link && (
                  <a
                    href={proj.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              {proj.bullets && proj.bullets.length > 0 && (
                <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                  {proj.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="leading-snug">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEducation = () => {
    if (!data.education || data.education.length === 0) return null;
    return (
      <div key="education">
        {renderSectionHeader('Education')}
        <div className="space-y-1.5">
          {data.education.map((edu) => {
            const deg = [edu.degree, edu.field].filter(Boolean).join(' in ');
            return (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-0.5">
                <div>
                  <span className="font-bold text-slate-900">{deg || 'Degree'}</span>
                  <span className="text-slate-600"> — {edu.school}</span>
                  {edu.gpaOrHonors && (
                    <span className="text-slate-500 text-xs ml-1.5 font-medium">({edu.gpaOrHonors})</span>
                  )}
                </div>
                {edu.graduationDate && (
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    {edu.graduationDate}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCertifications = () => {
    if (!data.certifications || data.certifications.length === 0) return null;
    return (
      <div key="certifications">
        {renderSectionHeader('Certifications')}
        <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
          {data.certifications.map((c) => (
            <li key={c.id}>
              <span className="font-semibold text-slate-900">{c.name}</span>
              {c.issuer && <span className="text-slate-600"> — {c.issuer}</span>}
              {c.date && <span className="text-slate-500 text-xs ml-1">({c.date})</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAchievements = () => {
    if (!data.achievements || data.achievements.length === 0) return null;
    return (
      <div key="achievements">
        {renderSectionHeader('Achievements & Awards')}
        <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
          {data.achievements.map((a) => (
            <li key={a.id}>
              <span className="font-bold text-slate-900">{a.title}: </span>
              <span className="text-slate-700">{a.description}</span>
              {a.date && <span className="text-slate-400 text-xs ml-1">({a.date})</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderLanguages = () => {
    if (!data.languages || data.languages.length === 0) return null;
    return (
      <div key="languages">
        {renderSectionHeader('Languages')}
        <div className="flex flex-wrap gap-2 text-slate-800">
          {data.languages.map((l) => (
            <span key={l.id} className="bg-slate-100 px-2 py-0.5 rounded text-xs">
              <strong>{l.language}:</strong> {l.proficiency}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Section Dispatcher
  const renderSectionByKey = (key: string) => {
    switch (key) {
      case 'summary':
        return renderSummary();
      case 'skills':
        return renderSkills();
      case 'experience':
        return renderExperience();
      case 'projects':
        return renderProjects();
      case 'education':
        return renderEducation();
      case 'certifications':
        return renderCertifications();
      case 'achievements':
        return renderAchievements();
      case 'languages':
        return renderLanguages();
      default:
        return null;
    }
  };

  // =========================================================================
  // TEMPLATE 4: SIDEBAR (TWO-COLUMN)
  // =========================================================================
  if (templateId === 'sidebar') {
    return (
      <div
        id="resume-printable-content"
        className={`bg-white text-slate-900 shadow-2xl rounded-sm max-w-[800px] mx-auto min-h-[1050px] overflow-hidden ${getFontClass()} flex flex-col md:flex-row`}
        style={{ color: '#0f172a' }}
      >
        {/* Left Sidebar */}
        <div
          className="w-full md:w-[32%] p-6 text-white space-y-6 flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {/* Candidate Name */}
          <div className="space-y-1">
            <h1 className="text-xl font-black leading-tight text-white">
              {data.contact.fullName || 'Candidate Name'}
            </h1>
            {data.contact.jobTitle && (
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                {data.contact.jobTitle}
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-2 text-xs text-white/90">
            <div className="font-bold uppercase tracking-wider text-[10px] text-white/70 border-b border-white/20 pb-1">
              Contact
            </div>
            {data.contact.email && (
              <div className="flex items-center gap-1.5 break-all">
                <Mail className="w-3 h-3 flex-shrink-0 text-white/80" />
                <span>{data.contact.email}</span>
              </div>
            )}
            {data.contact.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 flex-shrink-0 text-white/80" />
                <span>{data.contact.phone}</span>
              </div>
            )}
            {data.contact.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 flex-shrink-0 text-white/80" />
                <span>{data.contact.location}</span>
              </div>
            )}
            {data.contact.linkedin && (
              <div className="flex items-center gap-1.5 break-all">
                <Linkedin className="w-3 h-3 flex-shrink-0 text-white/80" />
                <span>{data.contact.linkedin.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
            {data.contact.github && (
              <div className="flex items-center gap-1.5 break-all">
                <Github className="w-3 h-3 flex-shrink-0 text-white/80" />
                <span>{data.contact.github.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
            {data.contact.website && (
              <div className="flex items-center gap-1.5 break-all">
                <Globe className="w-3 h-3 flex-shrink-0 text-white/80" />
                <span>{data.contact.website.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
          </div>

          {/* Sidebar Skills */}
          {data.skillCategories && data.skillCategories.length > 0 && (
            <div className="space-y-2 text-xs text-white/95">
              <div className="font-bold uppercase tracking-wider text-[10px] text-white/70 border-b border-white/20 pb-1">
                Skills
              </div>
              <div className="space-y-2">
                {data.skillCategories.map((cat) => (
                  <div key={cat.id} className="space-y-0.5">
                    <p className="font-bold text-[11px] text-white">{cat.categoryName}</p>
                    <p className="text-[11px] text-white/85 leading-snug">{cat.skills.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Education */}
          {data.education && data.education.length > 0 && (
            <div className="space-y-2 text-xs text-white/95">
              <div className="font-bold uppercase tracking-wider text-[10px] text-white/70 border-b border-white/20 pb-1">
                Education
              </div>
              <div className="space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="text-[11px]">
                    <p className="font-bold text-white">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                    <p className="text-white/80">{edu.school}</p>
                    {edu.graduationDate && <p className="text-white/60 text-[10px]">{edu.graduationDate}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Languages */}
          {data.languages && data.languages.length > 0 && (
            <div className="space-y-1.5 text-xs text-white/95">
              <div className="font-bold uppercase tracking-wider text-[10px] text-white/70 border-b border-white/20 pb-1">
                Languages
              </div>
              {data.languages.map((l) => (
                <div key={l.id} className="text-[11px] flex justify-between">
                  <span>{l.language}</span>
                  <span className="text-white/70">{l.proficiency}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Main Body */}
        <div className="flex-1 p-6 space-y-4">
          {renderSummary()}
          {renderExperience()}
          {renderProjects()}
          {renderCertifications()}
          {renderAchievements()}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SINGLE-COLUMN TEMPLATES: CLASSIC, MODERN, MINIMAL, COMPACT
  // =========================================================================
  return (
    <div
      id="resume-printable-content"
      className={`bg-white text-slate-900 shadow-2xl rounded-sm max-w-[800px] mx-auto min-h-[1050px] p-8 sm:p-10 ${getFontClass()} ${spacingClass}`}
      style={{ color: '#0f172a' }}
    >
      {/* MODERN TEMPLATE BANNER */}
      {templateId === 'modern' && (
        <div
          className="rounded-xl p-6 text-white mb-5 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #0f172a)` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {data.contact.fullName || 'Candidate Name'}
              </h1>
              {data.contact.jobTitle && (
                <p className="text-sm font-semibold text-white/90 mt-0.5">
                  {data.contact.jobTitle}
                </p>
              )}
            </div>
            <div className="text-xs text-white/85 text-right space-y-0.5">
              {data.contact.email && <div>{data.contact.email}</div>}
              {data.contact.phone && <div>{data.contact.phone}</div>}
              {data.contact.location && <div>{data.contact.location}</div>}
            </div>
          </div>
          {(data.contact.linkedin || data.contact.github || data.contact.website) && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/20 text-xs text-white/80">
              {data.contact.linkedin && <span>LinkedIn: {data.contact.linkedin.replace(/^https?:\/\//, '')}</span>}
              {data.contact.github && <span>GitHub: {data.contact.github.replace(/^https?:\/\//, '')}</span>}
              {data.contact.website && <span>Portfolio: {data.contact.website.replace(/^https?:\/\//, '')}</span>}
            </div>
          )}
        </div>
      )}

      {/* STANDARD HEADER (CLASSIC, MINIMAL, COMPACT) */}
      {templateId !== 'modern' && (
        <header className={`text-center pb-3 border-b ${templateId === 'minimal' ? 'border-slate-300' : 'border-slate-200'}`}>
          <h1
            className={`${templateId === 'compact' ? 'text-xl' : 'text-2xl'} font-black tracking-tight`}
            style={{ color: templateId === 'classic' ? accentColor : '#0f172a' }}
          >
            {data.contact.fullName || 'Candidate Name'}
          </h1>

          {data.contact.jobTitle && (
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
              {data.contact.jobTitle}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-xs text-slate-600 mt-2">
            {data.contact.location && <span>{data.contact.location}</span>}
            {data.contact.email && (
              <>
                <span>•</span>
                <a href={`mailto:${data.contact.email}`} className="hover:underline">{data.contact.email}</a>
              </>
            )}
            {data.contact.phone && (
              <>
                <span>•</span>
                <span>{data.contact.phone}</span>
              </>
            )}
            {data.contact.linkedin && (
              <>
                <span>•</span>
                <span className="text-indigo-600">{data.contact.linkedin.replace(/^https?:\/\//, '')}</span>
              </>
            )}
            {data.contact.github && (
              <>
                <span>•</span>
                <span>{data.contact.github.replace(/^https?:\/\//, '')}</span>
              </>
            )}
            {data.contact.website && (
              <>
                <span>•</span>
                <span>{data.contact.website.replace(/^https?:\/\//, '')}</span>
              </>
            )}
          </div>
        </header>
      )}

      {/* RENDER ALL SECTIONS IN SPECIFIED ORDER */}
      {order.map((key) => renderSectionByKey(key))}
    </div>
  );
};
