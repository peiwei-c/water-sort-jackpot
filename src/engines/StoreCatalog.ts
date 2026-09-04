/**
 * Shop catalog — shop looks, cup cosmetics, and drink color palettes.
 * Pure data; no UI / ads.
 */

import { WATER_PALETTE } from '../theme/colors';

export type StoreKind = 'path' | 'vial' | 'palette';

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

/** Liquid color IDs 1…12 for the sorting bench. */
export type WaterPaletteTokens = Record<number, string>;

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
  waterPalette?: WaterPaletteTokens;
};

export const PATH_DEFAULT = 'path_default';
export const VIAL_DEFAULT = 'vial_default';
export const VIAL_CROWN = 'vial_crown';
export const PALETTE_DEFAULT = 'palette_default';

const CLASSIC_PALETTE: WaterPaletteTokens = { ...WATER_PALETTE };

export const STORE_ITEMS: StoreItem[] = [
  {
    id: PATH_DEFAULT,
    kind: 'path',
    name: 'House shop',
    blurb: 'Classic wood counter · normal pour budget.',
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
    name: 'Honey shop',
    blurb: 'Challenge · 10% fewer pours.',
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
    name: 'Night market',
    blurb: 'Challenge · 20% fewer pours.',
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
    name: 'Late night',
    blurb: 'Challenge · 30% fewer pours.',
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
    name: 'House cup',
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
    name: 'Matcha cup',
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
    name: 'Honey cup',
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
    name: 'Crown cup',
    blurb: 'Cosmetic only · also from Lucky crown.',
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
  {
    id: PALETTE_DEFAULT,
    kind: 'palette',
    name: 'House menu',
    blurb: 'Default drink colors · every hue is easy to tell apart.',
    price: 0,
    waterPalette: CLASSIC_PALETTE,
  },
  {
    id: 'palette_neon',
    kind: 'palette',
    name: 'Neon menu',
    blurb: 'Electric liquids · high-contrast color theme.',
    price: 75,
    waterPalette: {
      1: '#E03C06',
      2: '#FBD051',
      3: '#BDEE2B',
      4: '#1FF91F',
      5: '#5AF2A6',
      6: '#5ACCF2',
      7: '#1F56F9',
      8: '#5A80F2',
      9: '#8C1FF9',
      10: '#FB51FB',
      11: '#FB51A6',
      12: '#F91F56',
    },
  },
  {
    id: 'palette_pastel',
    kind: 'palette',
    name: 'Soft Pastel',
    blurb: 'Soft liquids kept clearly separable · color theme.',
    price: 70,
    waterPalette: {
      1: '#DB6943',
      2: '#DBDB43',
      3: '#8FC559',
      4: '#43DB43',
      5: '#43DBB5',
      6: '#43B5DB',
      7: '#6584E2',
      8: '#DB43DB',
      9: '#DA95C9',
      10: '#DB438F',
      11: '#DAA695',
      12: '#DADA95',
    },
  },
  {
    id: 'palette_sunset',
    kind: 'palette',
    name: 'Sunset Spectrum',
    blurb: 'Dusk palette with cool accents · high contrast.',
    price: 95,
    waterPalette: {
      1: '#EF0606',
      2: '#FB7F56',
      3: '#F2F25F',
      4: '#7AEF06',
      5: '#669E2E',
      6: '#9E822E',
      7: '#56D1FB',
      8: '#3759BE',
      9: '#5A24F9',
      10: '#FB56FB',
      11: '#FC7EBD',
      12: '#AD1F42',
    },
  },
  {
    id: 'palette_ocean',
    kind: 'palette',
    name: 'Deep Ocean',
    blurb: 'Sea + reef accents · easy-to-tell hues.',
    price: 90,
    waterPalette: {
      1: '#EF4006',
      2: '#EE8F2F',
      3: '#EBBD8E',
      4: '#06EF40',
      5: '#2E9E66',
      6: '#98E1CF',
      7: '#2FBEEE',
      8: '#1F66AD',
      9: '#2F5FEE',
      10: '#7A06EF',
      11: '#C079D8',
      12: '#9E4A2E',
    },
  },
  {
    id: 'palette_candy',
    kind: 'palette',
    name: 'Candy Pop',
    blurb: 'Bright candy liquids · high-contrast theme.',
    price: 110,
    waterPalette: {
      1: '#DA3F0B',
      2: '#ED825E',
      3: '#F6CE55',
      4: '#BAE830',
      5: '#25F425',
      6: '#5EEDA6',
      7: '#55CEF6',
      8: '#557EF6',
      9: '#8C25F4',
      10: '#F655F6',
      11: '#F655A6',
      12: '#F42559',
    },
  },
  {
    id: 'palette_forest',
    kind: 'palette',
    name: 'Forest Canopy',
    blurb: 'Woodland mix (bark, berry, sky) · high contrast.',
    price: 85,
    waterPalette: {
      1: '#EF4006',
      2: '#AD661F',
      3: '#F5D984',
      4: '#66AD1F',
      5: '#24F924',
      6: '#06EFB5',
      7: '#56D1FB',
      8: '#1F66AD',
      9: '#7A06EF',
      10: '#C079D8',
      11: '#BE3759',
      12: '#E19898',
    },
  },
  {
    id: 'palette_aurora',
    kind: 'palette',
    name: 'Aurora Borealis',
    blurb: 'Northern-light dyes · spaced for readability.',
    price: 130,
    waterPalette: {
      1: '#EF4006',
      2: '#BD910F',
      3: '#F9F924',
      4: '#0FBD66',
      5: '#7EFCDC',
      6: '#56D1FB',
      7: '#1F66AD',
      8: '#5A24F9',
      9: '#C079D8',
      10: '#F924F9',
      11: '#F9245A',
      12: '#E1AA98',
    },
  },
];

export const DEFAULT_OWNED = [PATH_DEFAULT, VIAL_DEFAULT, PALETTE_DEFAULT];

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

export function getWaterPalette(id: string): WaterPaletteTokens {
  return (
    getStoreItem(id)?.waterPalette ??
    getStoreItem(PALETTE_DEFAULT)!.waterPalette!
  );
}

/** Hex for a color id under the equipped palette. */
export function waterColor(paletteId: string, colorId: number): string {
  const palette = getWaterPalette(paletteId);
  return palette[colorId] ?? WATER_PALETTE[colorId] ?? '#888888';
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

const CATALOG_IDS = new Set(STORE_ITEMS.map((i) => i.id));

/** Drop unknown / injected IDs, then apply free defaults. */
export function sanitizeOwnedItemIds(
  owned: unknown,
  rareSkinUnlocked?: boolean,
): string[] {
  const list = Array.isArray(owned)
    ? owned.filter((id): id is string => typeof id === 'string' && CATALOG_IDS.has(id))
    : [];
  return ensureOwnedDefaults(list, rareSkinUnlocked);
}
