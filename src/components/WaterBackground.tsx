import React, { useEffect, useState, useRef } from 'react';
import { ThemePreset, ThemeConfig } from '../types';

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

// Deterministic set of calm rising bubbles
const BUBBLE_PRESETS = [
  { id: 1, left: 5, size: 14, duration: 18, delay: 0.2, sway: 18 },
  { id: 2, left: 13, size: 9, duration: 24, delay: 4.5, sway: -14 },
  { id: 3, left: 20, size: 18, duration: 16, delay: 8.0, sway: 22 },
  { id: 4, left: 28, size: 11, duration: 22, delay: 2.3, sway: -12 },
  { id: 5, left: 36, size: 22, duration: 19, delay: 11.2, sway: 25 },
  { id: 6, left: 44, size: 8, duration: 25, delay: 6.5, sway: -16 },
  { id: 7, left: 51, size: 16, duration: 17, delay: 1.2, sway: 18 },
  { id: 8, left: 59, size: 12, duration: 21, delay: 9.1, sway: -20 },
  { id: 9, left: 67, size: 20, duration: 18, delay: 13.0, sway: 16 },
  { id: 10, left: 74, size: 10, duration: 23, delay: 5.2, sway: -18 },
  { id: 11, left: 81, size: 17, duration: 19, delay: 10.0, sway: 20 },
  { id: 12, left: 89, size: 9, duration: 26, delay: 3.1, sway: -15 },
  { id: 13, left: 95, size: 15, duration: 20, delay: 7.5, sway: 15 },
];

// Keyframe ocean colors for the 25-second loop: deep blue → turquoise → teal → violet → deep blue
interface OceanKeyframe {
  pct: number; // 0 to 1
  name: string;
  deep: [number, number, number];
  mid: [number, number, number];
  surface: [number, number, number];
  caustic: [number, number, number];
  shimmer: [number, number, number];
}

const OCEAN_25S_LOOP: OceanKeyframe[] = [
  {
    pct: 0.0,
    name: 'deep blue',
    deep: [3, 24, 58],        // #03183a
    mid: [10, 80, 180],       // #0a50b4
    surface: [14, 165, 233],  // #0ea5e9
    caustic: [56, 189, 248],  // #38bdf8
    shimmer: [186, 230, 253], // #bae6fd
  },
  {
    pct: 0.25,
    name: 'turquoise',
    deep: [2, 42, 58],        // #022a3a
    mid: [8, 145, 178],       // #0891b2
    surface: [6, 182, 212],   // #06b6d4
    caustic: [103, 232, 249], // #67e8f9
    shimmer: [207, 250, 254], // #cffafe
  },
  {
    pct: 0.50,
    name: 'teal',
    deep: [2, 42, 38],        // #022a26
    mid: [13, 148, 136],      // #0d9488
    surface: [20, 184, 166],  // #14b8a6
    caustic: [94, 234, 212],  // #5eead4
    shimmer: [204, 251, 241], // #ccfbf1
  },
  {
    pct: 0.75,
    name: 'violet',
    deep: [32, 10, 60],       // #200a3c
    mid: [124, 58, 237],      // #7c3aed
    surface: [168, 85, 247],  // #a855f7
    caustic: [192, 132, 252], // #c084fc
    shimmer: [243, 232, 255], // #f3e8ff
  },
  {
    pct: 1.0,
    name: 'deep blue',
    deep: [3, 24, 58],        // #03183a
    mid: [10, 80, 180],       // #0a50b4
    surface: [14, 165, 233],  // #0ea5e9
    caustic: [56, 189, 248],  // #38bdf8
    shimmer: [186, 230, 253], // #bae6fd
  },
];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpRGB(c1: [number, number, number], c2: [number, number, number], t: number): string {
  return `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(c1[2], c2[2], t)})`;
}

function rgbToHex(c: [number, number, number]): string {
  return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
}

export const WaterBackground: React.FC<WaterBackgroundProps> = ({
  isPaused = false,
  isDark = true,
  hasAnalyzed = false,
  matchScore = null,
  themePreset = 'auto',
}) => {
  // Track browser tab visibility
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? document.hidden : false;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track prefers-reduced-motion
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

  // Current real-time color name for the quick self-check badge
  const [currentColorName, setCurrentColorName] = useState<string>('deep blue');

  // Animation frame loop for the 25-second ocean drift
  const animTimeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active state: effectively paused when manually paused or tab hidden
  const effectivelyPaused = isPaused || isTabHidden;

  useEffect(() => {
    // 1. Manual Theme Preset Override (aurora, sunset, ocean, forest)
    if (themePreset !== 'auto') {
      let pDeep = '#041c32';
      let pMid = '#0369a1';
      let pSurface = '#0284c7';
      let pCaustic = '#06b6d4';
      let pShimmer = '#67e8f9';
      let pGlow = 'rgba(6, 182, 212, 0.55)';
      let pBorder = 'rgba(6, 182, 212, 0.28)';
      let label: string = themePreset;

      if (themePreset === 'aurora') {
        pDeep = '#03261f';
        pMid = '#047857';
        pSurface = '#10b981';
        pCaustic = '#a855f7';
        pShimmer = '#c084fc';
        pGlow = 'rgba(16, 185, 129, 0.55)';
        pBorder = 'rgba(16, 185, 129, 0.28)';
        label = 'aurora (emerald / violet)';
      } else if (themePreset === 'sunset') {
        pDeep = '#380617';
        pMid = '#9f1239';
        pSurface = '#f43f5e';
        pCaustic = '#f97316';
        pShimmer = '#fed7aa';
        pGlow = 'rgba(244, 63, 94, 0.55)';
        pBorder = 'rgba(244, 63, 94, 0.28)';
        label = 'sunset (rose / amber)';
      } else if (themePreset === 'ocean') {
        pDeep = '#041c32';
        pMid = '#0369a1';
        pSurface = '#0284c7';
        pCaustic = '#06b6d4';
        pShimmer = '#67e8f9';
        pGlow = 'rgba(6, 182, 212, 0.55)';
        pBorder = 'rgba(6, 182, 212, 0.28)';
        label = 'ocean (cyan / sapphire)';
      } else if (themePreset === 'forest') {
        pDeep = '#042718';
        pMid = '#065f46';
        pSurface = '#059669';
        pCaustic = '#84cc16';
        pShimmer = '#bef264';
        pGlow = 'rgba(5, 150, 105, 0.55)';
        pBorder = 'rgba(5, 150, 105, 0.28)';
        label = 'forest (emerald / lime)';
      }

      const root = document.documentElement;
      root.style.setProperty('--water-deep', pDeep);
      root.style.setProperty('--water-mid', pMid);
      root.style.setProperty('--water-surface', pSurface);
      root.style.setProperty('--water-caustic', pCaustic);
      root.style.setProperty('--water-shimmer', pShimmer);
      root.style.setProperty('--water-glow', pGlow);
      root.style.setProperty('--water-border', pBorder);
      setCurrentColorName(label);
      return;
    }

    // 2. Score Match palette upon analysis completion
    if (hasAnalyzed && matchScore !== null) {
      let pDeep = '';
      let pMid = '';
      let pSurface = '';
      let pCaustic = '';
      let pShimmer = '';
      let pGlow = '';
      let pBorder = '';
      let label = '';

      if (matchScore < 50) {
        // 0-49: Crimson / orange / deep magenta water
        pDeep = '#380514';
        pMid = '#dc2626';
        pSurface = '#ea580c';
        pCaustic = '#f43f5e';
        pShimmer = '#fda4af';
        pGlow = 'rgba(239, 68, 68, 0.65)';
        pBorder = 'rgba(244, 63, 94, 0.35)';
        label = `crimson / orange (score ${matchScore})`;
      } else if (matchScore < 75) {
        // 50-74: Amber / golden / coral water
        pDeep = '#361803';
        pMid = '#d97706';
        pSurface = '#f59e0b';
        pCaustic = '#fb923c';
        pShimmer = '#fde047';
        pGlow = 'rgba(245, 158, 11, 0.65)';
        pBorder = 'rgba(249, 115, 22, 0.35)';
        label = `amber / gold (score ${matchScore})`;
      } else {
        // 75-100: Emerald / aqua / cyan water
        pDeep = '#022e23';
        pMid = '#059669';
        pSurface = '#0d9488';
        pCaustic = '#06b6d4';
        pShimmer = '#67e8f9';
        pGlow = 'rgba(16, 185, 129, 0.65)';
        pBorder = 'rgba(6, 182, 212, 0.35)';
        label = `emerald / cyan (score ${matchScore})`;
      }

      const root = document.documentElement;
      root.style.setProperty('--water-deep', pDeep);
      root.style.setProperty('--water-mid', pMid);
      root.style.setProperty('--water-surface', pSurface);
      root.style.setProperty('--water-caustic', pCaustic);
      root.style.setProperty('--water-shimmer', pShimmer);
      root.style.setProperty('--water-glow', pGlow);
      root.style.setProperty('--water-border', pBorder);
      setCurrentColorName(label);
      return;
    }

    // 3. Before Analysis: 25-Second Fluid Ocean Drift Loop
    // deep blue → turquoise → teal → violet → deep blue
    let rAFId: number;
    const LOOP_DURATION = 25000; // 25 seconds in milliseconds

    const updateDrift = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (!effectivelyPaused) {
        // If reduced motion is on, advance at gentler 50% speed
        const speedFactor = prefersReducedMotion ? 0.5 : 1.0;
        animTimeRef.current = (animTimeRef.current + delta * speedFactor) % LOOP_DURATION;

        const progress = animTimeRef.current / LOOP_DURATION; // 0..1

        // Find current keyframe segment
        let kfIndex = 0;
        for (let i = 0; i < OCEAN_25S_LOOP.length - 1; i++) {
          if (progress >= OCEAN_25S_LOOP[i].pct && progress <= OCEAN_25S_LOOP[i + 1].pct) {
            kfIndex = i;
            break;
          }
        }

        const kf1 = OCEAN_25S_LOOP[kfIndex];
        const kf2 = OCEAN_25S_LOOP[kfIndex + 1];
        const segProgress = (progress - kf1.pct) / (kf2.pct - kf1.pct);

        const currentDeep = lerpRGB(kf1.deep, kf2.deep, segProgress);
        const currentMid = lerpRGB(kf1.mid, kf2.mid, segProgress);
        const currentSurface = lerpRGB(kf1.surface, kf2.surface, segProgress);
        const currentCaustic = lerpRGB(kf1.caustic, kf2.caustic, segProgress);
        const currentShimmer = lerpRGB(kf1.shimmer, kf2.shimmer, segProgress);
        const currentGlow = `rgba(${lerp(kf1.surface[0], kf2.surface[0], segProgress)}, ${lerp(
          kf1.surface[1],
          kf2.surface[1],
          segProgress
        )}, ${lerp(kf1.surface[2], kf2.surface[2], segProgress)}, 0.50)`;

        const currentBorder = `rgba(${lerp(kf1.caustic[0], kf2.caustic[0], segProgress)}, ${lerp(
          kf1.caustic[1],
          kf2.caustic[1],
          segProgress
        )}, ${lerp(kf1.caustic[2], kf2.caustic[2], segProgress)}, 0.28)`;

        const root = document.documentElement;
        root.style.setProperty('--water-deep', currentDeep);
        root.style.setProperty('--water-mid', currentMid);
        root.style.setProperty('--water-surface', currentSurface);
        root.style.setProperty('--water-caustic', currentCaustic);
        root.style.setProperty('--water-shimmer', currentShimmer);
        root.style.setProperty('--water-glow', currentGlow);
        root.style.setProperty('--water-border', currentBorder);

        // Approximate color name for badge
        const currentSegmentName = segProgress < 0.5 ? kf1.name : kf2.name;
        setCurrentColorName(currentSegmentName);
      }

      rAFId = requestAnimationFrame(updateDrift);
    };

    rAFId = requestAnimationFrame(updateDrift);

    return () => {
      cancelAnimationFrame(rAFId);
      lastTimestampRef.current = 0;
    };
  }, [hasAnalyzed, matchScore, themePreset, effectivelyPaused, prefersReducedMotion]);

  return (
    <>
      {/* 
        ========================================================================
        WATER BACKGROUND LAYER
        Positioned fixed at inset: 0, z-index: 0, behind app content (wrapper z-index: 10).
        Pure code (CSS/SVG), no video dependency, smooth on mobile.
        ========================================================================
      */}
      <div
        ref={containerRef}
        className={`fixed inset-0 pointer-events-none overflow-hidden select-none transition-all duration-1500 ${
          effectivelyPaused ? 'water-motion-paused' : ''
        }`}
        style={{
          zIndex: 0,
          background: `radial-gradient(ellipse 130% 100% at 50% -10%, var(--water-surface) 0%, var(--water-mid) 42%, var(--water-deep) 100%)`,
        }}
        aria-hidden="true"
      >
        {/* 
          ======================================================================
          1. SUNLIGHT CAUSTIC REFRACTIONS & LIGHT BEAMS
          Organic swaying caustics and shimmering light dancing through water
          ======================================================================
        */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-45 mix-blend-screen">
          {/* Swaying sunlight light beams from top-right */}
          <div
            className="absolute -top-1/4 -right-1/4 w-[160%] h-[150%] animate-sunlight-rays"
            style={{
              background: `conic-gradient(from 215deg at 75% 15%, 
                transparent 0deg, 
                var(--water-shimmer) 15deg, 
                transparent 35deg, 
                var(--water-caustic) 60deg, 
                transparent 85deg, 
                var(--water-shimmer) 105deg, 
                transparent 135deg)`,
              filter: 'blur(32px)',
            }}
          />

          {/* Organic sunlight caustics network 1 */}
          <div
            className="absolute inset-0 animate-caustics-1 transition-colors duration-1500"
            style={{
              backgroundImage: `radial-gradient(circle 380px at 20% 25%, var(--water-caustic) 0%, transparent 68%),
                                radial-gradient(circle 460px at 70% 18%, var(--water-shimmer) 0%, transparent 62%),
                                radial-gradient(circle 340px at 85% 65%, var(--water-caustic) 0%, transparent 58%),
                                radial-gradient(circle 380px at 30% 75%, var(--water-shimmer) 0%, transparent 65%)`,
              opacity: 0.55,
              filter: 'blur(24px)',
            }}
          />

          {/* Counter-swaying caustics layer 2 */}
          <div
            className="absolute inset-0 animate-caustics-2 transition-colors duration-1500"
            style={{
              backgroundImage: `radial-gradient(circle 440px at 50% 10%, var(--water-shimmer) 0%, transparent 62%),
                                radial-gradient(circle 380px at 15% 68%, var(--water-caustic) 0%, transparent 58%),
                                radial-gradient(circle 500px at 80% 80%, var(--water-shimmer) 0%, transparent 68%)`,
              opacity: 0.45,
              filter: 'blur(28px)',
            }}
          />
        </div>

        {/* 
          ======================================================================
          2. FOUR LAYERED MOVING WAVES ACROSS SCREEN
          Clearly visible vector wave curves with 2 identical repeating cycles (0..1200, 1200..2400)
          translating horizontally from 0 to -50% for 100% seamless, non-stop loops.
          ======================================================================
        */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--water-mid)" stopOpacity="0.65" />
              <stop offset="100%" stopColor="var(--water-deep)" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--water-surface)" stopOpacity="0.72" />
              <stop offset="100%" stopColor="var(--water-mid)" stopOpacity="0.92" />
            </linearGradient>
            <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--water-caustic)" stopOpacity="0.80" />
              <stop offset="45%" stopColor="var(--water-surface)" stopOpacity="0.88" />
              <stop offset="100%" stopColor="var(--water-mid)" stopOpacity="0.96" />
            </linearGradient>
            <linearGradient id="wave-grad-4" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--water-shimmer)" stopOpacity="0.92" />
              <stop offset="25%" stopColor="var(--water-caustic)" stopOpacity="0.80" />
              <stop offset="100%" stopColor="var(--water-surface)" stopOpacity="0.90" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wave Layer 1: Deep ocean swell (Bottom, slow 34s, large rolling amplitude) */}
        <div
          className="absolute bottom-0 left-0 w-[200%] h-[75vh] pointer-events-none overflow-hidden transition-all duration-1500"
          style={{ opacity: 0.58 }}
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
          className="absolute bottom-0 left-0 w-[200%] h-[60vh] pointer-events-none overflow-hidden transition-all duration-1500"
          style={{ opacity: 0.65 }}
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
          className="absolute bottom-0 left-0 w-[200%] h-[46vh] pointer-events-none overflow-hidden transition-all duration-1500"
          style={{ opacity: 0.72 }}
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

        {/* Wave Layer 4: Upper surface crest & light shimmer ripple with luminous highlight edge */}
        <div
          className="absolute bottom-0 left-0 w-[200%] h-[34vh] pointer-events-none overflow-hidden transition-all duration-1500"
          style={{ opacity: 0.85 }}
        >
          <svg
            className="w-full h-full animate-wave-4 transition-all duration-1500"
            viewBox="0 0 2400 360"
            preserveAspectRatio="none"
            fill="url(#wave-grad-4)"
            stroke="var(--water-shimmer)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 8px var(--water-shimmer))',
            }}
          >
            <path d="M 0 90 C 180 50, 400 130, 600 70 C 800 10, 1000 130, 1200 90 C 1380 50, 1600 130, 1800 70 C 2000 10, 2200 130, 2400 90 L 2400 360 L 0 360 Z" />
          </svg>
        </div>

        {/* 
          ======================================================================
          3. SLOW-RISING WATER BUBBLES
          Translucent glassy rising bubbles with bright specular highlights
          ======================================================================
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
                    'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.35) 40%, rgba(255, 255, 255, 0.05) 80%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.55)',
                  boxShadow:
                    'inset 0 0 5px rgba(255, 255, 255, 0.6), 0 0 10px var(--water-shimmer)',
                } as React.CSSProperties
              }
            >
              {/* Specular highlight crescent */}
              <div className="absolute top-[18%] left-[20%] w-[30%] h-[30%] rounded-full bg-white/95" />
            </div>
          ))}
        </div>

        {/* 
          ======================================================================
          4. SOFT READABILITY OVERLAY (15-20% OPACITY)
          Reduced to 16% so the moving water is vividly clear while maintaining contrast
          ======================================================================
        */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-1500"
          style={{
            backgroundColor: isDark ? 'rgba(3, 7, 18, 0.16)' : 'rgba(15, 23, 42, 0.14)',
          }}
        />

        {/* Subtle noise grain for organic surface texture */}
        <div className="absolute inset-0 noise-texture pointer-events-none opacity-15 mix-blend-overlay" />
      </div>

      {/* 
        ========================================================================
        5. QUICK SELF-CHECK STATUS BADGE (BOTTOM-LEFT)
        Shows current water mode, color state, and reduced motion status
        ========================================================================
      */}
      <div
        className="fixed bottom-3 left-3 z-50 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-cyan-400/40 text-[11px] font-mono text-cyan-300 pointer-events-none shadow-xl flex items-center gap-2 select-none"
        aria-live="polite"
      >
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'
          }`}
        />
        <span>
          Water: {isPaused ? 'paused' : 'animated'} | colour: {currentColorName} | reduced-motion:{' '}
          {prefersReducedMotion ? 'true (50% speed)' : 'false'}
        </span>
      </div>
    </>
  );
};
