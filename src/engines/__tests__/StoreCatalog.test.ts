import {
  STORE_ITEMS,
  ensureOwnedDefaults,
  sanitizeOwnedItemIds,
  getStoreItem,
  getPathTheme,
  getVialTheme,
  getPathMoveScale,
  scaledMoveLimit,
  PATH_DEFAULT,
  VIAL_DEFAULT,
  VIAL_CROWN,
  DEFAULT_OWNED,
} from '../StoreCatalog';

describe('StoreCatalog', () => {
  it('has free default path and vial', () => {
    expect(getStoreItem(PATH_DEFAULT)?.price).toBe(0);
    expect(getStoreItem(VIAL_DEFAULT)?.price).toBe(0);
    expect(STORE_ITEMS.every((i) => i.pathTheme || i.vialTheme)).toBe(true);
  });

  it('ensureOwnedDefaults always includes starters', () => {
    expect(ensureOwnedDefaults([])).toEqual(
      expect.arrayContaining(DEFAULT_OWNED),
    );
  });

  it('sanitizeOwnedItemIds drops unknown catalog ids', () => {
    const owned = sanitizeOwnedItemIds(
      [PATH_DEFAULT, 'hacked_skin', VIAL_CROWN],
      false,
    );
    expect(owned).toContain(PATH_DEFAULT);
    expect(owned).toContain(VIAL_DEFAULT);
    expect(owned).toContain(VIAL_CROWN);
    expect(owned).not.toContain('hacked_skin');
  });

  it('migrates rareSkinUnlocked to crown vial', () => {
    const owned = ensureOwnedDefaults([PATH_DEFAULT], true);
    expect(owned).toContain(VIAL_CROWN);
  });

  it('resolves path and vial themes with fallbacks', () => {
    expect(getPathTheme('missing').glassBright).toBe(
      getPathTheme(PATH_DEFAULT).glassBright,
    );
    expect(getVialTheme('missing').selectGlow).toBe(
      getVialTheme(VIAL_DEFAULT).selectGlow,
    );
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
