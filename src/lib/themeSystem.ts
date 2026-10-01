import { ThemeConfig, ThemePreset } from '../types';

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  auto: {
    name: 'Auto (Score-Based)',
    accent: '#6366F1',
    accent2: '#8B5CF6',
    glow: 'rgba(99, 102, 241, 0.40)',
    blob1: 'rgba(99, 102, 241, 0.45)',
    blob2: 'rgba(139, 92, 246, 0.40)',
    blob3: 'rgba(6, 182, 212, 0.35)',
    badge: 'Dynamic',
  },
  aurora: {
    name: 'Aurora',
    accent: '#10B981',
    accent2: '#8B5CF6',
    glow: 'rgba(16, 185, 129, 0.40)',
    blob1: 'rgba(16, 185, 129, 0.45)',
    blob2: 'rgba(139, 92, 246, 0.40)',
    blob3: 'rgba(6, 182, 212, 0.35)',
    badge: 'Emerald & Violet',
  },
  sunset: {
    name: 'Sunset',
    accent: '#F43F5E',
    accent2: '#F97316',
    glow: 'rgba(244, 63, 94, 0.40)',
    blob1: 'rgba(244, 63, 94, 0.45)',
    blob2: 'rgba(249, 115, 22, 0.40)',
    blob3: 'rgba(245, 158, 11, 0.35)',
    badge: 'Rose & Amber',
  },
  ocean: {
    name: 'Ocean',
    accent: '#06B6D4',
    accent2: '#3B82F6',
    glow: 'rgba(6, 182, 212, 0.40)',
    blob1: 'rgba(6, 182, 212, 0.45)',
    blob2: 'rgba(59, 130, 246, 0.40)',
    blob3: 'rgba(99, 102, 241, 0.35)',
    badge: 'Cyan & Blue',
  },
  forest: {
    name: 'Forest',
    accent: '#059669',
    accent2: '#84CC16',
    glow: 'rgba(5, 150, 105, 0.40)',
    blob1: 'rgba(5, 150, 105, 0.45)',
    blob2: 'rgba(132, 204, 22, 0.35)',
    blob3: 'rgba(13, 148, 136, 0.40)',
    badge: 'Emerald & Lime',
  },
};

/**
 * Returns dynamic theme config based on score if preset is 'auto',
 * or returns the preset's fixed palette.
 */
export function getActiveTheme(
  preset: ThemePreset,
  matchScore: number | null
): ThemeConfig {
  if (preset !== 'auto') {
    return THEME_PRESETS[preset];
  }

  // If auto and no score yet, return calm indigo / violet / cyan default
  if (matchScore === null) {
    return THEME_PRESETS.auto;
  }

  // 0-49: red / orange / magenta palette (Needs Work)
  if (matchScore < 50) {
    return {
      name: 'Needs Work (Score: ' + matchScore + ')',
      accent: '#EF4444',
      accent2: '#F97316',
      glow: 'rgba(239, 68, 68, 0.45)',
      blob1: 'rgba(239, 68, 68, 0.50)',
      blob2: 'rgba(249, 115, 22, 0.42)',
      blob3: 'rgba(236, 72, 153, 0.38)',
      badge: 'Critical Gaps',
    };
  }

  // 50-74: amber / gold / coral palette (Good Match)
  if (matchScore < 75) {
    return {
      name: 'Good Match (Score: ' + matchScore + ')',
      accent: '#F59E0B',
      accent2: '#EA580C',
      glow: 'rgba(245, 158, 11, 0.45)',
      blob1: 'rgba(245, 158, 11, 0.48)',
      blob2: 'rgba(234, 88, 12, 0.40)',
      blob3: 'rgba(251, 146, 60, 0.36)',
      badge: 'Moderate Alignment',
    };
  }

  // 75-100: emerald / teal / cyan palette (Strong Match)
  return {
    name: 'Strong Match (Score: ' + matchScore + ')',
    accent: '#10B981',
    accent2: '#14B8A6',
    glow: 'rgba(16, 185, 129, 0.45)',
    blob1: 'rgba(16, 185, 129, 0.50)',
    blob2: 'rgba(20, 184, 166, 0.42)',
    blob3: 'rgba(6, 182, 212, 0.38)',
    badge: 'High Alignment',
  };
}

export interface WaterPalette {
  deep: string;
  mid: string;
  surface: string;
  caustic: string;
  shimmer: string;
  glow: string;
  border: string;
  isDrifting?: boolean;
}

/**
 * Returns water color palette:
 * - Before analysis (idle): 40-second ocean drift through deep blue, turquoise, teal, violet, and back to blue
 * - After analysis: 1.5s smooth transition to:
 *     0-49: crimson / orange / deep magenta water
 *     50-74: amber / golden / coral water
 *     75-100: emerald / aqua / cyan water
 * - Manual Theme switcher presets (aurora, sunset, ocean, forest) tint the water and override Auto
 */
export function getWaterPalette(
  preset: ThemePreset,
  matchScore: number | null,
  hasAnalyzed: boolean
): WaterPalette {
  // Manual preset selection overrides auto
  if (preset !== 'auto') {
    switch (preset) {
      case 'aurora':
        return {
          deep: '#06211d',
          mid: '#047857',
          surface: '#10b981',
          caustic: '#a855f7',
          shimmer: '#c084fc',
          glow: 'rgba(16, 185, 129, 0.40)',
          border: 'rgba(16, 185, 129, 0.25)',
          isDrifting: false,
        };
      case 'sunset':
        return {
          deep: '#290714',
          mid: '#9f1239',
          surface: '#f43f5e',
          caustic: '#f97316',
          shimmer: '#fed7aa',
          glow: 'rgba(244, 63, 94, 0.40)',
          border: 'rgba(244, 63, 94, 0.25)',
          isDrifting: false,
        };
      case 'ocean':
        return {
          deep: '#041c32',
          mid: '#0369a1',
          surface: '#0284c7',
          caustic: '#06b6d4',
          shimmer: '#67e8f9',
          glow: 'rgba(6, 182, 212, 0.40)',
          border: 'rgba(6, 182, 212, 0.25)',
          isDrifting: false,
        };
      case 'forest':
        return {
          deep: '#052414',
          mid: '#065f46',
          surface: '#059669',
          caustic: '#84cc16',
          shimmer: '#bef264',
          glow: 'rgba(5, 150, 105, 0.40)',
          border: 'rgba(5, 150, 105, 0.25)',
          isDrifting: false,
        };
    }
  }

  // Auto preset:
  // Before analysis: slow 40s ocean drift
  if (!hasAnalyzed || matchScore === null) {
    return {
      deep: '#07162c',
      mid: '#0e3a6c',
      surface: '#0284c7',
      caustic: '#38bdf8',
      shimmer: '#bae6fd',
      glow: 'rgba(2, 132, 199, 0.40)',
      border: 'rgba(56, 189, 248, 0.22)',
      isDrifting: true,
    };
  }

  // Analysis finished: Score-driven water colors
  // 0-49: crimson / orange / deep magenta water
  if (matchScore < 50) {
    return {
      deep: '#2a0512',
      mid: '#991b1b',
      surface: '#ea580c',
      caustic: '#f43f5e',
      shimmer: '#fda4af',
      glow: 'rgba(239, 68, 68, 0.45)',
      border: 'rgba(244, 63, 94, 0.25)',
      isDrifting: false,
    };
  }

  // 50-74: amber / golden / coral water
  if (matchScore < 75) {
    return {
      deep: '#271403',
      mid: '#b45309',
      surface: '#d97706',
      caustic: '#f97316',
      shimmer: '#fde047',
      glow: 'rgba(245, 158, 11, 0.45)',
      border: 'rgba(249, 115, 22, 0.25)',
      isDrifting: false,
    };
  }

  // 75-100: emerald / aqua / cyan water
  return {
    deep: '#02241c',
    mid: '#059669',
    surface: '#0d9488',
    caustic: '#06b6d4',
    shimmer: '#67e8f9',
    glow: 'rgba(16, 185, 129, 0.45)',
    border: 'rgba(6, 182, 212, 0.25)',
    isDrifting: false,
  };
}
