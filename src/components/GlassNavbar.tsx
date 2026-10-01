import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Palette,
  Sun,
  Moon,
  Keyboard,
  History,
  LogIn,
  LogOut,
  ChevronDown,
  Check,
  Play,
  Pause,
  Droplets,
} from 'lucide-react';
import { User } from '../lib/firebase';
import { ThemePreset, ThemeConfig } from '../types';
import { THEME_PRESETS } from '../lib/themeSystem';
import { LiquidRendererMode, LiquidIntensityLevel } from './LiquidBackground';

interface GlassNavbarProps {
  currentTheme: ThemePreset;
  activeThemeConfig: ThemeConfig;
  onSelectTheme: (preset: ThemePreset) => void;
  fluidIntensity?: LiquidIntensityLevel;
  onSelectFluidIntensity?: (level: LiquidIntensityLevel) => void;
  backgroundMode?: LiquidRendererMode;
  onSelectBackgroundMode?: (mode: LiquidRendererMode) => void;
  isBackgroundPaused: boolean;
  onToggleBackgroundPause: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenShortcuts: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  user: User | null;
  activeView?: 'dashboard' | 'builder';
  onViewChange?: (view: 'dashboard' | 'builder') => void;
}

export const GlassNavbar: React.FC<GlassNavbarProps> = ({
  currentTheme,
  activeThemeConfig,
  onSelectTheme,
  fluidIntensity = 'normal',
  onSelectFluidIntensity,
  isBackgroundPaused,
  onToggleBackgroundPause,
  isDark,
  onToggleDark,
  onOpenShortcuts,
  onOpenHistory,
  onOpenAuth,
  onSignOut,
  user,
  activeView = 'dashboard',
  onViewChange,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-500">
      <div className="max-w-7xl mx-auto rounded-2xl border border-white/18 bg-white/[0.08] backdrop-blur-[22px] saturate-[170%] shadow-lg shadow-black/25 px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md relative overflow-hidden transition-all duration-700"
            style={{
              background: `linear-gradient(135deg, var(--accent), var(--accent-2))`,
              boxShadow: `0 0 20px var(--glow)`,
            }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 drop-shadow-xs">
                Resume Match <span style={{ color: 'var(--accent)' }}>AI</span>
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20 bg-white/10 text-white/90 shadow-2xs">
                ATS Simulator
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Recruiter-grade alignment & ATS simulation powered by Gemini
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (Match Dashboard vs Resume Builder) */}
        {onViewChange && (
          <div className="hidden lg:flex items-center p-1 rounded-xl bg-white/10 border border-white/15 shadow-inner">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Match & Analysis
            </button>
            <button
              onClick={() => onViewChange('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'builder'
                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Resume Builder</span>
              <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-400 text-slate-950">
                New
              </span>
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Liquid Animation Play / Pause Toggle Button */}
          <button
            onClick={onToggleBackgroundPause}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white/90 hover:text-white transition-all cursor-pointer shadow-2xs hover:border-white/30"
            title={isBackgroundPaused ? 'Resume liquid animation' : 'Pause liquid animation'}
            aria-label={isBackgroundPaused ? 'Resume liquid animation' : 'Pause liquid animation'}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-300" />
            {isBackgroundPaused ? (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-cyan-300" />
            )}
            <span className="hidden sm:inline text-xs font-semibold">
              {isBackgroundPaused ? 'Play' : 'Pause'}
            </span>
          </button>

          {/* Theme Preset Selector Dropdown */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/90 transition-all cursor-pointer shadow-2xs hover:border-white/30"
              title="Change theme color palette"
              aria-label="Theme menu"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span className="hidden sm:inline">Theme:</span>
              <span className="font-bold text-white capitalize">{currentTheme}</span>
              <ChevronDown className="w-3 h-3 text-white/60 ml-0.5" />
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Color Presets
                </div>
                {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => {
                  const preset = THEME_PRESETS[key];
                  const isSelected = currentTheme === key;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        onSelectTheme(key);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-white/15 text-white font-bold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white/30"
                          style={{
                            background: `linear-gradient(135deg, ${preset.accent}, ${preset.accent2})`,
                          }}
                        />
                        <span>{preset.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Liquid Intensity Control: Calm / Normal / Lively */}
          <div
            className="hidden sm:flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs text-slate-300 shadow-2xs"
            title="Liquid Intensity: changes blob speed and organic wobble"
          >
            <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-cyan-300">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Liquid:</span>
            </div>
            {(['calm', 'normal', 'lively'] as LiquidIntensityLevel[]).map((level) => {
              const isSelected = (fluidIntensity || 'normal') === level;
              return (
                <button
                  key={level}
                  onClick={() => onSelectFluidIntensity?.(level)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium capitalize transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/25 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Set liquid intensity to ${level}`}
                >
                  {level}
                </button>
              );
            })}
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer shadow-2xs"
            title={isDark ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme brightness"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-cyan-300" />}
          </button>

          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer shadow-2xs"
            title="Keyboard Shortcuts (Ctrl+K or ?)"
            aria-label="Open keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <kbd className="hidden md:inline-block text-[10px] font-mono font-bold bg-white/15 border border-white/20 px-1 rounded text-white/80">
              ?
            </kbd>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/90 transition-all cursor-pointer shadow-2xs"
            title="View past resume analyses"
            aria-label="Open analysis history"
          >
            <History className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/15">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs border border-white/20"
                style={{ background: 'var(--accent)' }}
                title={user.email || 'User Account'}
              >
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, var(--accent), var(--accent-2))`,
                boxShadow: `0 0 15px var(--glow)`,
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
