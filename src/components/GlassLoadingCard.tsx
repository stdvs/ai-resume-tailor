import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Cpu, Search, CheckCircle2, ShieldCheck } from 'lucide-react';

const STATUS_MESSAGES = [
  'Reading your resume and extracting skills taxonomy…',
  'Parsing targeted job description for primary requirements…',
  'Matching keywords and scoring semantic ATS alignment…',
  'Simulating enterprise parser compatibility algorithms…',
  'Synthesizing recruiter-grade bullet rewrites and action items…',
];

export const GlassLoadingCard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 relative overflow-hidden animate-fade-slide-up">
      {/* Background ambient glow */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-60 transition-all duration-1000"
        style={{ backgroundColor: 'var(--accent)' }}
      />

      {/* Animated Center Icon */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white relative z-10 shadow-2xl animate-pulse"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            boxShadow: '0 0 35px var(--glow)',
          }}
        >
          <Cpu className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div
          className="absolute inset-0 rounded-2xl animate-ping opacity-30"
          style={{ backgroundColor: 'var(--accent)' }}
        />
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
        Evaluating Resume & ATS Match
      </h3>

      {/* Rotating Status Message */}
      <div className="h-10 flex items-center justify-center mb-6">
        <p className="text-sm font-semibold text-slate-200 transition-all duration-500 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-300" style={{ animationDuration: '4s' }} />
          <span>{STATUS_MESSAGES[currentStep]}</span>
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
        {STATUS_MESSAGES.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentStep
                ? 'w-8 bg-white shadow-xs'
                : idx < currentStep
                ? 'w-3 bg-white/60'
                : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Safety notice */}
      <p className="text-[11px] text-slate-400 mt-6 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Strict recruiter compliance: Authentic rephrasing with zero fabricated credentials.
      </p>
    </div>
  );
};
