import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ThemePreset, ThemeConfig } from '../types';

// =========================================================================
// LIQUID CONFIGURATION: Tweak Blob Count, River Speed, and Gloss Strength
// =========================================================================
export const LIQUID_CONFIG = {
  blobCount: 6,        // <-- CHANGE BLOB COUNT HERE (5 to 7 blobs)
  baseSpeed: 0.92,     // <-- CHANGE RIVER FLOW SPEED HERE (Higher = faster stream flow)
  glossStrength: 1.85, // <-- CHANGE GLOSS / SPECULAR SHINE STRENGTH HERE (0.5 to 3.0)
  wobbleAmount: 0.09,  // <-- CHANGE ORGANIC NOISE WOBBLE HERE (0.0 = smooth circles)
  sminK: 0.36,         // <-- CHANGE METABALL SMOOTH UNION MERGE RADIUS HERE
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

// Idle 25-second continuous liquid color loop:
// deep blue → turquoise → teal → violet → deep blue
interface LiquidColorKeyframe {
  pct: number;
  name: string;
  c1: [number, number, number]; // Deep base
  c2: [number, number, number]; // Mid fluid body
  c3: [number, number, number]; // Surface / rim accent
}

const LIQUID_25S_LOOP: LiquidColorKeyframe[] = [
  {
    pct: 0.0,
    name: 'deep sapphire',
    c1: [4, 28, 75],        // #041c4b
    c2: [14, 95, 215],      // #0e5fd7
    c3: [34, 185, 255],     // #22b9ff
  },
  {
    pct: 0.25,
    name: 'turquoise river',
    c1: [3, 50, 72],        // #033248
    c2: [10, 165, 205],     // #0aa5cd
    c3: [8, 220, 245],      // #08dcf5
  },
  {
    pct: 0.50,
    name: 'teal cascade',
    c1: [3, 52, 48],        // #033430
    c2: [16, 175, 160],     // #10afa0
    c3: [35, 225, 200],     // #23e1c8
  },
  {
    pct: 0.75,
    name: 'violet current',
    c1: [38, 12, 75],       // #260c4b
    c2: [140, 68, 255],     // #8c44ff
    c3: [195, 115, 255],    // #c373ff
  },
  {
    pct: 1.0,
    name: 'deep sapphire',
    c1: [4, 28, 75],        // #041c4b
    c2: [14, 95, 215],      // #0e5fd7
    c3: [34, 185, 255],     // #22b9ff
  },
];

// =========================================================================
// AMBIENT LIGHT THEME PROFILES
// Defines the ambient light tint and breathing pulse rhythm tailored to each preset
// =========================================================================
interface AmbientLightProfile {
  name: string;
  tint: [number, number, number]; // RGB 0..255
  frequency: number;              // speed of the breathing pulse
  calcPulse: (time: number) => number; // 0..1 smooth pulse factor
}

export const THEME_AMBIENT_PROFILES: Record<ThemePreset, AmbientLightProfile> = {
  auto: {
    name: 'Celestial Glow',
    tint: [40, 175, 255], // Celestial Cyan
    frequency: 1.25,
    calcPulse: (t) => 0.5 + 0.5 * Math.sin(t * 1.25),
  },
  aurora: {
    name: 'Borealis Shimmer',
    tint: [110, 245, 190], // Emerald Borealis
    frequency: 1.65,
    calcPulse: (t) => 0.5 + 0.35 * Math.sin(t * 1.65) + 0.15 * Math.cos(t * 3.3),
  },
  sunset: {
    name: 'Hearth Ember',
    tint: [255, 145, 65], // Golden Amber Ember
    frequency: 1.45,
    calcPulse: (t) => Math.pow(Math.sin(t * 1.45) * 0.5 + 0.5, 1.6),
  },
  ocean: {
    name: 'Abyssal Swell',
    tint: [30, 185, 245], // Deep Oceanic Aqua
    frequency: 1.05,
    calcPulse: (t) => 0.5 + 0.5 * Math.sin(t * 1.05),
  },
  forest: {
    name: 'Canopy Bioluminescence',
    tint: [85, 240, 80], // Emerald Lime Canopy
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
// WEBGL SHADER SOURCES: SERPENTINE GLOSSY RIVER FLOW & METABALL FIELD
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
uniform vec3 u_color1; // Deep base liquid color
uniform vec3 u_color2; // Mid liquid body color
uniform vec3 u_color3; // Surface / rim accent color
uniform float u_gloss_strength;
uniform float u_wobble_strength;
uniform float u_splash_pulse;
uniform float u_thinking_pulse;

// Ambient Light uniforms
uniform float u_ambient_pulse;
uniform vec3 u_ambient_tint;
uniform float u_ambient_intensity;

// --- CONFIGURATION CONSTANTS ---
#define NUM_BLOBS 6

// Polynomial smooth-minimum for organic liquid merging (smin)
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * h * k * (1.0 / 6.0);
}

// Fast 2D value noise for river turbulence & organic edge wobble
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// =========================================================================
// FLOW FIELD / VECTOR FIELD MATH FUNCTION
// Computes the 2D directional current velocity V(p, t) at any spatial coordinate.
// Forms a river-like directional current with serpentine meanders and eddies,
// driving blob velocities along a global downstream flow.
// =========================================================================
vec2 getFlowField(vec2 p, float t) {
  // Global river current direction vector (flows diagonally downstream)
  vec2 globalCurrent = normalize(vec2(0.86, -0.50));
  vec2 crossCurrent = vec2(-globalCurrent.y, globalCurrent.x); // Perpendicular to stream

  // Longitudinal position along the river's main streamline
  float longitudinal = dot(p, globalCurrent);

  // Serpentine river meander: wave function that bends the vector field
  float meander = sin(longitudinal * 1.6 - t * 0.40) * 0.42
                + cos(longitudinal * 0.75 + t * 0.22) * 0.22;

  // Local vorticity & eddy perturbation using divergence-free curl from noise
  vec2 sampleCoord = p * 1.35 - globalCurrent * (t * 0.38);
  float n1 = noise(sampleCoord + vec2(1.7, 4.3));
  float n2 = noise(sampleCoord + vec2(8.1, 2.9));
  vec2 eddy = vec2(n2 - 0.5, 0.5 - n1) * 0.32;

  // Directional current velocity: strong downstream base + cross-stream meander + local eddies
  vec2 velocity = globalCurrent * 1.15 + crossCurrent * meander + eddy;

  // --- SUBTLE VORTEX EFFECT AROUND MOUSE POSITION ---
  // Introduces a natural hydrodynamic eddy and circulation that parts and swirls
  // the river current around the cursor like water flowing around an obstacle.
  if (u_mouse_active > 0.01) {
    vec2 toCursor = p - u_mouse;
    float distToMouse = length(toCursor);

    // Smooth Gaussian radial falloff for the cursor vortex
    float vortexFalloff = exp(-distToMouse * 2.2) * u_mouse_active;

    // Tangential circulation vector (swirls liquid around cursor)
    vec2 tangentialSwirl = vec2(-toCursor.y, toCursor.x) / (distToMouse + 0.14);

    // River wake deflection (parting stream smoothly around cursor)
    vec2 deflection = normalize(toCursor + 0.0001) * exp(-distToMouse * 3.2) * 0.40;

    // Combine circulation and deflection into the vector field velocity
    velocity += (tangentialSwirl * 0.95 + deflection) * vortexFalloff;
  }

  return velocity;
}

// Compute blob trajectory and velocity driven by the global flow field current
vec2 getFlowFieldBlobPosition(float t, float phaseOffset, float lateralLane) {
  vec2 globalCurrent = normalize(vec2(0.86, -0.50));
  vec2 crossCurrent = vec2(-globalCurrent.y, globalCurrent.x);

  // Longitudinal loop along the stream: continuous downstream transport
  float loopSpan = 4.2;
  float u = mod(t + phaseOffset, loopSpan) - (loopSpan * 0.5);

  // Evaluate flow field velocity along this streamline slice
  vec2 basePos = globalCurrent * u + crossCurrent * lateralLane;
  vec2 v = getFlowField(basePos, t);

  // Blob velocity and trajectory driven by the flow field vector:
  // Downstream coordinate u + lateral displacement driven by the vector field
  vec2 pos = globalCurrent * u + crossCurrent * (lateralLane + v.y * 0.38);
  return pos;
}

// Metaball & River scalar field distance function
float mapField(vec2 p, float t) {
  // Sample local vector field velocity at current position (includes mouse vortex)
  vec2 v = getFlowField(p, t);

  // Continuous serpentine riverbed channel aligned with the flow field
  vec2 globalCurrent = normalize(vec2(0.86, -0.50));
  vec2 crossCurrent = vec2(-globalCurrent.y, globalCurrent.x);
  float streamPos = dot(p, globalCurrent);
  float meander = sin(streamPos * 1.6 - t * 0.40) * 0.36 + cos(streamPos * 0.75 + t * 0.22) * 0.18;
  float riverDist = abs(dot(p, crossCurrent) - meander) - 0.23;

  // Fluid coordinate advected along the vector field:
  // Creates organic streamline stretching along the current vectors
  vec2 flowOffset = v * (0.075 * u_wobble_strength);
  vec2 pw = p - flowOffset;

  // Mouse interaction: vortex eddy circulation + smooth inward damping
  if (u_mouse_active > 0.01) {
    vec2 relMouse = pw - u_mouse;
    float dMouse = length(relMouse);
    float vortexKern = exp(-dMouse * 2.2) * u_mouse_active;

    // Tangential vortex rotation vector around cursor
    vec2 curlDir = vec2(-relMouse.y, relMouse.x) / (dMouse + 0.14);
    pw += curlDir * (0.24 * vortexKern);

    // Soft inward attraction toward cursor center
    pw -= normalize(relMouse + 0.0001) * (0.16 * vortexKern);
  }

  // 6 Fluid Blobs whose velocities and positions are driven by the vector field
  float tFlow = t * 0.54;

  // Blob 1: Main river surge (center lane)
  vec2 c1 = getFlowFieldBlobPosition(tFlow * 1.05, 0.0, 0.0);
  float r1 = 0.41 + 0.05 * sin(t * 1.2) + u_splash_pulse * 0.18;
  float d1 = length(pw - c1) - r1;

  // Blob 2: Chasing fast droplet (right bank)
  vec2 c2 = getFlowFieldBlobPosition(tFlow * 1.30, 1.35, 0.18);
  float r2 = 0.33 + 0.04 * cos(t * 1.1 + 1.4) + u_splash_pulse * 0.14;
  float d2 = length(pw - c2) - r2;

  // Blob 3: Meandering mid-stream mass (left bank)
  vec2 c3 = getFlowFieldBlobPosition(tFlow * 0.95, 2.65, -0.16);
  float r3 = 0.37 + 0.04 * sin(t * 0.9 + 2.0) + u_splash_pulse * 0.13;
  float d3 = length(pw - c3) - r3;

  // Blob 4: Wide river eddy (outer sweep)
  vec2 c4 = getFlowFieldBlobPosition(tFlow * 1.15, 2.05, 0.22);
  float r4 = 0.35 + 0.045 * sin(t * 1.0 + 3.2) + u_splash_pulse * 0.15;
  float d4 = length(pw - c4) - r4;

  // Blob 5: Counter-swirl tributary (inner curve)
  vec2 c5 = getFlowFieldBlobPosition(tFlow * 0.90, 3.45, -0.22);
  float r5 = 0.29 + 0.03 * cos(t * 1.3 + 0.5) + u_splash_pulse * 0.10;
  float d5 = length(pw - c5) - r5;

  // Blob 6: Ambient crest droplet (downstream crest)
  vec2 c6 = getFlowFieldBlobPosition(tFlow * 1.22, 0.75, 0.08);
  float r6 = 0.32 + 0.035 * sin(t * 1.1 + 4.0) + u_splash_pulse * 0.11;
  float d6 = length(pw - c6) - r6;

  // Smooth union (smin) bridges and merges the river channel and flowing blobs
  float blendK = 0.36;
  float d = smin(riverDist, d1, blendK);
  d = smin(d, d2, blendK);
  d = smin(d, d3, blendK);
  d = smin(d, d4, blendK);
  d = smin(d, d5, blendK);
  d = smin(d, d6, blendK);

  // Dynamic surface ripples moving along the vector field direction
  float riverStreaks = sin(dot(pw, normalize(v)) * 12.0 - t * 4.4) * 0.022 * u_wobble_strength;
  d += riverStreaks;

  // Subtle thinking ripple expansion during analysis loading
  if (u_thinking_pulse > 0.0) {
    float rip = sin(length(pw) * 16.0 - u_thinking_pulse) * 0.03 * u_wobble_strength;
    d += rip;
  }

  return d;
}

void main() {
  vec2 uv = v_uv;
  vec2 p = (uv * 2.0 - 1.0);
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time;
  float d = mapField(p, t);

  // Background: Deep dark gradient behind liquid
  vec3 bgCol = mix(vec3(0.015, 0.022, 0.038), vec3(0.004, 0.007, 0.016), uv.y);
  // Ambient back-glow from the glowing river modulated by the theme's ambient light
  bgCol += mix(u_color1, u_ambient_tint, 0.35) * (0.07 + 0.035 * u_ambient_pulse * u_ambient_intensity) * (1.0 - clamp(length(p * 0.45), 0.0, 1.0));

  // Outside liquid river body with soft glowing aura falloff
  if (d > 0.08) {
    float aura = exp(-d * 22.0) * (0.32 + 0.12 * u_ambient_pulse * u_ambient_intensity);
    vec3 col = bgCol + mix(u_color3, u_ambient_tint, 0.30) * aura;
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  // Compute 3D surface normals from field gradient
  vec2 eps = vec2(2.0 / u_resolution.y, 0.0);
  float dx = mapField(p + eps.xy, t) - mapField(p - eps.xy, t);
  float dy = mapField(p + eps.yx, t) - mapField(p - eps.yx, t);

  float fluidDepth = clamp(-d * 3.8, 0.0, 1.0);
  float zNormal = mix(0.12, 0.95, fluidDepth);
  vec3 N = normalize(vec3(-dx, -dy, zNormal));
  vec3 V = vec3(0.0, 0.0, 1.0); // Viewer facing camera

  // --- ULTRA-GLOSSY VISIBLE SHADING & LIGHTING ---
  // Key light: overhead high-altitude studio lamp
  vec3 L1 = normalize(vec3(0.48, 0.72, 0.82));
  // Secondary fill light: subtle bottom-left cool kicker
  vec3 L2 = normalize(vec3(-0.62, -0.35, 0.65));

  float diff1 = max(0.0, dot(N, L1));
  float diff2 = max(0.0, dot(N, L2));
  float diffuse = diff1 * 0.72 + diff2 * 0.28 + 0.18;

  // 1. Sharp Hotspot Specular Glint (Molten Chrome / High-Gloss Glass reflection)
  vec3 H1 = normalize(L1 + V);
  float specHotspot = pow(max(0.0, dot(N, H1)), 120.0) * 2.2 * u_gloss_strength;

  // 2. Broad Liquid Satin Sheen
  float specSatin = pow(max(0.0, dot(N, H1)), 26.0) * 0.75 * u_gloss_strength;

  // 3. Secondary Light Specular Glint
  vec3 H2 = normalize(L2 + V);
  float specSecondary = pow(max(0.0, dot(N, H2)), 68.0) * 0.65 * u_gloss_strength;

  // 4. Directional River Current Streak (Gloss highlight tracing the vector field flow)
  vec2 localV = getFlowField(p, t);
  vec3 flow3D = normalize(vec3(normalize(localV), 0.32));
  float riverStreak = pow(max(0.0, 1.0 - abs(dot(N, flow3D))), 18.0) * 0.70 * u_gloss_strength;

  // 5. Environmental Reflection Horizon
  vec3 R = reflect(-V, N);
  float envReflection = smoothstep(-0.25, 0.75, R.y) * 0.55 + pow(max(0.0, R.z), 3.0) * 0.4;

  // 6. Fresnel Rim Glow on Liquid Edges
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 2.4);

  // 7. Iridescent Chromatic Dispersion at Grazing Angles
  vec3 chroma = vec3(
    sin(fresnel * 4.5 + 0.2),
    sin(fresnel * 4.5 + 2.3),
    sin(fresnel * 4.5 + 4.4)
  ) * 0.5 + 0.5;
  vec3 iridescentSheen = mix(vec3(1.0), chroma, 0.65);

  // Multi-color liquid blend across the river channel
  float colorPos = clamp((p.y + p.x * 0.5) * 0.55 + 0.5, 0.0, 1.0);
  vec3 baseFluidCol = mix(u_color1 * 1.25, u_color2 * 1.3, colorPos);
  vec3 surfaceCol = mix(baseFluidCol, u_color3 * 1.2, fresnel * 0.75);

  // Translucency & inner glass glow
  float fluidAlpha = smoothstep(0.05, -0.04, d);

  // --- SUBTLE AMBIENT LIGHT PULSE & GLOSSY DEPTH ENHANCEMENT ---
  // Modulates surface intensity and inner depth illumination according to the system theme preset
  float ambientSheenFactor = 1.0 + (u_ambient_pulse * 0.18) * u_ambient_intensity;
  float depthScatter = pow(clamp(-d * 4.2, 0.0, 1.0), 1.25) * (0.32 + 0.16 * u_ambient_pulse * u_ambient_intensity);

  // Composite glossy liquid river
  vec3 fluidCol = surfaceCol * diffuse;
  fluidCol += depthScatter * mix(u_color2, u_ambient_tint, 0.45);
  fluidCol += (specHotspot + specSecondary * 0.5) * mix(vec3(1.0), u_ambient_tint, 0.16) * ambientSheenFactor;
  fluidCol += specSatin * mix(vec3(1.0), u_color3, 0.35) * ambientSheenFactor;
  fluidCol += riverStreak * mix(vec3(0.96, 0.98, 1.0), u_ambient_tint, 0.14) * ambientSheenFactor;
  fluidCol += envReflection * mix(u_color3, u_ambient_tint, 0.40) * (0.45 + 0.20 * u_ambient_pulse * u_ambient_intensity);
  fluidCol += fresnel * u_color3 * 1.15 * iridescentSheen;

  vec3 finalColor = mix(bgCol, fluidCol, fluidAlpha);
  gl_FragColor = vec4(finalColor, 1.0);
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

  // Tab visibility
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() => {
    return typeof document !== 'undefined' ? document.hidden : false;
  });

  useEffect(() => {
    const handleVisibilityChange = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Reduced motion preference
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

  // Interactive mouse cursor coordinates tracked in React state
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

  // Mouse event listeners updating x/y coordinates in React state
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const aspect = w / h;
      const newX = ((e.clientX / w) * 2.0 - 1.0) * aspect;
      const newY = -((e.clientY / h) * 2.0 - 1.0);

      const nextCoords = { x: newX, y: newY };
      setMouseCoords(nextCoords);
      mouseCoordsRef.current = nextCoords;
      mouseActiveRef.current = 1.0;
      mouseLastMovedRef.current = performance.now();
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Convert intensity prop to speed and wobble multipliers
  const { speedMult, wobbleMult } = useMemo(() => {
    let s = 1.0;
    let w = 1.0;
    if (intensity === 'calm') {
      s = 0.58;
      w = 0.55;
    } else if (intensity === 'lively') {
      s = 1.55;
      w = 1.55;
    } else if (typeof intensity === 'number') {
      s = intensity;
      w = intensity;
    }
    return { speedMult: s, wobbleMult: w };
  }, [intensity]);

  // Color management: Idle 25s loop or score-based or manual preset
  const [currentColorName, setCurrentColorName] = useState<string>('deep sapphire');
  const targetColorsRef = useRef<{ c1: [number, number, number]; c2: [number, number, number]; c3: [number, number, number] }>({
    c1: [4, 28, 75],
    c2: [14, 95, 215],
    c3: [34, 185, 255],
  });
  const currentRenderColorsRef = useRef<{ c1: [number, number, number]; c2: [number, number, number]; c3: [number, number, number] }>({
    c1: [4, 28, 75],
    c2: [14, 95, 215],
    c3: [34, 185, 255],
  });

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
      setCurrentColorName(name);
      return;
    }

    if (hasAnalyzed && matchScore !== null && matchScore !== undefined) {
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
      console.warn('WebGL unavailable, falling back to SVG gooey liquid renderer');
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
      u_gloss_strength: gl.getUniformLocation(program, 'u_gloss_strength'),
      u_wobble_strength: gl.getUniformLocation(program, 'u_wobble_strength'),
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
      console.warn('WebGL context lost, falling back to SVG gooey liquid renderer');
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

        if (themePreset === 'auto' && (!hasAnalyzed || matchScore === null)) {
          const loopPeriod = 25.0;
          const loopTime = animTimeRef.current % loopPeriod;
          const pct = loopTime / loopPeriod;

          let k1 = LIQUID_25S_LOOP[0];
          let k2 = LIQUID_25S_LOOP[1];
          for (let i = 0; i < LIQUID_25S_LOOP.length - 1; i++) {
            if (pct >= LIQUID_25S_LOOP[i].pct && pct <= LIQUID_25S_LOOP[i + 1].pct) {
              k1 = LIQUID_25S_LOOP[i];
              k2 = LIQUID_25S_LOOP[i + 1];
              break;
            }
          }
          const span = k2.pct - k1.pct;
          const t = span > 0 ? (pct - k1.pct) / span : 0;

          targetColorsRef.current = {
            c1: lerpRGB(k1.c1, k2.c1, t),
            c2: lerpRGB(k1.c2, k2.c2, t),
            c3: lerpRGB(k1.c3, k2.c3, t),
          };
          setCurrentColorName(t < 0.5 ? k1.name : k2.name);
        }

        const colorLerpRate = Math.min(rawDt * 2.2, 1.0);
        currentRenderColorsRef.current = {
          c1: lerpRGB(currentRenderColorsRef.current.c1, targetColorsRef.current.c1, colorLerpRate),
          c2: lerpRGB(currentRenderColorsRef.current.c2, targetColorsRef.current.c2, colorLerpRate),
          c3: lerpRGB(currentRenderColorsRef.current.c3, targetColorsRef.current.c3, colorLerpRate),
        };
      }

      if (currentMode === 'webgl' && glRef.current && programRef.current) {
        const gl = glRef.current;
        const canvas = canvasRef.current;

        if (canvas) {
          const isMobile = window.innerWidth < 768;
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (isMobile ? 0.65 : 1.0);
          const displayWidth = Math.floor(canvas.clientWidth * dpr);
          const displayHeight = Math.floor(canvas.clientHeight * dpr);

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

          gl.uniform1f(u.u_gloss_strength, LIQUID_CONFIG.glossStrength);
          gl.uniform1f(u.u_wobble_strength, LIQUID_CONFIG.wobbleAmount * wobbleMult * (prefersReducedMotion ? 0.45 : 1.0));
          gl.uniform1f(u.u_splash_pulse, splashPulseRef.current);
          gl.uniform1f(u.u_thinking_pulse, isAnalyzing ? thinkingPulseRef.current : 0.0);

          // Subtle Ambient Light pulse tailored to system theme preset
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
  }, [currentMode, isPaused, isTabHidden, prefersReducedMotion, isAnalyzing, hasAnalyzed, matchScore, themePreset, speedMult, wobbleMult, mouseCoords]);

  // Fallback SVG Gooey River Flow
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

  const c = currentRenderColorsRef.current;
  const col1Hex = `rgb(${Math.round(c.c1[0])}, ${Math.round(c.c1[1])}, ${Math.round(c.c1[2])})`;
  const col2Hex = `rgb(${Math.round(c.c2[0])}, ${Math.round(c.c2[1])}, ${Math.round(c.c2[2])})`;
  const col3Hex = `rgb(${Math.round(c.c3[0])}, ${Math.round(c.c3[1])}, ${Math.round(c.c3[2])})`;

  return (
    <>
      {/* 
        ========================================================================
        DYNAMIC GLOSSY LIQUID RIVER BACKGROUND
        Flows continuously diagonally across screen like a liquid river.
        High-gloss specular reflections, directional current lines, and metaball merges.
        ========================================================================
      */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundColor: '#020617',
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
          FALLBACK RENDERER: SVG GOOEY LIQUID RIVER
          Activated if WebGL is unavailable or when user selects SVG mode
          ======================================================================
        */}
        {currentMode === 'svg' && (
          <div className="w-full h-full relative overflow-hidden bg-slate-950">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
              <defs>
                <filter id="gooey-liquid-river-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 34 -11"
                    result="goo"
                  />
                  <feBlend in="SourceGraphic" in2="goo" />
                </filter>
                <linearGradient id="liquid-river-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={col3Hex} stopOpacity="0.95" />
                  <stop offset="50%" stopColor={col2Hex} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={col1Hex} stopOpacity="0.80" />
                </linearGradient>
              </defs>

              <g filter="url(#gooey-liquid-river-filter)">
                {/* 6 Flowing River Blobs looping downstream */}
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const offset = idx * 200;
                  const streamProgress = ((svgTime * 110 + offset) % 1300) - 150;
                  const cx = streamProgress * 0.85;
                  const cy = 250 + streamProgress * 0.52 + Math.sin(svgTime * 0.8 + idx) * 110;
                  const r = 135 + Math.sin(svgTime * 1.2 + idx * 1.5) * 22;
                  return (
                    <circle
                      key={idx}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="url(#liquid-river-grad)"
                    />
                  );
                })}
              </g>

              {/* Glossy specular shine arcs along river blobs */}
              {[0, 2, 4].map((idx) => {
                const offset = idx * 200;
                const streamProgress = ((svgTime * 110 + offset) % 1300) - 150;
                const cx = streamProgress * 0.85 - 35;
                const cy = 250 + streamProgress * 0.52 + Math.sin(svgTime * 0.8 + idx) * 110 - 35;
                return (
                  <circle
                    key={`shine-${idx}`}
                    cx={cx}
                    cy={cy}
                    r={45}
                    fill="white"
                    opacity="0.32"
                    filter="blur(12px)"
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* 
          ======================================================================
          READABILITY OVERLAY (13% OPACITY)
          Lightweight so flowing liquid and glossy highlights shine through
          vibrantly while keeping text contrast WCAG AA readable
          ======================================================================
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.13)',
          }}
        />

        {/* Subtle organic noise grain */}
        <div className="absolute inset-0 noise-texture pointer-events-none opacity-10 mix-blend-overlay" />
      </div>

      {/* 
        ========================================================================
        STATUS BADGE (BOTTOM-LEFT)
        Shows: renderer (webgl/svg), colour state, blob count, and fps.
        Clickable to toggle between WebGL and SVG Gooey fallback renderer.
        ========================================================================
      */}
      <div
        className="fixed bottom-3 left-3 z-50 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-cyan-400/50 text-[11px] font-mono text-cyan-300 pointer-events-auto cursor-pointer shadow-2xl flex items-center gap-2 select-none hover:border-cyan-300 transition-colors"
        onClick={() => {
          const next = currentMode === 'webgl' ? 'svg' : 'webgl';
          setCurrentMode(next);
          onModeChange?.(next);
        }}
        title="Click to toggle between WebGL and SVG Gooey liquid renderers"
        aria-live="polite"
      >
        <span
          className={`w-2 h-2 rounded-full transition-colors ${
            isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
          }`}
        />
        <span>
          [LIQUID RIVER: {currentMode.toUpperCase()}] • {LIQUID_CONFIG.blobCount} blobs • {currentColorName} • ambient: {themePreset} • {fps} FPS
          {prefersReducedMotion ? ' (motion: 40%)' : ''}
          {isPaused ? ' (PAUSED)' : ''}
          {isAnalyzing ? ' (THINKING)' : ''}
        </span>
      </div>
    </>
  );
};

export const WaterBackground = LiquidBackground;
