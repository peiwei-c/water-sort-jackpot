import {
  STORE_ITEMS,
  ensureOwnedDefaults,
  getStoreItem,
  getPathTheme,
  getVialTheme,
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

  it('prices paid cosmetics above starting coin cushion', () => {
    const paid = STORE_ITEMS.filter((i) => i.price > 0);
    expect(paid.length).toBeGreaterThan(0);
    expect(Math.min(...paid.map((i) => i.price))).toBeGreaterThanOrEqual(60);
  });
});
