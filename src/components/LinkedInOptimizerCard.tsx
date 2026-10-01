import React, { useState, useMemo } from 'react';
import {
  formatForLinkedIn,
  LinkedInFormattedContent,
} from '../lib/linkedInFormatter';
import {
  Copy,
  Check,
  Sparkles,
  Info,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';

interface LinkedInOptimizerCardProps {
  tailoredResumeText: string;
  matchingSkills: string[];
  missingKeywords: string[];
}

export const LinkedInOptimizerCard: React.FC<LinkedInOptimizerCardProps> = ({
  tailoredResumeText,
  matchingSkills,
  missingKeywords,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'about' | 'experience'>('about');
  const [copiedAbout, setCopiedAbout] = useState(false);
  const [copiedAllExp, setCopiedAllExp] = useState(false);
  const [copiedRoleIndex, setCopiedRoleIndex] = useState<number | null>(null);

  const formatted: LinkedInFormattedContent = useMemo(() => {
    return formatForLinkedIn(tailoredResumeText, matchingSkills, missingKeywords);
  }, [tailoredResumeText, matchingSkills, missingKeywords]);

  const handleCopyAbout = () => {
    navigator.clipboard.writeText(formatted.aboutSection);
    setCopiedAbout(true);
    setTimeout(() => setCopiedAbout(false), 2000);
  };

  const handleCopyAllExperience = () => {
    navigator.clipboard.writeText(formatted.experienceSection);
    setCopiedAllExp(true);
    setTimeout(() => setCopiedAllExp(false), 2000);
  };

  const handleCopySingleRole = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedRoleIndex(index);
    setTimeout(() => setCopiedRoleIndex(null), 2000);
  };

  const aboutCharCount = formatted.aboutSection.length;
  const isAboutCharOptimal = aboutCharCount <= 2600;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0077B5]/10 flex items-center justify-center text-[#0077B5]">
            <Share2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                LinkedIn Profile Optimizer
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/20">
                Recruiter SEO Ready
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tailored specifically for pasting into LinkedIn's "About" summary and "Experience" role descriptions
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('about')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'about'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#0077B5]" />
            <span>'About' Section</span>
          </button>
          <button
            onClick={() => setActiveSubTab('experience')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'experience'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-[#0077B5]" />
            <span>'Experience' Section</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LinkedIn "About" Section */}
      {activeSubTab === 'about' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                LinkedIn 'About' Summary
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  isAboutCharOptimal
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {aboutCharCount} / 2,600 characters
              </span>
            </div>

            <button
              onClick={handleCopyAbout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0077B5] text-white hover:bg-[#006097] transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
            >
              {copiedAbout ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied for LinkedIn!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy 'About' Section</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 relative">
            <pre className="text-xs sm:text-sm font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
              {formatted.aboutSection}
            </pre>
          </div>

          <div className="bg-sky-50/60 border border-sky-200/80 rounded-lg p-3 text-xs text-sky-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0077B5] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#0077B5]">LinkedIn Recruiter Tip: </span>
              The first 3 lines hook hiring managers before the "...see more" fold. The skills cloud below ensures your profile matches search queries for target technologies like {matchingSkills.slice(0, 4).join(', ') || 'React, TypeScript'}.
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LinkedIn "Experience" Section */}
      {activeSubTab === 'experience' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                LinkedIn 'Experience' Role Descriptions
              </span>
              <p className="text-[11px] text-slate-500">
                Copy individual roles directly into each LinkedIn position description box
              </p>
            </div>

            <button
              onClick={handleCopyAllExperience}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0077B5] text-white hover:bg-[#006097] transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
            >
              {copiedAllExp ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied All Roles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Experience</span>
                </>
              )}
            </button>
          </div>

          {formatted.roles.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <pre className="text-xs sm:text-sm font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                {formatted.experienceSection}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              {formatted.roles.map((role, idx) => {
                const isCopied = copiedRoleIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 relative space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="text-xs font-bold text-slate-900">{role.title}</span>
                      <button
                        onClick={() => handleCopySingleRole(role.content, idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                        title="Copy this role to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            <span>Copy Role</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="text-xs sm:text-sm font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {role.content}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-sky-50/60 border border-sky-200/80 rounded-lg p-3 text-xs text-sky-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0077B5] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#0077B5]">Clean LinkedIn Typography: </span>
              Uses standard unicode bullet points (<span className="font-semibold">•</span>) and appends a "Key Skills" line at the bottom of each role, satisfying LinkedIn recruiter search algorithms without visual clutter.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
