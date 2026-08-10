import {
  AdManager,
  FIRST_AD_DELAY_MS,
  FIRST_AD_MIN_LEVEL,
  INTERSTITIAL_COOLDOWN_MS,
  BANNER_HEIGHT,
  createAdManager,
  resetAdManager,
} from '../AdManager';
import { resetAdService } from '../AdService';

describe('AdManager policy', () => {
  beforeEach(() => {
    resetAdService();
    resetAdManager();
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

  it('blocks interstitial before 90s and before level 4', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 3,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS - 1,
      }),
    ).toBe(false);
  });

  it('allows interstitial after 90s even below level 4', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: 2,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: FIRST_AD_DELAY_MS,
      }),
    ).toBe(true);
  });

  it('allows interstitial at level 4 before 90s', async () => {
    const mgr = await readyManager(0);
    expect(
      mgr.canShowInterstitial({
        level: FIRST_AD_MIN_LEVEL,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: 1_000,
      }),
    ).toBe(true);
  });

  it('enforces 120s cooldown between interstitials', async () => {
    const mgr = await readyManager(0, 50_000);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: 50_000 + INTERSTITIAL_COOLDOWN_MS - 1,
      }),
    ).toBe(false);
    expect(
      mgr.canShowInterstitial({
        level: 10,
        pourAnimActive: false,
        isNoAdsPurchased: false,
        now: 50_000 + INTERSTITIAL_COOLDOWN_MS,
      }),
    ).toBe(true);
  });

  it('records lastInterstitialAt after successful show', async () => {
    const mgr = await readyManager(0);
    const now = FIRST_AD_DELAY_MS + 5_000;
    const result = await mgr.showInterstitialSafe({
      level: 5,
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
