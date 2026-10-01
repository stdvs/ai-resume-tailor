import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  RefreshCw,
  X,
  Send,
  Sliders,
} from 'lucide-react';

interface GlassCoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  jobDescription: string;
}

export const GlassCoverLetterModal: React.FC<GlassCoverLetterModalProps> = ({
  isOpen,
  onClose,
  resumeText,
  jobDescription,
}) => {
  const [tone, setTone] = useState<'Professional' | 'Confident' | 'Friendly'>('Professional');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (selectedTone = tone) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          tone: selectedTone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate cover letter');
      }

      setCoverLetter(data.coverLetter);
    } catch (err: any) {
      console.error('Error generating cover letter:', err);
      setError(err?.message || 'Error creating cover letter. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], {
      type: format === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tailored_cover_letter_${tone.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const wordCount = coverLetter ? coverLetter.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel-static bg-slate-900/90 border border-white/20 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: 'var(--accent)' }}
            >
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                AI Tailored Cover Letter
              </h3>
              <p className="text-xs text-slate-400">
                Personalized pitch connecting your genuine achievements to role requirements
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tone Selector & Controls */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Tone:</span>
            {(['Professional', 'Confident', 'Friendly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTone(t);
                  if (coverLetter) {
                    handleGenerate(t);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  tone === t
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Crafting letter…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{coverLetter ? 'Regenerate Pitch' : 'Generate Cover Letter'}</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {!coverLetter && !isLoading && (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
              <p className="text-sm text-slate-300 font-medium">
                Ready to generate a tailored cover letter in a {tone} tone.
              </p>
              <button
                onClick={() => handleGenerate()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
                style={{ background: 'var(--accent)' }}
              >
                Generate Now with Gemini
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-16 space-y-3 animate-pulse">
              <Sparkles className="w-8 h-8 text-amber-300 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-sm font-semibold text-slate-200">
                Synthesizing personalized cover letter in {tone} voice…
              </p>
              <p className="text-xs text-slate-400">
                Bridging your verified qualifications with employer requirements
              </p>
            </div>
          )}

          {coverLetter && !isLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{wordCount} Words · {tone} Tone</span>
                <span>Click text to edit if needed</span>
              </div>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={12}
                className="w-full glass-input p-4 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed resize-y selection:bg-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {coverLetter && (
          <div className="p-4 sm:p-6 border-t border-white/10 bg-white/[0.04] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload('txt')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
              <button
                onClick={() => handleDownload('md')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
