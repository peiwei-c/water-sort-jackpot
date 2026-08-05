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

/** Palette for water color IDs (1-indexed). Supports up to 12 colors for late campaign. */
export const WATER_PALETTE: Record<number, string> = {
  1: '#E63946',
  2: '#457B9D',
  3: '#2A9D8F',
  4: '#E9C46A',
  5: '#9B5DE5',
  6: '#F4A261',
  7: '#00BBF9',
  8: '#F15BB5',
  9: '#06D6A0',
  10: '#EF476F',
  11: '#118AB2',
  12: '#FFD166',
};

export const SYMBOL_EMOJI = {
  drop: '💧',
  coin: '🪙',
  undo: '↺',
  extra_tube: '🧪',
  crown: '👑',
} as const;
