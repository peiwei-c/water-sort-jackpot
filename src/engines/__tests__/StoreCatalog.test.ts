import {
  STORE_ITEMS,
  ensureOwnedDefaults,
  sanitizeOwnedItemIds,
  getStoreItem,
  getPathTheme,
  getVialTheme,
  getWaterPalette,
  waterColor,
  getPathMoveScale,
  scaledMoveLimit,
  PATH_DEFAULT,
  VIAL_DEFAULT,
  VIAL_CROWN,
  PALETTE_DEFAULT,
  DEFAULT_OWNED,
} from '../StoreCatalog';
import { WATER_PALETTE } from '../../theme/colors';
import {
  isPaletteDistinct,
  analyzePaletteDistinctness,
  MIN_WATER_COLOR_DELTA_E,
  MIN_WATER_LIGHTNESS,
} from '../colorDistinctness';

describe('StoreCatalog', () => {
  it('has free default path, vial, and color palette', () => {
    expect(getStoreItem(PATH_DEFAULT)?.price).toBe(0);
    expect(getStoreItem(VIAL_DEFAULT)?.price).toBe(0);
    expect(getStoreItem(PALETTE_DEFAULT)?.price).toBe(0);
    expect(
      STORE_ITEMS.every((i) => i.pathTheme || i.vialTheme || i.waterPalette),
    ).toBe(true);
  });

  it('ensureOwnedDefaults always includes starters', () => {
    expect(ensureOwnedDefaults([])).toEqual(
      expect.arrayContaining(DEFAULT_OWNED),
    );
    expect(DEFAULT_OWNED).toContain(PALETTE_DEFAULT);
  });

  it('sanitizeOwnedItemIds drops unknown catalog ids', () => {
    const owned = sanitizeOwnedItemIds(
      [PATH_DEFAULT, 'hacked_skin', VIAL_CROWN],
      false,
    );
    expect(owned).toContain(PATH_DEFAULT);
    expect(owned).toContain(VIAL_DEFAULT);
    expect(owned).toContain(PALETTE_DEFAULT);
    expect(owned).toContain(VIAL_CROWN);
    expect(owned).not.toContain('hacked_skin');
  });

  it('migrates rareSkinUnlocked to crown vial', () => {
    const owned = ensureOwnedDefaults([PATH_DEFAULT], true);
    expect(owned).toContain(VIAL_CROWN);
  });

  it('resolves path, vial, and palette themes with fallbacks', () => {
    expect(getPathTheme('missing').glassBright).toBe(
      getPathTheme(PATH_DEFAULT).glassBright,
    );
    expect(getVialTheme('missing').selectGlow).toBe(
      getVialTheme(VIAL_DEFAULT).selectGlow,
    );
    expect(getWaterPalette('missing')[1]).toBe(WATER_PALETTE[1]);
    expect(waterColor(PALETTE_DEFAULT, 1)).toBe(WATER_PALETTE[1]);
    expect(waterColor('palette_neon', 1)).toBe('#E03C06');
  });

  it('sells multiple paid color themes for coins', () => {
    const palettes = STORE_ITEMS.filter((i) => i.kind === 'palette');
    expect(palettes.length).toBeGreaterThanOrEqual(6);
    const paid = palettes.filter((i) => i.price > 0);
    expect(paid.every((i) => (i.price ?? 0) >= 70)).toBe(true);
    expect(
      paid.every((i) => Object.keys(i.waterPalette ?? {}).length === 12),
    ).toBe(true);
  });

  it('keeps every liquid palette easy to tell apart in play', () => {
    const palettes = STORE_ITEMS.filter((i) => i.kind === 'palette');
    for (const item of palettes) {
      const report = analyzePaletteDistinctness(item.waterPalette!);
      expect(report.tooClose).toEqual([]);
      expect(report.tooDark).toEqual([]);
      expect(report.minDeltaE).toBeGreaterThanOrEqual(MIN_WATER_COLOR_DELTA_E);
      expect(report.minLightness).toBeGreaterThanOrEqual(MIN_WATER_LIGHTNESS);
      expect(isPaletteDistinct(item.waterPalette!)).toBe(true);
    }
    expect(isPaletteDistinct(WATER_PALETTE)).toBe(true);
  });

  it('paid paths reduce move budgets and never increase them', () => {
    expect(getPathMoveScale(PATH_DEFAULT)).toBe(1);
    expect(getPathMoveScale('path_amber')).toBe(0.9);
    expect(getPathMoveScale('path_coral')).toBe(0.8);
    expect(getPathMoveScale('path_midnight')).toBe(0.7);
    expect(scaledMoveLimit(40, 'path_midnight')).toBe(28);
    expect(scaledMoveLimit(40, 'path_midnight')).toBeLessThan(
      scaledMoveLimit(40, PATH_DEFAULT),
    );
  });
});
