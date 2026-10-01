import React, { useState } from 'react';
import { ResumeVersion } from '../types';
import { X, GitCompare, Check, RotateCcw, ArrowRight } from 'lucide-react';

interface ResumeVersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ResumeVersion[];
  onRestore: (version: ResumeVersion) => void;
}

export const ResumeVersionCompareModal: React.FC<ResumeVersionCompareModalProps> = ({
  isOpen,
  onClose,
  versions,
  onRestore,
}) => {
  const [leftId, setLeftId] = useState<string>(versions[0]?.id || '');
  const [rightId, setRightId] = useState<string>(versions[1]?.id || versions[0]?.id || '');

  if (!isOpen) return null;

  const leftVersion = versions.find((v) => v.id === leftId) || versions[0];
  const rightVersion = versions.find((v) => v.id === rightId) || versions[1] || versions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] glass-panel bg-slate-900/95 border border-white/20 shadow-2xl p-6 rounded-2xl flex flex-col space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Compare Resume Versions</h3>
              <p className="text-xs text-slate-400">
                Inspect differences between tailored versions and restore either version with 1 click.
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

        {/* Version Pickers Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
          {/* Left Picker */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Version A (Base)
              </label>
              <select
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
                className="w-full bg-slate-950 text-white border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({new Date(v.updatedAt || v.createdAt || Date.now()).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (leftVersion) {
                  onRestore(leftVersion);
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap self-end"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore A</span>
            </button>
          </div>

          {/* Right Picker */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Version B (Comparison)
              </label>
              <select
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                className="w-full bg-slate-950 text-white border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({new Date(v.updatedAt || v.createdAt || Date.now()).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (rightVersion) {
                  onRestore(rightVersion);
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap self-end"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore B</span>
            </button>
          </div>
        </div>

        {/* Side-by-Side Content Comparison */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Summary Comparison */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1">
              Professional Summary
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-slate-300 leading-relaxed">
                {leftVersion?.data.summary || <span className="text-slate-500 italic">No summary provided</span>}
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-slate-300 leading-relaxed">
                {rightVersion?.data.summary || <span className="text-slate-500 italic">No summary provided</span>}
              </div>
            </div>
          </div>

          {/* Skills Comparison */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1">
              Skills Breakdown
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-slate-300 space-y-1.5">
                {leftVersion?.data.skillCategories.map((cat: any) => (
                  <div key={cat.id}>
                    <strong className="text-white">{cat.categoryName}: </strong>
                    <span>{cat.skills.join(', ')}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-slate-300 space-y-1.5">
                {rightVersion?.data.skillCategories.map((cat: any) => (
                  <div key={cat.id}>
                    <strong className="text-white">{cat.categoryName}: </strong>
                    <span>{cat.skills.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Experience Comparison */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1">
              Experience Bullets
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                {leftVersion?.data.experience.map((exp: any) => (
                  <div key={exp.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                    <div className="font-bold text-white">{exp.role} — {exp.company}</div>
                    <ul className="list-disc list-outside pl-4 space-y-1 text-slate-300 text-[11px]">
                      {exp.bullets.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {rightVersion?.data.experience.map((exp: any) => (
                  <div key={exp.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-1">
                    <div className="font-bold text-white">{exp.role} — {exp.company}</div>
                    <ul className="list-disc list-outside pl-4 space-y-1 text-slate-300 text-[11px]">
                      {exp.bullets.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
