import {
  AdManager,
  FIRST_AD_DELAY_MS,
  INTERSTITIAL_COOLDOWN_MS,
  BANNER_HEIGHT,
  createAdManager,
  resetAdManager,
} from '../AdManager';
import { resetAdService } from '../AdService';

describe('AdManager policy', () => {
  const prevProvider = process.env.EXPO_PUBLIC_AD_PROVIDER;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_AD_PROVIDER = 'mock';
    resetAdService();
    resetAdManager();
  });

  afterEach(() => {
    if (prevProvider === undefined) {
      delete process.env.EXPO_PUBLIC_AD_PROVIDER;
    } else {
      process.env.EXPO_PUBLIC_AD_PROVIDER = prevProvider;
    }
  });

  async function readyManager(
    sessionAt = 0,
    lastInterstitial: number | null = null,
  ): Promise<AdManager> {
    const mgr = createAdManager(sessionAt, lastInterstitial);
    await mgr.initialize();
    return mgr;
  }

  it('suppresses interstitial when Remove Ads is purchased', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: false,
        isNoAdsPurchased: true,
        now: FIRST_AD_DELAY_MS + 1,
      }),
    ).toBe(false);
  });

  it('suppresses interstitial during pour animation', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: true,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS + 1,
      }),
    ).toBe(false);
  });

  it('blocks interstitial off a 5/10/15 milestone even after 90s', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 4,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS,
      }),
    ).toBe(false);
    expect(
      mgr.canShowInterstitial({
        level: 7,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS,
      }),
    ).toBe(false);
  });

  it('blocks interstitial at level 5 before 90s', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 5,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS - 1,
      }),
    ).toBe(false);
  });

  it('allows interstitial at tickets 5 and 10 after 90s', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 5,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS,
      }),
    ).toBe(true);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS,
      }),
    ).toBe(true);
  });

  it('enforces cooldown between interstitials', async () => {
    const lastAt = FIRST_AD_DELAY_MS;
    const mgr = await readyManager(0, lastAt);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: lastAt + INTERSTITIAL_COOLDOWN_MS - 1,
      }),
    ).toBe(false);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: lastAt + INTERSTITIAL_COOLDOWN_MS,
      }),
    ).toBe(true);
  });

  it('records lastInterstitialAt after successful show', async () => {
    const mgr = await readyManager(0);
    const now = FIRST_AD_DELAY_MS + 5_000;
    const result = await mgr.showInterstitialSafe({
      level: 10,
      pourAnimActive: false,
      isNoAdsPurchased: false,
      now,
    });
    expect(result?.success).toBe(true);
    expect(mgr.getLastInterstitialAt()).toBe(now);
  });

  it('hides banner when no-ads purchased', async () => {
    const mgr = await readyManager();
    expect(mgr.shouldShowBanner(true)).toBe(false);
    expect(mgr.bannerInset(true)).toBe(0);
    expect(mgr.bannerInset(false)).toBe(BANNER_HEIGHT);
    const shown = await mgr.showBanner(true);
    expect(shown).toBeNull();
  });

  it('rewards only when rewarded callback succeeds', async () => {
    const mgr = await readyManager();
    const result = await mgr.showRewarded('rewarded_hint');
    expect(result.success).toBe(true);
    expect(result.rewarded).toBe(true);
  });
});
