import React from 'react';
import {
  RESUME_TEMPLATES,
  TemplateStyle,
  ResumeTemplate,
} from '../lib/resumeTemplates';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  Terminal,
  FileCheck2,
  Award,
  Zap,
} from 'lucide-react';

interface ResumeTemplatesProps {
  selectedTemplateId: TemplateStyle;
  onSelectTemplate: (templateId: TemplateStyle) => void;
}

export const ResumeTemplates: React.FC<ResumeTemplatesProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const getTemplateIcon = (id: TemplateStyle) => {
    switch (id) {
      case 'modern':
        return Terminal;
      case 'minimalist':
        return FileCheck2;
      case 'bold':
        return Award;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Choose Resume Layout Style</span>
          </label>
          <p className="text-xs text-slate-500">
            Select one of 3 professional layout styles. Injects specialized formatting markup before rendering or exporting.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
          Active: {RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name || 'Modern'} Style
        </span>
      </div>

      {/* 3 Template Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {RESUME_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplateId === tmpl.id;
          const Icon = getTemplateIcon(tmpl.id);

          return (
            <button
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {tmpl.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {tmpl.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}
                </div>

                {/* Badge Tag */}
                <div className="mb-2.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      tmpl.id === 'modern'
                        ? 'bg-indigo-100 text-indigo-800'
                        : tmpl.id === 'minimalist'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {tmpl.badge}
                  </span>
                </div>

                {/* Layout Visual Mini-Preview */}
                <div
                  className={`p-2.5 rounded-lg border text-[10px] font-mono leading-tight mb-3 transition-colors ${
                    isSelected
                      ? 'bg-white border-indigo-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {tmpl.id === 'modern' && (
                    <div className="space-y-1">
                      <div className="font-bold text-indigo-700">ALEX CHEN | DEV</div>
                      <div className="text-slate-400">━━━━━━━━━━━━━━━━━━━━━━━</div>
                      <div className="text-[9px] text-slate-500 font-bold">## CORE TECHNICAL STACK</div>
                      <div className="flex gap-1 text-[9px] text-indigo-600">
                        <span>[ React ]</span>
                        <span>[ TypeScript ]</span>
                      </div>
                      <div className="text-slate-600">  • Engineered web apps...</div>
                    </div>
                  )}

                  {tmpl.id === 'minimalist' && (
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800">ALEX CHEN</div>
                      <div className="text-slate-300">───────────────────────</div>
                      <div className="text-[9px] font-bold text-slate-700">EXPERIENCE</div>
                      <div className="text-slate-600">- Developed scalable React app</div>
                      <div className="text-[9px] text-slate-500">SKILLS: React, TypeScript, Node</div>
                    </div>
                  )}

                  {tmpl.id === 'bold' && (
                    <div className="space-y-1">
                      <div className="text-slate-400 font-bold">═══════════════════════</div>
                      <div className="font-black text-slate-900">  ALEX CHEN | LEAD</div>
                      <div className="text-slate-400 font-bold">═══════════════════════</div>
                      <div className="text-[9px] font-bold text-slate-900">■ EXECUTIVE EXPERIENCE</div>
                      <div className="text-[9px] font-bold text-slate-700">&gt;&gt;&gt; SENIOR ENGINEER &lt;&lt;&lt;</div>
                      <div className="text-slate-800">• Spearheaded 40% growth...</div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-snug">
                  {tmpl.description}
                </p>
              </div>

              {/* Best For footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Target Fit:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={tmpl.bestFor}>
                  {tmpl.bestFor.split(',')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
