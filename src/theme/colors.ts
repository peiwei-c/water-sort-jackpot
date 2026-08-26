import { BOBA } from './boba';

export const COLORS = {
  bgTop: BOBA.skyTop,
  bgBottom: BOBA.skyFloor,
  surface: 'rgba(255, 248, 240, 0.16)',
  surfaceStrong: 'rgba(255, 248, 240, 0.28)',
  text: BOBA.cream,
  textMuted: 'rgba(255,248,240,0.72)',
  accent: BOBA.straw,
  accentWarm: BOBA.mango,
  danger: BOBA.strawDeep,
  glass: 'rgba(255, 248, 240, 0.22)',
  tubeBorder: 'rgba(255,255,255,0.55)',
  tubeGlass: 'rgba(255,255,255,0.12)',
} as const;

/** Shop / play chrome. Keys stay LAB so existing screens keep compiling. */
export const LAB = {
  benchDeep: BOBA.skyTop,
  benchMid: BOBA.skyMid,
  glass: 'rgba(255, 248, 240, 0.22)',
  glassBright: BOBA.straw,
  glassDim: 'rgba(255, 248, 240, 0.16)',
  reagent: BOBA.mango,
  reagentSoft: 'rgba(255, 183, 3, 0.28)',
  hazard: BOBA.straw,
  grid: 'rgba(255, 208, 138, 0.14)',
  pipe: 'rgba(255, 183, 3, 0.45)',
  pipeLocked: 'rgba(255,255,255,0.12)',
  flaskFill: 'rgba(242, 92, 120, 0.55)',
  label: BOBA.sign,
} as const;

/** Palette for water color IDs (1-indexed). Supports up to 12 colors for late campaign.
 * Chosen for high perceptual separation (CIE76 ΔE) on the dark lab bench.
 */
export const WATER_PALETTE: Record<number, string> = {
  1: '#F2460D', // vivid orange-red
  2: '#F2F20D', // bright yellow
  3: '#4BAB2B', // leaf green
  4: '#0DF20D', // neon green
  5: '#0DF2B9', // aqua
  6: '#64D2F7', // sky
  7: '#446CE4', // royal blue
  8: '#800DF2', // violet
  9: '#F764F7', // magenta
  10: '#EB70AD', // pink
  11: '#AB6B2B', // brown
  12: '#DEDE7C', // pale gold
};

/** Spoken labels for water color IDs (a11y). */
export const WATER_COLOR_LABELS: Record<number, string> = {
  1: 'orange-red',
  2: 'yellow',
  3: 'green',
  4: 'neon green',
  5: 'aqua',
  6: 'sky blue',
  7: 'royal blue',
  8: 'violet',
  9: 'magenta',
  10: 'pink',
  11: 'brown',
  12: 'pale gold',
};

export const SYMBOL_EMOJI = {
  drop: '💧',
  coin: '🪙',
  undo: '🔄',
  extra_tube: '🧪',
  crown: '👑',
} as const;
