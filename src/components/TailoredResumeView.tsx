import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  FileText,
  CheckCircle,
  Sparkles,
  Info,
  FileDown,
  Loader2,
} from 'lucide-react';
import {
  RESUME_TEMPLATES,
  formatResumeWithTemplate,
  TemplateStyle,
} from '../lib/resumeTemplates';
import { generatePdfResume } from '../lib/pdfGenerator';
import { ResumeTemplates } from './ResumeTemplates';

interface TailoredResumeViewProps {
  tailoredText: string;
  matchingSkills?: string[];
}

export const TailoredResumeView: React.FC<TailoredResumeViewProps> = ({
  tailoredText,
  matchingSkills = [],
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateStyle>('modern');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Active template metadata
  const selectedTemplate = useMemo(() => {
    return RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId) || RESUME_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Format tailored text with chosen template in real time
  const formattedResumeText = useMemo(() => {
    return formatResumeWithTemplate(tailoredText, selectedTemplateId, matchingSkills);
  }, [tailoredText, selectedTemplateId, matchingSkills]);

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([formattedResumeText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const sanitizedTemplateName = selectedTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    element.download = `tailored_resume_${sanitizedTemplateName}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = generatePdfResume(formattedResumeText, {
        templateId: selectedTemplateId,
        matchingSkills,
      });
      const sanitizedTemplateName = selectedTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      doc.save(`tailored_resume_${sanitizedTemplateName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF document:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedResumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <FileText className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Tailored Resume & Export Studio
            </h3>
            <p className="text-xs text-slate-500">
              Choose from 3 professional layout styles and download as a formatted PDF or clean TXT
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            title="Copy formatted resume text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            title="Download plain text resume (Ctrl+S)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download .txt</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold bg-white border border-slate-300 px-1 py-0.2 rounded text-slate-500">
              Ctrl+S
            </kbd>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Generate and download formatted PDF document"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resume Templates Component (Modern, Minimalist, Bold) */}
      <ResumeTemplates
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
      />

      {/* Selected Template Details Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-slate-700">
            <span className="font-bold text-slate-900">{selectedTemplate.name} Style: </span>
            {selectedTemplate.description}
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 self-start sm:self-auto flex-shrink-0">
          {selectedTemplate.atsCompatibility}
        </span>
      </div>

      {/* Formatted Text Preview */}
      <div className="relative space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">Formatted Markup Preview ({selectedTemplate.name})</span>
          <span className="text-[11px]">Ready for export & ATS submission</span>
        </div>
        <pre className="p-4 sm:p-5 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[520px] border border-slate-800 selection:bg-indigo-500 selection:text-white">
          {formattedResumeText}
        </pre>
      </div>

      {/* Strict Compliance Footer */}
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        Strict ATS compliance: No invented metrics or fictitious roles were injected. Replace any flagged{' '}
        <span className="font-semibold text-slate-700">[add metric]</span> tags with your genuine quantitative records.
      </p>
    </div>
  );
};
