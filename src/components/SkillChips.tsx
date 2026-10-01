import React from 'react';
import { Check, AlertCircle, Sparkles } from 'lucide-react';

interface SkillChipsProps {
  matchingSkills: string[];
  missingKeywords: string[];
}

export const SkillChips: React.FC<SkillChipsProps> = ({
  matchingSkills,
  missingKeywords,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Matching Skills Card (Green Chips) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col h-full">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Matching Skills & Qualifications
              </h3>
              <p className="text-xs text-slate-500">
                Detected across your resume & job requirements
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            {matchingSkills.length} matches
          </span>
        </div>

        {matchingSkills.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4">
            No direct keyword matches identified between the resume and target job.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {matchingSkills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/80 transition-colors hover:bg-emerald-100/70"
              >
                <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Missing Keywords Card (Red Chips ordered by importance) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col h-full">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Missing Keywords & Gaps
              </h3>
              <p className="text-xs text-slate-500">
                Ordered by importance to recruiter & ATS screening
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            {missingKeywords.length} priority gaps
          </span>
        </div>

        {missingKeywords.length === 0 ? (
          <p className="text-sm text-emerald-600 font-medium py-4">
            Outstanding! No critical job keywords are missing from your resume.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {missingKeywords.map((keyword, index) => {
              const isTopPriority = index < 3;
              return (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isTopPriority
                      ? 'bg-rose-50 text-rose-900 border-rose-300 font-semibold'
                      : 'bg-rose-50/60 text-rose-800 border-rose-200'
                  }`}
                  title={isTopPriority ? 'High priority ATS keyword' : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>{keyword}</span>
                  {isTopPriority && (
                    <span className="ml-0.5 text-[10px] uppercase tracking-wider px-1 py-0.2 rounded bg-rose-200 text-rose-900">
                      High
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
