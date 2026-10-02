import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ThemePreset, ThemeConfig } from '../types';

// =========================================================================
// LIQUID CONFIGURATION: Tweak River Flow Speed, Swirl, and Gloss Strength
// =========================================================================
export const LIQUID_CONFIG = {
  baseSpeed: 0.95,      // <-- CHANGE FLOW SPEED HERE (Higher = faster river current)
  swirlStrength: 1.25,  // <-- CHANGE SWIRL & EDDY STRENGTH HERE (Domain warp turbulence)
  glossStrength: 1.95,  // <-- CHANGE GLOSS / SPECULAR SHINE STRENGTH HERE (0.5 to 3.0)
  paletteShiftPeriod: 30.0, // <-- CHANGE PALETTE CYCLE TIME IN SECONDS HERE (~30s loop)
  wobbleAmount: 0.08,   // <-- CHANGE ORGANIC NOISE WOBBLE HERE
};

export type LiquidRendererMode = 'webgl' | 'svg';
export type LiquidIntensityLevel = 'calm' | 'normal' | 'lively';

// Backwards-compatible aliases
export type BackgroundMode = LiquidRendererMode;
export type BackgroundRendererMode = LiquidRendererMode;
export type FluidIntensityLevel = LiquidIntensityLevel;

export interface LiquidBackgroundProps {
  mode?: LiquidRendererMode;
  onModeChange?: (mode: LiquidRendererMode) => void;
  isPaused?: boolean;
  colors?: ThemeConfig;
  isDark?: boolean;
  isAnalyzing?: boolean;
  hasAnalyzed?: boolean;
  matchScore?: number | null;
  themePreset?: ThemePreset;
  intensity?: LiquidIntensityLevel | number;
}

export type WaterBackgroundProps = LiquidBackgroundProps;

// Idle continuous color reference loop
interface LiquidColorKeyframe {
  pct: number;
  name: string;
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
}

const LIQUID_SPECTRUM_LOOP: LiquidColorKeyframe[] = [
  { pct: 0.0,  name: 'full spectrum',  c1: [180, 20, 160], c2: [20, 110, 240], c3: [30, 220, 255] },
  { pct: 0.25, name: 'cyan sapphire',  c1: [10, 50, 140],  c2: [15, 175, 235], c3: [40, 245, 210] },
  { pct: 0.50, name: 'emerald lagoon', c1: [10, 90, 80],   c2: [30, 195, 140], c3: [240, 230, 60] },
  { pct: 0.75, name: 'sunset river',   c1: [140, 20, 60],  c2: [240, 95, 40],  c3: [255, 195, 50] },
  { pct: 1.0,  name: 'full spectrum',  c1: [180, 20, 160], c2: [20, 110, 240], c3: [30, 220, 255] },
];

// =========================================================================
// AMBIENT LIGHT THEME PROFILES
// =========================================================================
interface AmbientLightProfile {
  name: string;
  tint: [number, number, number];
  frequency: number;
  calcPulse: (time: number) => number;
}

export const THEME_AMBIENT_PROFILES: Record<ThemePreset, AmbientLightProfile> = {
  auto: {
    name: 'Prismatic Aurora',
    tint: [60, 200, 255],
    frequency: 1.25,
    calcPulse: (t) => 0.5 + 0.5 * Math.sin(t * 1.25),
  },
  aurora: {
    name: 'Borealis Emerald',
    tint: [90, 250, 190],
    frequency: 1.65,
    calcPulse: (t) => 0.5 + 0.35 * Math.sin(t * 1.65) + 0.15 * Math.cos(t * 3.3),
  },
  sunset: {
    name: 'Hearth Amber',
    tint: [255, 145, 65],
    frequency: 1.45,
    calcPulse: (t) => Math.pow(Math.sin(t * 1.45) * 0.5 + 0.5, 1.6),
  },
  ocean: {
    name: 'Abyssal Sapphire',
    tint: [30, 185, 245],
    frequency: 1.05,
    calcPulse: (t) => 0.5 + 0.5 * Math.sin(t * 1.05),
  },
  forest: {
    name: 'Canopy Bioluminescence',
    tint: [85, 240, 80],
    frequency: 1.35,
    calcPulse: (t) => 0.5 + 0.38 * Math.sin(t * 1.35) + 0.12 * Math.sin(t * 2.7 + 0.8),
  },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRGB(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
}

// =========================================================================
// WEBGL SHADER SOURCES: GLOSSY MULTICOLOUR LIQUID RIVER FLOW
// =========================================================================
const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_active;
uniform vec3 u_color1;       // Deep theme base
uniform vec3 u_color2;       // Mid theme body
uniform vec3 u_color3;       // Surface theme accent
uniform float u_theme_bias;  // 0.0 = full spectrum rainbow, 1.0 = theme/score biased
uniform float u_gloss_strength;
uniform float u_swirl_strength;
uniform float u_splash_pulse;
uniform float u_thinking_pulse;

// Ambient Light uniforms
uniform float u_ambient_pulse;
uniform vec3 u_ambient_tint;
uniform float u_ambient_intensity;

// --- RIVER FLOW VECTOR MATH ---
// Primary downstream current direction: Left to right and slightly diagonal downward
const vec2 FLOW_DIR = vec2(0.96, -0.28);
const vec2 PERP_DIR = vec2(0.28, 0.96);

// Fast 2D pseudo-random hash
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Simplex-style smooth gradient noise
float noise(vec2 p) {
  const float K1 = 0.366025404; // (sqrt(3)-1)/2
  const float K2 = 0.211324865; // (3-sqrt(3))/6
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}

// 3-octave Fractional Brownian Motion for fast, lightweight liquid advection
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.87, -0.48, 0.48, 0.87);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rot * p * 2.04;
    a *= 0.5;
  }
  return v;
}

// Full-spectrum vibrant cosine palette:
// Magenta -> Violet -> Indigo -> Blue -> Cyan -> Teal -> Green -> Yellow -> Orange -> Red
vec3 getRainbowSpectrum(float t) {
  vec3 a = vec3(0.54, 0.50, 0.52);
  vec3 b = vec3(0.48, 0.52, 0.48);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.85, 0.55, 0.18);
  return clamp(a + b * cos(6.283185 * (c * t + d)), 0.0, 1.0);
}

// Domain-warped height field evaluating flowing liquid surface
float getRiverHeight(vec2 p, float t, float swirlStrength) {
  // Sweeping meandering serpentine curve along river path
  float streamCoord = dot(p, FLOW_DIR);
  float meander = sin(streamCoord * 1.35 - t * 0.38) * 0.38 + cos(streamCoord * 0.65 + t * 0.22) * 0.22;

  // Primary stream advected coordinate
  vec2 p1 = p + PERP_DIR * meander - FLOW_DIR * (t * 0.45);

  // Slower secondary current at different speed and slightly different angle (Parallax depth)
  vec2 dir2 = normalize(vec2(0.88, -0.46));
  vec2 p2 = p - dir2 * (t * 0.26) + vec2(3.14, 7.82);

  // Occasional gentle whirlpools & eddies drifting downstream and dissolving
  // Whirlpool 1:
  vec2 wpCenter1 = FLOW_DIR * (mod(t * 0.32, 6.4) - 3.2) + PERP_DIR * (sin(t * 0.22) * 0.55);
  vec2 toWp1 = p - wpCenter1;
  float dWp1 = length(toWp1);
  float wpEnvelope1 = smoothstep(2.4, 0.0, dWp1) * (0.5 + 0.5 * sin(t * 0.42));
  vec2 wpSwirl1 = vec2(-toWp1.y, toWp1.x) / (dWp1 + 0.22) * wpEnvelope1 * 0.45;

  // Whirlpool 2 (Counter-current tributary):
  vec2 wpCenter2 = FLOW_DIR * (mod(t * 0.24 + 3.2, 6.4) - 3.2) - PERP_DIR * (cos(t * 0.26) * 0.62);
  vec2 toWp2 = p - wpCenter2;
  float dWp2 = length(toWp2);
  float wpEnvelope2 = smoothstep(2.2, 0.0, dWp2) * (0.5 + 0.5 * cos(t * 0.35 + 1.4));
  vec2 wpSwirl2 = vec2(toWp2.y, -toWp2.x) / (dWp2 + 0.28) * wpEnvelope2 * 0.40;

  // Pointer gentle disturbance (soft ripple and local swirl)
  vec2 mousePerturb = vec2(0.0);
  if (u_mouse_active > 0.01) {
    vec2 toMouse = p - u_mouse;
    float dMouse = length(toMouse);
    float mouseFalloff = exp(-dMouse * 2.3) * u_mouse_active;
    vec2 mouseSwirl = vec2(-toMouse.y, toMouse.x) / (dMouse + 0.16) * 0.65;
    float mouseRipple = sin(dMouse * 22.0 - t * 8.0) * 0.16;
    mousePerturb = (mouseSwirl + normalize(toMouse + 0.001) * mouseRipple) * mouseFalloff;
  }

  // Domain Warping: Layer 1
  vec2 warpQ = vec2(
    fbm(p1 * 1.75 + wpSwirl1 + mousePerturb),
    fbm(p1 * 1.75 + vec2(5.2, 1.3) + wpSwirl2 + mousePerturb)
  ) * swirlStrength;

  // Domain Warping: Layer 2 with secondary current
  vec2 warpR = vec2(
    fbm(p2 * 2.5 + 2.5 * warpQ),
    fbm(p2 * 2.5 + vec2(8.3, 2.8) + 2.5 * warpQ)
  ) * swirlStrength;

  // Final height field
  float h = fbm(p1 * 2.1 + 3.2 * warpR) * 0.5 + 0.5;

  // Bright glossy ripple waves traveling along the river current
  float ripple = sin(dot(p1, FLOW_DIR) * 16.0 + warpR.x * 5.2 - t * 3.4) * 0.065;
  h += ripple;

  // Thinking pulse ripple during resume analysis loading
  if (u_thinking_pulse > 0.0) {
    float rip = sin(length(p) * 14.0 - u_thinking_pulse) * exp(-length(p) * 0.4) * 0.085;
    h += rip;
  }

  return clamp(h, 0.0, 1.0);
}

void main() {
  vec2 uv = v_uv;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time;
  float swirlStr = u_swirl_strength;

  // Evaluate central height
  float hCenter = getRiverHeight(p, t, swirlStr);

  // Compute 3D surface normals via finite differences
  vec2 eps = vec2(2.5 / u_resolution.y, 0.0);
  float hR = getRiverHeight(p + eps.xy, t, swirlStr);
  float hL = getRiverHeight(p - eps.xy, t, swirlStr);
  float hU = getRiverHeight(p + eps.yx, t, swirlStr);
  float hD = getRiverHeight(p - eps.yx, t, swirlStr);

  vec3 N = normalize(vec3(-(hR - hL), -(hU - hD), (eps.x * 2.0) * (2.85 / u_gloss_strength)));
  vec3 V = vec3(0.0, 0.0, 1.0); // Viewer facing camera

  // --- GLOSSY LIGHTING AND SHADING ---
  // Overhead studio key light
  vec3 L1 = normalize(vec3(0.44, 0.70, 0.76));
  // Secondary kicker fill light
  vec3 L2 = normalize(vec3(-0.62, -0.35, 0.65));

  float diff1 = max(0.0, dot(N, L1));
  float diff2 = max(0.0, dot(N, L2));
  float diffuse = diff1 * 0.70 + diff2 * 0.30 + 0.24;

  // 1. Sharp Hotspot Specular Glint (Molten glass reflection)
  vec3 H1 = normalize(L1 + V);
  float specHotspot = pow(max(0.0, dot(N, H1)), 110.0) * 2.4 * u_gloss_strength;

  // 2. Broad Liquid Satin Sheen
  float specSatin = pow(max(0.0, dot(N, H1)), 24.0) * 0.70 * u_gloss_strength;

  // 3. Secondary Light Specular Glint
  vec3 H2 = normalize(L2 + V);
  float specSecondary = pow(max(0.0, dot(N, H2)), 64.0) * 0.55 * u_gloss_strength;

  // 4. Directional River Current Streak (Gloss highlight tracing river flow lines)
  vec3 flow3D = normalize(vec3(FLOW_DIR, 0.32));
  float riverStreak = pow(max(0.0, 1.0 - abs(dot(N, flow3D))), 15.0) * 0.75 * u_gloss_strength;

  // 5. Environmental Reflection Horizon
  vec3 R = reflect(-V, N);
  float envReflection = smoothstep(-0.25, 0.75, R.y) * 0.45 + pow(max(0.0, R.z), 3.0) * 0.35;

  // 6. Fresnel Rim Glow on Surface Grazing Angles
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 2.5);

  // --- FULL-SPECTRUM MULTICOLOUR PALETTE & THEME BLEND ---
  // Palette travels slowly downstream (approx 30-second cycle)
  float paletteTravel = (dot(p, FLOW_DIR) * 0.28 + (hCenter - 0.5) * 0.45 + fract(t / 30.0));
  vec3 rainbowCol = getRainbowSpectrum(paletteTravel);

  // Theme-biased colour blend when theme switcher or match score is active
  vec3 themeCol = mix(u_color1 * 1.15, u_color2 * 1.25, clamp(hCenter * 1.2, 0.0, 1.0));
  themeCol = mix(themeCol, u_color3 * 1.30, fresnel * 0.65);

  vec3 baseFluidCol = mix(rainbowCol, themeCol, u_theme_bias);

  // Darker troughs and brighter illuminated crests for real depth and dimension
  float depthTrough = mix(0.42, 1.28, smoothstep(0.12, 0.88, hCenter));

  // Ambient Sheen and breathing pulse from theme profile
  float ambientSheenFactor = 1.0 + (u_ambient_pulse * 0.16) * u_ambient_intensity;

  // --- FINAL GLOSSY COMPOSITION ---
  vec3 fluidCol = baseFluidCol * diffuse * depthTrough;
  fluidCol += (specHotspot + specSecondary * 0.5) * mix(vec3(1.0), u_ambient_tint, 0.14) * ambientSheenFactor;
  fluidCol += specSatin * mix(vec3(1.0), baseFluidCol, 0.30) * ambientSheenFactor;
  fluidCol += riverStreak * vec3(1.0, 1.0, 1.0) * ambientSheenFactor;
  fluidCol += envReflection * mix(baseFluidCol, u_ambient_tint, 0.35) * (0.42 + 0.18 * u_ambient_pulse * u_ambient_intensity);
  fluidCol += fresnel * mix(baseFluidCol, vec3(1.0), 0.35) * 0.70;

  gl_FragColor = vec4(fluidCol, 1.0);
}
`;

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({
  mode = 'webgl',
  onModeChange,
  isPaused = false,
  colors,
  isDark = true,
  isAnalyzing = false,
  hasAnalyzed = false,
  matchScore = null,
  themePreset = 'auto',
  intensity = 'normal',
}) => {
  const [currentMode, setCurrentMode] = useState<LiquidRendererMode>(mode);

  useEffect(() => {
    if (mode && mode !== currentMode) {
      setCurrentMode(mode);
    }
  }, [mode]);

  // Tab visibility: pause rendering when tab is hidden
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? document.hidden : false;
  });

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Reduced motion preference: run at 40% speed with gentler swirls
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Performance FPS counter
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimestampRef = useRef<number>(performance.now());

  // Interactive mouse cursor coordinates
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dampedMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseActiveRef = useRef<number>(0.0);
  const mouseLastMovedRef = useRef<number>(0);

  // Thinking pulse & splash pulse ref
  const thinkingPulseRef = useRef<number>(0);
  const splashPulseRef = useRef<number>(0);
  const prevHasAnalyzedRef = useRef<boolean>(hasAnalyzed);

  // Trigger splash pulse when analysis completes
  useEffect(() => {
    if (!prevHasAnalyzedRef.current && hasAnalyzed) {
      splashPulseRef.current = 1.0;
    }
    prevHasAnalyzedRef.current = hasAnalyzed;
  }, [hasAnalyzed]);

  // Pointer event listeners updating coordinates
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const aspect = w / h;
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const newX = ((clientX / w) * 2.0 - 1.0) * aspect;
      const newY = -((clientY / h) * 2.0 - 1.0);

      const nextCoords = { x: newX, y: newY };
      setMouseCoords(nextCoords);
      mouseCoordsRef.current = nextCoords;
      mouseActiveRef.current = 1.0;
      mouseLastMovedRef.current = performance.now();
    };

    window.addEventListener('mousemove', handlePointerMove as any, { passive: true });
    window.addEventListener('pointermove', handlePointerMove as any, { passive: true });
    window.addEventListener('touchmove', handlePointerMove as any, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlePointerMove as any);
      window.removeEventListener('pointermove', handlePointerMove as any);
      window.removeEventListener('touchmove', handlePointerMove as any);
    };
  }, []);

  // Intensity controls: speed and swirl multipliers
  const { speedMult, swirlMult } = useMemo(() => {
    let s = 1.0;
    let w = 1.0;
    if (intensity === 'calm') {
      s = 0.58;
      w = 0.65;
    } else if (intensity === 'lively') {
      s = 1.55;
      w = 1.55;
    } else if (typeof intensity === 'number') {
      s = intensity;
      w = intensity;
    }
    return { speedMult: s, swirlMult: w };
  }, [intensity]);

  // Color management and theme bias tracking
  const [currentColorName, setCurrentColorName] = useState<string>('full spectrum river');
  const targetColorsRef = useRef<{ c1: [number, number, number]; c2: [number, number, number]; c3: [number, number, number] }>({
    c1: [180, 20, 160],
    c2: [20, 110, 240],
    c3: [30, 220, 255],
  });
  const currentRenderColorsRef = useRef<{ c1: [number, number, number]; c2: [number, number, number]; c3: [number, number, number] }>({
    c1: [180, 20, 160],
    c2: [20, 110, 240],
    c3: [30, 220, 255],
  });

  const targetThemeBiasRef = useRef<number>(0.0);
  const currentThemeBiasRef = useRef<number>(0.0);

  useEffect(() => {
    if (themePreset !== 'auto') {
      let c1: [number, number, number] = [4, 32, 68];
      let c2: [number, number, number] = [6, 120, 195];
      let c3: [number, number, number] = [14, 205, 245];
      let name: string = themePreset;

      if (themePreset === 'aurora') {
        c1 = [4, 46, 38];
        c2 = [6, 145, 105];
        c3 = [185, 95, 255];
        name = 'aurora (emerald / violet)';
      } else if (themePreset === 'sunset') {
        c1 = [65, 8, 28];
        c2 = [185, 22, 68];
        c3 = [255, 125, 25];
        name = 'sunset (rose / amber)';
      } else if (themePreset === 'ocean') {
        c1 = [4, 32, 68];
        c2 = [6, 120, 195];
        c3 = [14, 205, 245];
        name = 'ocean (sapphire / cyan)';
      } else if (themePreset === 'forest') {
        c1 = [5, 48, 28];
        c2 = [8, 115, 85];
        c3 = [145, 225, 25];
        name = 'forest (emerald / lime)';
      }

      targetColorsRef.current = { c1, c2, c3 };
      targetThemeBiasRef.current = 0.82;
      setCurrentColorName(name);
      return;
    }

    if (hasAnalyzed && matchScore !== null && matchScore !== undefined) {
      targetThemeBiasRef.current = 0.82;
      if (matchScore >= 75) {
        targetColorsRef.current = {
          c1: [5, 48, 36],
          c2: [6, 175, 120],
          c3: [12, 215, 245],
        };
        setCurrentColorName(`emerald river (high: ${matchScore}%)`);
      } else if (matchScore >= 50) {
        targetColorsRef.current = {
          c1: [68, 30, 5],
          c2: [245, 135, 8],
          c3: [255, 135, 25],
        };
        setCurrentColorName(`amber river (mid: ${matchScore}%)`);
      } else {
        targetColorsRef.current = {
          c1: [68, 8, 28],
          c2: [245, 32, 85],
          c3: [255, 98, 15],
        };
        setCurrentColorName(`crimson river (low: ${matchScore}%)`);
      }
    } else {
      // Default: full-spectrum rainbow river
      targetThemeBiasRef.current = 0.0;
      setCurrentColorName('full spectrum multicolour river');
    }
  }, [themePreset, hasAnalyzed, matchScore]);

  useEffect(() => {
    const root = document.documentElement;
    const c = currentRenderColorsRef.current;
    root.style.setProperty('--liquid-deep', `rgb(${Math.round(c.c1[0])}, ${Math.round(c.c1[1])}, ${Math.round(c.c1[2])})`);
    root.style.setProperty('--liquid-mid', `rgb(${Math.round(c.c2[0])}, ${Math.round(c.c2[1])}, ${Math.round(c.c2[2])})`);
    root.style.setProperty('--liquid-surface', `rgb(${Math.round(c.c3[0])}, ${Math.round(c.c3[1])}, ${Math.round(c.c3[2])})`);
    root.style.setProperty('--water-deep', `rgb(${Math.round(c.c1[0])}, ${Math.round(c.c1[1])}, ${Math.round(c.c1[2])})`);
    root.style.setProperty('--water-mid', `rgb(${Math.round(c.c2[0])}, ${Math.round(c.c2[1])}, ${Math.round(c.c2[2])})`);
    root.style.setProperty('--water-surface', `rgb(${Math.round(c.c3[0])}, ${Math.round(c.c3[1])}, ${Math.round(c.c3[2])})`);
  }, [currentColorName]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<{ [key: string]: WebGLUniformLocation | null }>({});
  const animTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      console.warn('WebGL unavailable, falling back to SVG liquid river renderer');
      setCurrentMode('svg');
      onModeChange?.('svg');
      return false;
    }

    const createShader = (type: number, src: string) => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

    if (!vertShader || !fragShader) {
      setCurrentMode('svg');
      onModeChange?.('svg');
      return false;
    }

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      setCurrentMode('svg');
      onModeChange?.('svg');
      return false;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      u_resolution: gl.getUniformLocation(program, 'u_resolution'),
      u_time: gl.getUniformLocation(program, 'u_time'),
      u_mouse: gl.getUniformLocation(program, 'u_mouse'),
      u_mouse_active: gl.getUniformLocation(program, 'u_mouse_active'),
      u_color1: gl.getUniformLocation(program, 'u_color1'),
      u_color2: gl.getUniformLocation(program, 'u_color2'),
      u_color3: gl.getUniformLocation(program, 'u_color3'),
      u_theme_bias: gl.getUniformLocation(program, 'u_theme_bias'),
      u_gloss_strength: gl.getUniformLocation(program, 'u_gloss_strength'),
      u_swirl_strength: gl.getUniformLocation(program, 'u_swirl_strength'),
      u_splash_pulse: gl.getUniformLocation(program, 'u_splash_pulse'),
      u_thinking_pulse: gl.getUniformLocation(program, 'u_thinking_pulse'),
      u_ambient_pulse: gl.getUniformLocation(program, 'u_ambient_pulse'),
      u_ambient_tint: gl.getUniformLocation(program, 'u_ambient_tint'),
      u_ambient_intensity: gl.getUniformLocation(program, 'u_ambient_intensity'),
    };

    glRef.current = gl;
    programRef.current = program;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost, falling back to SVG liquid river renderer');
      setCurrentMode('svg');
      onModeChange?.('svg');
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      initWebGL();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    return true;
  }, [onModeChange]);

  useEffect(() => {
    if (currentMode === 'webgl') {
      initWebGL();
    }
  }, [currentMode, initWebGL]);

  // Main Render Loop
  useEffect(() => {
    let rAFId = 0;

    const render = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const rawDt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      frameCountRef.current++;
      if (timestamp - lastFpsTimestampRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsTimestampRef.current = timestamp;
      }

      const isPausedEffective = isPaused || isTabHidden;

      if (!isPausedEffective) {
        let effectiveSpeed = LIQUID_CONFIG.baseSpeed * speedMult;
        if (prefersReducedMotion) effectiveSpeed *= 0.40;
        if (isAnalyzing) effectiveSpeed *= 2.2;

        animTimeRef.current += rawDt * effectiveSpeed;

        if (splashPulseRef.current > 0.001) {
          splashPulseRef.current = Math.max(0, splashPulseRef.current - rawDt * 0.9);
        }

        if (isAnalyzing) {
          thinkingPulseRef.current += rawDt * 10.0;
        } else if (thinkingPulseRef.current > 0) {
          thinkingPulseRef.current += rawDt * 4.0;
          if (thinkingPulseRef.current > 60.0) thinkingPulseRef.current = 0;
        }

        const damping = 0.085;
        dampedMouseRef.current.x += (mouseCoords.x - dampedMouseRef.current.x) * damping;
        dampedMouseRef.current.y += (mouseCoords.y - dampedMouseRef.current.y) * damping;

        if (performance.now() - mouseLastMovedRef.current > 3000) {
          mouseActiveRef.current = Math.max(0, mouseActiveRef.current - rawDt * 0.7);
        }

        // Smooth 1.5s theme color and bias transition
        const colorLerpRate = Math.min(rawDt * 1.8, 1.0);
        currentRenderColorsRef.current = {
          c1: lerpRGB(currentRenderColorsRef.current.c1, targetColorsRef.current.c1, colorLerpRate),
          c2: lerpRGB(currentRenderColorsRef.current.c2, targetColorsRef.current.c2, colorLerpRate),
          c3: lerpRGB(currentRenderColorsRef.current.c3, targetColorsRef.current.c3, colorLerpRate),
        };

        currentThemeBiasRef.current = lerp(
          currentThemeBiasRef.current,
          targetThemeBiasRef.current,
          colorLerpRate
        );
      }

      if (currentMode === 'webgl' && glRef.current && programRef.current) {
        const gl = glRef.current;
        const canvas = canvasRef.current;

        if (canvas) {
          // Render at 50% resolution to drastically reduce shader fill-rate cost
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.50;
          const displayWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
          const displayHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));

          if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, displayWidth, displayHeight);
          }

          const u = uniformsRef.current;
          gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
          gl.uniform1f(u.u_time, animTimeRef.current);
          gl.uniform2f(u.u_mouse, dampedMouseRef.current.x, dampedMouseRef.current.y);
          gl.uniform1f(u.u_mouse_active, mouseActiveRef.current);

          const c = currentRenderColorsRef.current;
          gl.uniform3f(u.u_color1, c.c1[0] / 255, c.c1[1] / 255, c.c1[2] / 255);
          gl.uniform3f(u.u_color2, c.c2[0] / 255, c.c2[1] / 255, c.c2[2] / 255);
          gl.uniform3f(u.u_color3, c.c3[0] / 255, c.c3[1] / 255, c.c3[2] / 255);
          gl.uniform1f(u.u_theme_bias, currentThemeBiasRef.current);

          gl.uniform1f(u.u_gloss_strength, LIQUID_CONFIG.glossStrength);
          gl.uniform1f(u.u_swirl_strength, LIQUID_CONFIG.swirlStrength * swirlMult * (prefersReducedMotion ? 0.5 : 1.0));
          gl.uniform1f(u.u_splash_pulse, splashPulseRef.current);
          gl.uniform1f(u.u_thinking_pulse, isAnalyzing ? thinkingPulseRef.current : 0.0);

          // Ambient light profile
          const ambientProfile = THEME_AMBIENT_PROFILES[themePreset] || THEME_AMBIENT_PROFILES.auto;
          const ambientPulse = ambientProfile.calcPulse(animTimeRef.current);
          const ambientIntensity = isDark ? 1.0 : 0.85;

          gl.uniform1f(u.u_ambient_pulse, ambientPulse);
          gl.uniform3f(u.u_ambient_tint, ambientProfile.tint[0] / 255, ambientProfile.tint[1] / 255, ambientProfile.tint[2] / 255);
          gl.uniform1f(u.u_ambient_intensity, ambientIntensity);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }

      rAFId = requestAnimationFrame(render);
    };

    rAFId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rAFId);
      lastTimeRef.current = 0;
    };
  }, [currentMode, isPaused, isTabHidden, prefersReducedMotion, isAnalyzing, hasAnalyzed, matchScore, themePreset, speedMult, swirlMult, mouseCoords]);

  // Fallback SVG Animated Liquid River Flow with feTurbulence + feDisplacementMap
  const [svgTime, setSvgTime] = useState(0);
  useEffect(() => {
    if (currentMode !== 'svg' || isPaused || isTabHidden) return;
    let animId = 0;
    const updateSvg = () => {
      setSvgTime(animTimeRef.current);
      animId = requestAnimationFrame(updateSvg);
    };
    animId = requestAnimationFrame(updateSvg);
    return () => cancelAnimationFrame(animId);
  }, [currentMode, isPaused, isTabHidden]);

  return (
    <>
      {/* 
        ========================================================================
        FULL-SCREEN GLOSSY MULTICOLOUR LIQUID RIVER BACKGROUND
        Fills entire viewport edge to edge (position: fixed; inset: 0; z-index: 0).
        Flows continuously left-to-right with domain-warped waves, secondary currents,
        high-gloss specular highlights, iridescent thin-film sheen, and vibrant colors.
        ========================================================================
      */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundColor: '#030712',
        }}
        aria-hidden="true"
      >
        {/* WebGL Canvas */}
        {currentMode === 'webgl' && (
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* 
          ======================================================================
          FALLBACK RENDERER: SVG DISPLACEMENT LIQUID RIVER
          Activated if WebGL is unavailable or when context is lost
          Animated feTurbulence + feDisplacementMap over multicolour river gradient
          ======================================================================
        */}
        {currentMode === 'svg' && (
          <div className="w-full h-full relative overflow-hidden bg-slate-950">
            <svg
              className="w-full h-full absolute inset-0"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <filter id="svg-liquid-river-displacement" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.009 0.016"
                    numOctaves="3"
                    seed="7"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="58"
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="displaced"
                  />
                  <feGaussianBlur in="displaced" stdDeviation="4" result="blurred" />
                  <feBlend in="SourceGraphic" in2="blurred" mode="multiply" />
                </filter>

                {/* Multicolour river gradient across spectrum */}
                <linearGradient
                  id="svg-river-spectrum-grad"
                  x1="0%"
                  y1="20%"
                  x2="100%"
                  y2="80%"
                  gradientTransform={`rotate(${-14 + Math.sin(svgTime * 0.4) * 6})`}
                >
                  <stop offset="0%" stopColor="#d946ef" />   {/* Magenta */}
                  <stop offset="18%" stopColor="#8b5cf6" />  {/* Violet */}
                  <stop offset="36%" stopColor="#3b82f6" />  {/* Blue */}
                  <stop offset="52%" stopColor="#06b6d4" />  {/* Cyan */}
                  <stop offset="68%" stopColor="#10b981" />  {/* Emerald / Teal */}
                  <stop offset="84%" stopColor="#eab308" />  {/* Yellow / Amber */}
                  <stop offset="100%" stopColor="#f43f5e" /> {/* Red / Coral */}
                </linearGradient>

                <linearGradient id="svg-river-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
                </linearGradient>
              </defs>

              <g filter="url(#svg-liquid-river-displacement)">
                {/* Full-screen flowing liquid base */}
                <rect width="1000" height="1000" fill="url(#svg-river-spectrum-grad)" />

                {/* Secondary flowing current ribbon */}
                <path
                  d={`M -200 ${300 + Math.sin(svgTime * 0.9) * 80} Q 300 ${150 + Math.cos(svgTime * 0.8) * 90} 700 ${450 + Math.sin(svgTime * 1.1) * 80} T 1200 ${350} L 1200 900 L -200 900 Z`}
                  fill="url(#svg-river-spectrum-grad)"
                  opacity="0.85"
                />

                {/* Meandering stream crests */}
                <path
                  d={`M -100 ${150 + Math.cos(svgTime * 0.7) * 60} Q 400 ${380 + Math.sin(svgTime * 0.8) * 80} 800 ${220 + Math.cos(svgTime * 0.9) * 60} T 1200 ${480} L 1200 700 L -100 700 Z`}
                  fill="url(#svg-river-shimmer-grad)"
                  opacity="0.55"
                />
              </g>

              {/* Glossy specular shine lines traveling along river path */}
              {[0, 1, 2].map((idx) => {
                const yPos = 220 + idx * 260 + Math.sin(svgTime * 0.9 + idx * 1.8) * 70;
                return (
                  <ellipse
                    key={idx}
                    cx={500 + Math.sin(svgTime * 0.6 + idx) * 350}
                    cy={yPos}
                    rx="320"
                    ry="28"
                    fill="white"
                    opacity="0.22"
                    filter="blur(16px)"
                    transform={`rotate(${-12 + idx * 4} 500 ${yPos})`}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* 
          ======================================================================
          READABILITY OVERLAY (12% OPACITY)
          Lightweight so flowing liquid and glossy highlights shine through
          vibrantly while keeping text contrast WCAG AA readable
          ======================================================================
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.12)',
          }}
        />

        {/* Subtle organic noise grain */}
        <div className="absolute inset-0 noise-texture pointer-events-none opacity-10 mix-blend-overlay" />
      </div>

      {/* 
        ========================================================================
        STATUS BADGE (BOTTOM-LEFT)
        Shows: renderer (webgl/svg), colour state, and fps.
        Clickable to toggle between WebGL and SVG river renderers.
        ========================================================================
      */}
      <div
        className="fixed bottom-3 left-3 z-50 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-400/50 text-[11px] font-mono text-cyan-300 pointer-events-auto cursor-pointer shadow-2xl flex items-center gap-2 select-none hover:border-cyan-300 transition-colors"
        onClick={() => {
          const next = currentMode === 'webgl' ? 'svg' : 'webgl';
          setCurrentMode(next);
          onModeChange?.(next);
        }}
        title="Click to toggle between WebGL and SVG liquid river renderers"
        aria-live="polite"
      >
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
          }`}
        />
        <span>
          [LIQUID RIVER: {currentMode.toUpperCase()}] • multicolour flow • {currentColorName} • ambient: {themePreset} • {fps} FPS
          {prefersReducedMotion ? ' (motion: 40%)' : ''}
          {isPaused ? ' (PAUSED)' : ''}
          {isAnalyzing ? ' (THINKING)' : ''}
        </span>
      </div>
    </>
  );
};

export const WaterBackground = LiquidBackground;
