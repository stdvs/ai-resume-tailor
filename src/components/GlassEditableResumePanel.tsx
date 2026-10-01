import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  RefreshCw,
  FileDown,
  Layers,
  Edit3,
  TrendingUp,
} from 'lucide-react';
import { ResumeTemplates } from './ResumeTemplates';
import { TemplateStyle, formatResumeWithTemplate } from '../lib/resumeTemplates';
import { generatePdfResume } from '../lib/pdfGenerator';

interface GlassEditableResumePanelProps {
  initialResumeText: string;
  jobDescription: string;
  matchingSkills: string[];
  onReanalyze: (updatedResumeText: string) => void;
  isReanalyzing?: boolean;
}

export const GlassEditableResumePanel: React.FC<GlassEditableResumePanelProps> = ({
  initialResumeText,
  jobDescription,
  matchingSkills,
  onReanalyze,
  isReanalyzing = false,
}) => {
  const [resumeContent, setResumeContent] = useState(initialResumeText);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>('modern');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Sync if initial text changes
  React.useEffect(() => {
    setResumeContent(initialResumeText);
  }, [initialResumeText]);

  // Apply template markup
  const formattedContent = React.useMemo(() => {
    return formatResumeWithTemplate(resumeContent, selectedTemplate, matchingSkills);
  }, [resumeContent, selectedTemplate, matchingSkills]);

  // Handle Full AI Resume Tailoring (second Gemini call)
  const handleAITailor = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: resumeContent,
          jobDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to tailor resume');
      }

      setResumeContent(data.tailoredResumeText);
    } catch (err) {
      console.error('Tailor error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext: 'txt' | 'md') => {
    const blob = new Blob([formattedContent], {
      type: ext === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tailored_resume_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      const doc = generatePdfResume(formattedContent, {
        templateId: selectedTemplate,
        matchingSkills,
      });
      doc.save(`tailored_resume_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const wordCount = resumeContent.split(/\s+/).filter(Boolean).length;

  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Tailored Resume Studio & Re-Score Loop
            </h3>
            <p className="text-xs text-slate-400">
              Edit in real-time, switch layout markup, and re-analyse to observe match score deltas
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Re-score Loop Button */}
          <button
            onClick={() => onReanalyze(resumeContent)}
            disabled={isReanalyzing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
            title="Re-run ATS scoring on your updated resume text to compute delta"
          >
            {isReanalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Re-analysing…</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Re-analyse Score</span>
              </>
            )}
          </button>

          {/* Regenerate with AI */}
          <button
            onClick={handleAITailor}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Rewriting…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Tailored Resume</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Text */}
          <button
            onClick={() => handleDownload('txt')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.txt</span>
          </button>

          {/* Download Markdown */}
          <button
            onClick={() => handleDownload('md')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.md</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            }}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Resume Templates Selector (Modern, Minimalist, Bold) */}
      <ResumeTemplates
        selectedTemplateId={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
      />

      {/* Editable Glass Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Editor ({wordCount} words)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active markup: {selectedTemplate.toUpperCase()}
          </span>
        </div>

        <textarea
          value={resumeContent}
          onChange={(e) => setResumeContent(e.target.value)}
          rows={15}
          className="w-full glass-input p-4 sm:p-5 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed resize-y selection:bg-indigo-500"
          placeholder="Paste or edit your tailored resume text here..."
        />
      </div>

      {/* Re-score Banner */}
      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
        <span className="text-slate-300">
          Make manual edits above, then click <strong className="text-emerald-400 font-bold">"Re-analyse Score"</strong> to observe your live ATS match delta badge!
        </span>
        <button
          onClick={() => onReanalyze(resumeContent)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          Check Updated Score &rarr;
        </button>
      </div>
    </div>
  );
};
