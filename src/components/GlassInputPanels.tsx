import React from 'react';
import {
  FileText,
  Briefcase,
  Upload,
  Type as TypeIcon,
  Sparkles,
  RefreshCw,
  ArrowRight,
  X,
  FileCheck2,
} from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';
import { UploadedFileInfo } from '../types';

interface GlassInputPanelsProps {
  resumeMode: 'upload' | 'text';
  setResumeMode: (mode: 'upload' | 'text') => void;
  resumeText: string;
  setResumeText: (text: string) => void;
  uploadedFile: UploadedFileInfo | null;
  onFileExtracted: (file: UploadedFileInfo) => void;
  onFileRemoved: () => void;
  isExtractingFile: boolean;
  setIsExtractingFile: (val: boolean) => void;
  jobDescription: string;
  setJobDescription: (text: string) => void;
  onLoadSample: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onError: (msg: string) => void;
}

export const GlassInputPanels: React.FC<GlassInputPanelsProps> = ({
  resumeMode,
  setResumeMode,
  resumeText,
  setResumeText,
  uploadedFile,
  onFileExtracted,
  onFileRemoved,
  isExtractingFile,
  setIsExtractingFile,
  jobDescription,
  setJobDescription,
  onLoadSample,
  onAnalyze,
  isAnalyzing,
  onError,
}) => {
  const resumeWordCount = resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0;
  const jdWordCount = jobDescription ? jobDescription.split(/\s+/).filter(Boolean).length : 0;
  const isInputsReady = Boolean(resumeText.trim() && jobDescription.trim());

  return (
    <section className="space-y-8">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-md text-xs font-semibold text-white/90 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>Dynamic Glassmorphism ATS Engine</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
          Tailor your resume to any job in{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--accent), var(--accent-2), #38BDF8)',
            }}
          >
            seconds
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Benchmark qualifications against applicant tracking systems, reveal hidden keyword gaps, and rewrite achievements with quantifiable recruiter impact.
        </p>
      </div>

      {/* Two Glass Input Panels Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: RESUME (Upload or Paste) */}
        <div className="glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div>
            {/* Header with Mode Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ background: 'var(--accent)' }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Candidate Resume
                  </h3>
                  <p className="text-xs text-slate-400">
                    PDF, DOCX, TXT or pasted plain text
                  </p>
                </div>
              </div>

              {/* Upload vs Paste Toggle */}
              <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15">
                <button
                  type="button"
                  onClick={() => setResumeMode('upload')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    resumeMode === 'upload'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResumeMode('text')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    resumeMode === 'text'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <TypeIcon className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              </div>
            </div>

            {/* Resume Upload / Text Area */}
            <div className="mt-4">
              {resumeMode === 'upload' ? (
                <div className="space-y-3">
                  <FileUploadZone
                    uploadedFile={uploadedFile}
                    onFileExtracted={(file) => {
                      onFileExtracted(file);
                      setResumeText(file.extractedText);
                    }}
                    onFileRemoved={() => {
                      onFileRemoved();
                      setResumeText('');
                    }}
                    isExtracting={isExtractingFile}
                    setIsExtracting={setIsExtractingFile}
                    onError={onError}
                  />

                  {resumeText && (
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
                      <span className="font-mono">{resumeWordCount} words parsed</span>
                      <button
                        onClick={() => setResumeMode('text')}
                        className="text-cyan-300 font-bold hover:underline cursor-pointer"
                      >
                        Inspect extracted text &rarr;
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={12}
                    placeholder="Paste your raw resume text here (Summary, Skills, Work Experience, Education)..."
                    className="w-full glass-input p-4 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed resize-y selection:bg-indigo-500"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">{resumeWordCount} words</span>
                    <span>Supports all standard resume formats</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL 2: JOB DESCRIPTION */}
        <div className="glass-panel p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div>
            {/* Header with Load Sample Button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ background: 'var(--accent-2)' }}
                >
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Target Job Description
                  </h3>
                  <p className="text-xs text-slate-400">
                    Paste the full job posting, responsibilities & requirements
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 transition-all cursor-pointer shadow-xs"
                title="Fill with high-quality sample data"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Load Sample</span>
              </button>
            </div>

            {/* Textarea */}
            <div className="mt-4 space-y-2">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={12}
                placeholder="Paste the target job description here (e.g. Senior Frontend Engineer, responsibilities, requirements, qualifications)..."
                className="w-full glass-input p-4 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed resize-y selection:bg-indigo-500"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{jdWordCount} words</span>
                <span>The more detailed the posting, the higher the keyword accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Glowing "Analyse Resume" Button */}
      <div className="flex flex-col items-center justify-center pt-2 pb-4">
        <button
          onClick={onAnalyze}
          disabled={!isInputsReady || isAnalyzing || isExtractingFile}
          className={`relative overflow-hidden w-full sm:w-auto min-w-[320px] px-10 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
            !isInputsReady || isAnalyzing || isExtractingFile
              ? 'bg-white/10 text-white/40 border border-white/10 cursor-not-allowed shadow-none'
              : 'text-white border border-white/30 hover:scale-[1.02] active:scale-[0.98] shimmer-active'
          }`}
          style={{
            background: isInputsReady && !isAnalyzing
              ? `linear-gradient(135deg, var(--accent), var(--accent-2))`
              : undefined,
            boxShadow: isInputsReady && !isAnalyzing
              ? `0 0 35px var(--glow), 0 10px 25px -5px rgba(0,0,0,0.5)`
              : undefined,
          }}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analysing & Simulating ATS…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Analyse Resume & Score ATS Match</span>
              <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/20 border border-white/30 text-white ml-1">
                Ctrl+Enter
              </kbd>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        {!isInputsReady && !isAnalyzing && (
          <p className="text-center text-xs text-slate-400 mt-2.5">
            Add both your resume and job description above to unlock the analysis
          </p>
        )}
      </div>
    </section>
  );
};
