import React, { useEffect, useState, useMemo } from 'react';
import { ThemePreset, ThemeConfig } from '../types';
import { getWaterPalette, WaterPalette } from '../lib/themeSystem';

export type BackgroundMode = 'video' | 'procedural' | 'static';

export interface WaterBackgroundProps {
  mode?: BackgroundMode;
  onModeChange?: (mode: BackgroundMode) => void;
  isPaused?: boolean;
  colors?: ThemeConfig;
  isDark?: boolean;
  hasAnalyzed?: boolean;
  matchScore?: number | null;
  themePreset?: ThemePreset;
  intensity?: number;
}

// Deterministic set of calm rising bubbles so hydration is seamless
const BUBBLE_PRESETS = [
  { id: 1, left: 6, size: 14, duration: 18, delay: 0.5, sway: 16 },
  { id: 2, left: 14, size: 8, duration: 24, delay: 4.2, sway: -14 },
  { id: 3, left: 21, size: 18, duration: 16, delay: 8.5, sway: 20 },
  { id: 4, left: 29, size: 10, duration: 22, delay: 2.1, sway: -12 },
  { id: 5, left: 37, size: 22, duration: 19, delay: 11.0, sway: 24 },
  { id: 6, left: 45, size: 9, duration: 25, delay: 6.8, sway: -16 },
  { id: 7, left: 52, size: 16, duration: 17, delay: 1.5, sway: 18 },
  { id: 8, left: 60, size: 12, duration: 21, delay: 9.3, sway: -22 },
  { id: 9, left: 68, size: 20, duration: 18, delay: 13.5, sway: 15 },
  { id: 10, left: 75, size: 11, duration: 23, delay: 5.0, sway: -18 },
  { id: 11, left: 82, size: 17, duration: 19, delay: 10.2, sway: 20 },
  { id: 12, left: 91, size: 9, duration: 26, delay: 3.4, sway: -15 },
  { id: 13, left: 96, size: 15, duration: 20, delay: 7.7, sway: 14 },
];

export const WaterBackground: React.FC<WaterBackgroundProps> = ({
  isPaused = false,
  isDark = true,
  hasAnalyzed = false,
  matchScore = null,
  themePreset = 'auto',
}) => {
  // Track tab visibility to pause animations when hidden
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? document.hidden : false;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute active water palette
  const waterPalette: WaterPalette = useMemo(() => {
    return getWaterPalette(themePreset, matchScore, hasAnalyzed);
  }, [themePreset, matchScore, hasAnalyzed]);

  // Synchronize dynamic CSS custom properties on document root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--water-deep', waterPalette.deep);
    root.style.setProperty('--water-mid', waterPalette.mid);
    root.style.setProperty('--water-surface', waterPalette.surface);
    root.style.setProperty('--water-caustic', waterPalette.caustic);
    root.style.setProperty('--water-shimmer', waterPalette.shimmer);
    root.style.setProperty('--water-glow', waterPalette.glow);
    root.style.setProperty('--water-border', waterPalette.border);
  }, [waterPalette]);

  // Effective pause state
  const effectivelyPaused = isPaused || isTabHidden;

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none transition-colors duration-1500 ${
        effectivelyPaused ? 'water-motion-paused' : ''
      }`}
      style={{
        zIndex: -1,
        backgroundColor: isDark ? '#070C18' : '#0B1528',
      }}
      aria-hidden="true"
    >
      {/* 
        ========================================================================
        1. BASE WATER FLUID COLUMN & COLOR GRADIENT
        Before analysis: 40-second ocean drift through deep blue → turquoise → teal → violet → blue.
        After analysis or on manual preset: Smooth 1.5s transition to score / preset water.
        ========================================================================
      */}
      <div
        className={`absolute inset-0 transition-all duration-1500 ${
          waterPalette.isDrifting && !prefersReducedMotion ? 'animate-ocean-drift-40s' : ''
        }`}
        style={{
          background: `radial-gradient(ellipse 140% 100% at 50% 0%, var(--water-surface) 0%, var(--water-mid) 45%, var(--water-deep) 100%)`,
          opacity: 0.92,
        }}
      />

      {/* Static Water Mode for prefers-reduced-motion */}
      {prefersReducedMotion ? (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, var(--water-surface) 0%, var(--water-mid) 50%, var(--water-deep) 100%)`,
            opacity: 0.85,
          }}
        />
      ) : (
        <>
          {/* 
            ====================================================================
            2. SUNLIGHT CAUSTIC REFRACTIONS & LIGHT BEAMS
            Soft sunlight rays refracting down through the water column
            ====================================================================
          */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 mix-blend-screen">
            {/* Swaying sunlight light beams */}
            <div
              className="absolute -top-1/4 -right-1/4 w-[160%] h-[150%] animate-sunlight-rays"
              style={{
                background: `conic-gradient(from 210deg at 75% 10%, 
                  transparent 0deg, 
                  var(--water-shimmer) 15deg, 
                  transparent 30deg, 
                  var(--water-caustic) 55deg, 
                  transparent 75deg, 
                  var(--water-shimmer) 95deg, 
                  transparent 125deg)`,
                filter: 'blur(35px)',
              }}
            />

            {/* Organic light caustics layer 1 */}
            <div
              className="absolute inset-0 animate-caustics-1 transition-colors duration-1500"
              style={{
                backgroundImage: `radial-gradient(circle 380px at 20% 30%, var(--water-caustic) 0%, transparent 70%),
                                  radial-gradient(circle 440px at 70% 20%, var(--water-shimmer) 0%, transparent 65%),
                                  radial-gradient(circle 320px at 85% 65%, var(--water-caustic) 0%, transparent 60%),
                                  radial-gradient(circle 360px at 35% 80%, var(--water-shimmer) 0%, transparent 65%)`,
                opacity: 0.45,
                filter: 'blur(28px)',
              }}
            />

            {/* Counter-swaying caustics layer 2 */}
            <div
              className="absolute inset-0 animate-caustics-2 transition-colors duration-1500"
              style={{
                backgroundImage: `radial-gradient(circle 420px at 50% 15%, var(--water-shimmer) 0%, transparent 65%),
                                  radial-gradient(circle 360px at 15% 70%, var(--water-caustic) 0%, transparent 60%),
                                  radial-gradient(circle 480px at 80% 85%, var(--water-shimmer) 0%, transparent 70%)`,
                opacity: 0.35,
                filter: 'blur(32px)',
              }}
            />
          </div>

          {/* 
            ====================================================================
            3. LAYERED MOVING WAVES ACROSS SCREEN
            4 smooth vector wave layers at varying speeds, heights, and opacities.
            Paths use 2 identical repeating cycles (0..1200 and 1200..2400)
            animating translate3d from 0 to -50% for 100% seamless infinite loops.
            ====================================================================
          */}

          {/* SVG Definitions for shared wave gradients */}
          <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
            <defs>
              <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--water-mid)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="var(--water-deep)" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--water-surface)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--water-mid)" stopOpacity="0.90" />
              </linearGradient>
              <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--water-caustic)" stopOpacity="0.65" />
                <stop offset="40%" stopColor="var(--water-surface)" stopOpacity="0.80" />
                <stop offset="100%" stopColor="var(--water-mid)" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="wave-grad-4" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--water-shimmer)" stopOpacity="0.75" />
                <stop offset="25%" stopColor="var(--water-caustic)" stopOpacity="0.65" />
                <stop offset="100%" stopColor="var(--water-surface)" stopOpacity="0.85" />
              </linearGradient>
            </defs>
          </svg>

          {/* Wave Layer 1: Deep ocean swell (Bottom, slow 34s, large rolling amplitude) */}
          <div
            className="absolute bottom-0 left-0 w-[200%] h-[72vh] pointer-events-none overflow-hidden transition-all duration-1500"
            style={{ opacity: 0.38 }}
          >
            <svg
              className="w-full h-full animate-wave-1 transition-all duration-1500"
              viewBox="0 0 2400 360"
              preserveAspectRatio="none"
              fill="url(#wave-grad-1)"
            >
              <path d="M 0 140 C 300 80, 600 200, 900 110 C 1050 65, 1150 110, 1200 140 C 1500 80, 1800 200, 2100 110 C 2250 65, 2350 110, 2400 140 L 2400 360 L 0 360 Z" />
            </svg>
          </div>

          {/* Wave Layer 2: Mid-current counter wave (Medium 26s, reverse motion) */}
          <div
            className="absolute bottom-0 left-0 w-[200%] h-[58vh] pointer-events-none overflow-hidden transition-all duration-1500"
            style={{ opacity: 0.46 }}
          >
            <svg
              className="w-full h-full animate-wave-2 transition-all duration-1500"
              viewBox="0 0 2400 360"
              preserveAspectRatio="none"
              fill="url(#wave-grad-2)"
            >
              <path d="M 0 120 C 250 180, 550 60, 850 150 C 1020 200, 1120 160, 1200 120 C 1450 180, 1750 60, 2050 150 C 2220 200, 2320 160, 2400 120 L 2400 360 L 0 360 Z" />
            </svg>
          </div>

          {/* Wave Layer 3: Surface swell wave (Dynamic 19s rolling flow) */}
          <div
            className="absolute bottom-0 left-0 w-[200%] h-[44vh] pointer-events-none overflow-hidden transition-all duration-1500"
            style={{ opacity: 0.54 }}
          >
            <svg
              className="w-full h-full animate-wave-3 transition-all duration-1500"
              viewBox="0 0 2400 360"
              preserveAspectRatio="none"
              fill="url(#wave-grad-3)"
            >
              <path d="M 0 100 C 200 40, 450 160, 700 80 C 950 0, 1100 140, 1200 100 C 1400 40, 1650 160, 1900 80 C 2150 0, 2300 140, 2400 100 L 2400 360 L 0 360 Z" />
            </svg>
          </div>

          {/* Wave Layer 4: Upper surface crest & light shimmer ripple (Faster 13s, luminous edge) */}
          <div
            className="absolute bottom-0 left-0 w-[200%] h-[32vh] pointer-events-none overflow-hidden transition-all duration-1500"
            style={{ opacity: 0.68 }}
          >
            <svg
              className="w-full h-full animate-wave-4 transition-all duration-1500"
              viewBox="0 0 2400 360"
              preserveAspectRatio="none"
              fill="url(#wave-grad-4)"
              stroke="var(--water-shimmer)"
              strokeWidth="1.8"
            >
              <path d="M 0 90 C 180 50, 400 130, 600 70 C 800 10, 1000 130, 1200 90 C 1380 50, 1600 130, 1800 70 C 2000 10, 2200 130, 2400 90 L 2400 360 L 0 360 Z" />
            </svg>
          </div>

          {/* 
            ====================================================================
            4. SLOW-RISING WATER BUBBLES
            Translucent glassy bubbles gently rising from the bottom with subtle sine sway
            ====================================================================
          */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {BUBBLE_PRESETS.map((bubble) => (
              <div
                key={bubble.id}
                className="absolute rounded-full animate-bubble-rise"
                style={
                  {
                    left: `${bubble.left}%`,
                    width: `${bubble.size}px`,
                    height: `${bubble.size}px`,
                    '--bubble-duration': `${bubble.duration}s`,
                    '--bubble-delay': `${bubble.delay}s`,
                    '--bubble-sway': `${bubble.sway}px`,
                    background:
                      'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.20) 35%, rgba(255, 255, 255, 0.04) 75%)',
                    border: '1px solid rgba(255, 255, 255, 0.38)',
                    boxShadow:
                      'inset 0 0 4px rgba(255, 255, 255, 0.40), 0 0 8px var(--water-caustic)',
                  } as React.CSSProperties
                }
              >
                {/* Tiny specular glint inside bubble */}
                <div className="absolute top-[20%] left-[22%] w-[25%] h-[25%] rounded-full bg-white/80" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 
        ========================================================================
        5. SOFT DARK READABILITY OVERLAY (~35% OPACITY)
        Ensures WCAG AA compliant text contrast across all color states
        ========================================================================
      */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1500"
        style={{
          background: isDark
            ? 'linear-gradient(180deg, rgba(11, 16, 32, 0.33) 0%, rgba(11, 16, 32, 0.36) 45%, rgba(11, 16, 32, 0.48) 100%)'
            : 'linear-gradient(180deg, rgba(15, 23, 42, 0.30) 0%, rgba(15, 23, 42, 0.35) 45%, rgba(15, 23, 42, 0.44) 100%)',
        }}
      />

      {/* Subtle organic water noise grain */}
      <div className="absolute inset-0 noise-texture pointer-events-none opacity-20 mix-blend-overlay" />
    </div>
  );
};
