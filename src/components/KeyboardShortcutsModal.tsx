import React from 'react';
import { X, Command, Keyboard, Sparkles, Download, Play, Search, Eye, Share2 } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    {
      combo: [`${modKey}`, 'Enter'],
      description: 'Trigger AI Resume Match & Optimization Analysis',
      category: 'Core Workflow',
      icon: Play,
    },
    {
      combo: [`${modKey}`, 'S'],
      description: 'Quick Download Tailored Resume (.txt) & Save to History',
      category: 'Core Workflow',
      icon: Download,
    },
    {
      combo: [`${modKey}`, 'Shift', 'L'],
      description: 'Jump to LinkedIn Profile Optimizer format tab',
      category: 'Navigation',
      icon: Share2,
    },
    {
      combo: [`${modKey}`, 'Shift', 'D'],
      description: 'Load sample resume and tech job description instantly',
      category: 'Workflow',
      icon: Sparkles,
    },
    {
      combo: ['?'],
      description: 'Open this Keyboard Shortcuts cheat sheet',
      category: 'General',
      icon: Keyboard,
    },
    {
      combo: ['Esc'],
      description: 'Close active modals, drawers, or dialogs',
      category: 'General',
      icon: X,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Power-User Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500">Accelerate your resume tailoring workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-3.5 max-h-[65vh] overflow-y-auto">
          {shortcuts.map((shortcut, index) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {shortcut.description}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {shortcut.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {shortcut.combo.map((key, kIdx) => (
                    <kbd
                      key={kIdx}
                      className="px-2 py-1 text-xs font-mono font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs min-w-[24px] text-center"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-indigo-600" />
            <span>Shortcuts are globally active on any screen</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
