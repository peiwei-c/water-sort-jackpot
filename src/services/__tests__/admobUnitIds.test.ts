import { shouldUseAdMobTestIds } from '../admobUnitIds';

describe('shouldUseAdMobTestIds', () => {
  const prev = process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS;
    } else {
      process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS = prev;
    }
  });

  it('is true when EXPO_PUBLIC_ADMOB_USE_TEST_IDS is true or 1', () => {
    process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS = 'true';
    expect(shouldUseAdMobTestIds()).toBe(true);
    process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS = '1';
    expect(shouldUseAdMobTestIds()).toBe(true);
  });

  it('is false when the env flag is unset or not truthy (outside __DEV__)', () => {
    // Jest typically runs with __DEV__ false; without the flag we expect live ids.
    delete process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS;
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      expect(shouldUseAdMobTestIds()).toBe(true);
    } else {
      expect(shouldUseAdMobTestIds()).toBe(false);
      process.env.EXPO_PUBLIC_ADMOB_USE_TEST_IDS = 'false';
      expect(shouldUseAdMobTestIds()).toBe(false);
    }
  });
});
