/**
 * Lab store catalog — path themes and vial cosmetics.
 * Pure data; no UI / ads.
 */

export type StoreKind = 'path' | 'vial';

export type PathThemeTokens = {
  glassBright: string;
  reagent: string;
  hazard: string;
  pipe: string;
  flaskFill: string;
  flaskBorder: string;
  label: string;
  glow: string;
};

export type VialThemeTokens = {
  rim: string;
  rimBorder: string;
  glassBorder: string;
  glassFill: string;
  selectGlow: string;
  base: string;
};

export type StoreItem = {
  id: string;
  kind: StoreKind;
  name: string;
  blurb: string;
  /** 0 = free starter item */
  price: number;
  /**
   * Path challenge multiplier for move budgets (1 = normal).
   * Paid paths are harder (lower), never easier — not pay-to-win.
   */
  moveScale?: number;
  pathTheme?: PathThemeTokens;
  vialTheme?: VialThemeTokens;
};

export const PATH_DEFAULT = 'path_default';
export const VIAL_DEFAULT = 'vial_default';
export const VIAL_CROWN = 'vial_crown';

export const STORE_ITEMS: StoreItem[] = [
  {
    id: PATH_DEFAULT,
    kind: 'path',
    name: 'Standard Lab',
    blurb: 'Classic teal conduits · normal move budget.',
    price: 0,
    moveScale: 1,
    pathTheme: {
      glassBright: '#7EE3D6',
      reagent: '#F0B429',
      hazard: '#E85D4C',
      pipe: 'rgba(170, 230, 220, 0.45)',
      flaskFill: 'rgba(46, 196, 182, 0.55)',
      flaskBorder: '#7EE3D6',
      label: '#9FD8CF',
      glow: '#7EE3D6',
    },
  },
  {
    id: 'path_amber',
    kind: 'path',
    name: 'Amber Conduit',
    blurb: 'Exclusive look · 10% fewer moves.',
    price: 80,
    moveScale: 0.9,
    pathTheme: {
      glassBright: '#F0B429',
      reagent: '#FFD56A',
      hazard: '#E85D4C',
      pipe: 'rgba(240, 180, 41, 0.45)',
      flaskFill: 'rgba(240, 180, 41, 0.45)',
      flaskBorder: '#F0B429',
      label: '#E8C878',
      glow: '#F0B429',
    },
  },
  {
    id: 'path_coral',
    kind: 'path',
    name: 'Hazard Line',
    blurb: 'Exclusive look · 20% fewer moves.',
    price: 120,
    moveScale: 0.8,
    pathTheme: {
      glassBright: '#F08070',
      reagent: '#F0B429',
      hazard: '#E85D4C',
      pipe: 'rgba(232, 93, 76, 0.4)',
      flaskFill: 'rgba(232, 93, 76, 0.4)',
      flaskBorder: '#E85D4C',
      label: '#F0A898',
      glow: '#E85D4C',
    },
  },
  {
    id: 'path_midnight',
    kind: 'path',
    name: 'Midnight Glass',
    blurb: 'Rarest look · 30% fewer moves.',
    price: 160,
    moveScale: 0.7,
    pathTheme: {
      glassBright: '#7EB8E8',
      reagent: '#A8D4F0',
      hazard: '#5B9BD5',
      pipe: 'rgba(126, 184, 232, 0.4)',
      flaskFill: 'rgba(91, 155, 213, 0.45)',
      flaskBorder: '#7EB8E8',
      label: '#9EC4E0',
      glow: '#5B9BD5',
    },
  },
  {
    id: VIAL_DEFAULT,
    kind: 'vial',
    name: 'Clear Glass',
    blurb: 'Cosmetic only · no gameplay change.',
    price: 0,
    vialTheme: {
      rim: 'rgba(126, 227, 214, 0.45)',
      rimBorder: 'rgba(200, 255, 245, 0.55)',
      glassBorder: 'rgba(126, 227, 214, 0.55)',
      glassFill: 'rgba(126, 227, 214, 0.08)',
      selectGlow: '#7EE3D6',
      base: 'rgba(126, 227, 214, 0.22)',
    },
  },
  {
    id: 'vial_teal',
    kind: 'vial',
    name: 'Teal Crystal',
    blurb: 'Cosmetic only · no gameplay change.',
    price: 60,
    vialTheme: {
      rim: 'rgba(80, 220, 200, 0.65)',
      rimBorder: 'rgba(180, 255, 240, 0.8)',
      glassBorder: 'rgba(46, 196, 182, 0.85)',
      glassFill: 'rgba(46, 196, 182, 0.14)',
      selectGlow: '#2EC4B6',
      base: 'rgba(46, 196, 182, 0.35)',
    },
  },
  {
    id: 'vial_amber',
    kind: 'vial',
    name: 'Reagent Amber',
    blurb: 'Cosmetic only · no gameplay change.',
    price: 90,
    vialTheme: {
      rim: 'rgba(240, 180, 41, 0.55)',
      rimBorder: 'rgba(255, 230, 150, 0.7)',
      glassBorder: 'rgba(240, 180, 41, 0.75)',
      glassFill: 'rgba(240, 180, 41, 0.12)',
      selectGlow: '#F0B429',
      base: 'rgba(240, 180, 41, 0.3)',
    },
  },
  {
    id: VIAL_CROWN,
    kind: 'vial',
    name: 'Crown Alloy',
    blurb: 'Cosmetic only · also from Centrifuge crown.',
    price: 150,
    vialTheme: {
      rim: 'rgba(255, 215, 100, 0.7)',
      rimBorder: 'rgba(255, 240, 180, 0.9)',
      glassBorder: 'rgba(255, 200, 80, 0.85)',
      glassFill: 'rgba(255, 200, 80, 0.14)',
      selectGlow: '#FFD166',
      base: 'rgba(255, 200, 80, 0.35)',
    },
  },
];

export const DEFAULT_OWNED = [PATH_DEFAULT, VIAL_DEFAULT];

export function getStoreItem(id: string): StoreItem | undefined {
  return STORE_ITEMS.find((i) => i.id === id);
}

export function itemsOfKind(kind: StoreKind): StoreItem[] {
  return STORE_ITEMS.filter((i) => i.kind === kind);
}

export function getPathTheme(id: string): PathThemeTokens {
  return (
    getStoreItem(id)?.pathTheme ??
    getStoreItem(PATH_DEFAULT)!.pathTheme!
  );
}

/** Move budget scale for an equipped path (≤ 1 — never easier than default). */
export function getPathMoveScale(id: string): number {
  const scale = getStoreItem(id)?.moveScale ?? 1;
  return Math.min(1, Math.max(0.5, scale));
}

export function scaledMoveLimit(baseLimit: number, pathId: string): number {
  const scaled = Math.round(baseLimit * getPathMoveScale(pathId));
  return Math.max(8, scaled);
}

export function getVialTheme(id: string): VialThemeTokens {
  return (
    getStoreItem(id)?.vialTheme ??
    getStoreItem(VIAL_DEFAULT)!.vialTheme!
  );
}

export function ensureOwnedDefaults(
  owned: string[],
  rareSkinUnlocked?: boolean,
): string[] {
  const set = new Set(owned);
  for (const id of DEFAULT_OWNED) set.add(id);
  if (rareSkinUnlocked) set.add(VIAL_CROWN);
  return Array.from(set);
}
