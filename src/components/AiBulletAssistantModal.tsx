import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Scissors,
  TrendingUp,
  Target,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface AiBulletAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  jobDescription?: string;
  onApply: (newText: string) => void;
  initialAction?: 'improve' | 'add_action_verb' | 'shorten' | 'make_impactful' | 'tailor';
}

export const AiBulletAssistantModal: React.FC<AiBulletAssistantModalProps> = ({
  isOpen,
  onClose,
  originalText,
  jobDescription,
  onApply,
  initialAction = 'improve',
}) => {
  const [selectedAction, setSelectedAction] = useState<
    'improve' | 'add_action_verb' | 'shorten' | 'make_impactful' | 'tailor'
  >(initialAction);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'improve',
      label: 'Improve',
      icon: Sparkles,
      desc: 'Sharpen phrasing for maximum recruiter clarity',
    },
    {
      id: 'add_action_verb',
      label: 'Action Verb',
      icon: Zap,
      desc: 'Start with an authoritative action verb',
    },
    {
      id: 'shorten',
      label: 'Shorten',
      icon: Scissors,
      desc: 'Cut filler words to under 20 words',
    },
    {
      id: 'make_impactful',
      label: 'More Impactful',
      icon: TrendingUp,
      desc: 'XYZ format with [add metric] placeholders',
    },
    {
      id: 'tailor',
      label: 'Tailor to Job',
      icon: Target,
      desc: 'Align naturally with job description keywords',
    },
  ];

  const handleGenerate = async (actionToRun = selectedAction) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/builder/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionToRun,
          text: originalText,
          jobDescription: jobDescription || '',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || 'Failed to generate AI rewrite');
      }

      setSuggestion(json.data.suggestion);
      setReason(json.data.reason);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onApply(suggestion);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-panel bg-slate-900/95 border border-white/20 shadow-2xl p-6 space-y-5 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Bullet Writing Assistant</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                <span>Strict rule: Never invents metrics or false experience</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {actions.map((act) => {
            const Icon = act.icon;
            const isSelected = selectedAction === act.id;
            return (
              <button
                key={act.id}
                onClick={() => {
                  setSelectedAction(act.id as any);
                  handleGenerate(act.id as any);
                }}
                disabled={loading}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-sm'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{act.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{act.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Original Bullet */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Original Bullet
          </label>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300 leading-relaxed">
            {originalText}
          </div>
        </div>

        {/* AI Suggestion Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Rewrite Proposal</span>
            </label>
            {!suggestion && !loading && (
              <button
                onClick={() => handleGenerate()}
                className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
              >
                Generate Now &rarr;
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col items-center justify-center gap-2 text-cyan-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-xs font-medium">Rephrasing with precision action verbs...</p>
            </div>
          ) : suggestion ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-400/40 text-white space-y-2 shadow-lg">
              <p className="text-sm font-medium leading-relaxed">{suggestion}</p>
              {reason && (
                <div className="text-[11px] text-cyan-200/80 pt-1.5 border-t border-cyan-500/20 flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-cyan-400" />
                  <span>{reason}</span>
                </div>
              )}
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/20 text-center text-xs text-slate-400">
              Select an action above to see an instant AI rewrite
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel / Reject
          </button>
          <button
            onClick={handleAccept}
            disabled={!suggestion || loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Rewrite</span>
          </button>
        </div>
      </div>
    </div>
  );
};
