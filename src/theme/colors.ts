export const COLORS = {
  bgTop: '#06141C',
  bgBottom: '#0C2A32',
  surface: 'rgba(126, 227, 214, 0.12)',
  surfaceStrong: 'rgba(126, 227, 214, 0.18)',
  text: '#F4F7FB',
  textMuted: 'rgba(244,247,251,0.65)',
  accent: '#7EE3D6',
  accentWarm: '#F0B429',
  danger: '#E85D4C',
  glass: 'rgba(126, 227, 214, 0.22)',
  tubeBorder: 'rgba(126, 227, 214, 0.55)',
  tubeGlass: 'rgba(126, 227, 214, 0.08)',
} as const;

/** Laboratory home-path palette (glass, reagents, bench). */
export const LAB = {
  benchDeep: '#06141C',
  benchMid: '#0C2A32',
  glass: 'rgba(126, 227, 214, 0.22)',
  glassBright: '#7EE3D6',
  glassDim: 'rgba(126, 227, 214, 0.12)',
  reagent: '#F0B429',
  reagentSoft: 'rgba(240, 180, 41, 0.28)',
  hazard: '#E85D4C',
  grid: 'rgba(126, 227, 214, 0.07)',
  pipe: 'rgba(170, 230, 220, 0.45)',
  pipeLocked: 'rgba(255,255,255,0.12)',
  flaskFill: 'rgba(46, 196, 182, 0.55)',
  label: '#9FD8CF',
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
