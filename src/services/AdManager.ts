/**
 * Ad monetization policy layer — cooldowns, first-ad delay, no-ads IAP gates.
 * Delegates load/show to IAdService (mock today; AdMob/AppLovin later).
 */

import {
  getAdService,
  isInterstitialClearLevel,
  type AdPlacement,
  type AdResult,
  type AdType,
} from './AdService';

export const FIRST_AD_DELAY_MS = 90_000;
export const INTERSTITIAL_COOLDOWN_MS = 120_000;
/** Reserved bottom inset when banner is visible. */
export const BANNER_HEIGHT = 50;

export type InterstitialGateInput = {
  level: number;
  pourAnimActive: boolean;
  isNoAdsPurchased: boolean;
  now?: number;
};

export class AdManager {
  private sessionStartedAt: number;
  private lastInterstitialAt: number | null;
  private initialized = false;

  constructor(
    sessionStartedAt: number = Date.now(),
    lastInterstitialAt: number | null = null,
  ) {
    this.sessionStartedAt = sessionStartedAt;
    this.lastInterstitialAt = lastInterstitialAt;
  }

  async initialize(): Promise<void> {
    await getAdService().initialize();
    this.initialized = true;
  }

  markSessionStart(at: number = Date.now()): void {
    this.sessionStartedAt = at;
  }

  getSessionStartedAt(): number {
    return this.sessionStartedAt;
  }

  getLastInterstitialAt(): number | null {
    return this.lastInterstitialAt;
  }

  setLastInterstitialAt(at: number | null): void {
    this.lastInterstitialAt = at;
  }

  isReady(type: AdType): boolean {
    return this.initialized && getAdService().isReady(type);
  }

  isRewardedReady(): boolean {
    return this.isReady('rewarded');
  }

  shouldShowBanner(isNoAdsPurchased: boolean): boolean {
    return !isNoAdsPurchased;
  }

  bannerInset(isNoAdsPurchased: boolean): number {
    return this.shouldShowBanner(isNoAdsPurchased) ? BANNER_HEIGHT : 0;
  }

  /**
   * Forced interstitial rules (puzzle clears only — not Lucky/free-spin, not banners):
   * - only on completed tickets 10, 20, 30, …
   * - suppressed by Remove Ads
   * - never during pour animation / active gameplay pour
   * - first 90s of session
   * - min 120s between forced interstitials
   */
  canShowInterstitial(input: InterstitialGateInput): boolean {
    const now = input.now ?? Date.now();
    if (input.isNoAdsPurchased) return false;
    if (input.pourAnimActive) return false;
    if (!this.isReady('interstitial')) return false;
    if (!isInterstitialClearLevel(input.level)) return false;
    if (now - this.sessionStartedAt < FIRST_AD_DELAY_MS) return false;

    if (this.lastInterstitialAt != null) {
      if (now - this.lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
    }
    return true;
  }

  async showInterstitialSafe(
    input: InterstitialGateInput,
    placement: AdPlacement = 'interstitial_level',
  ): Promise<AdResult | null> {
    if (!this.canShowInterstitial(input)) return null;
    const result = await getAdService().showInterstitial(placement);
    if (result.success) {
      this.lastInterstitialAt = input.now ?? Date.now();
    }
    return result;
  }

  async showRewarded(placement: AdPlacement): Promise<AdResult> {
    if (!this.isRewardedReady()) {
      return {
        success: false,
        rewarded: false,
        placement,
        provider: 'mock',
        message: 'Rewarded ad not ready',
      };
    }
    return getAdService().showRewarded(placement);
  }

  async showBanner(
    isNoAdsPurchased: boolean,
    placement: AdPlacement = 'banner_home',
  ): Promise<AdResult | null> {
    if (!this.shouldShowBanner(isNoAdsPurchased)) {
      await getAdService().hideBanner();
      return null;
    }
    return getAdService().showBanner(placement);
  }

  async hideBanner(): Promise<void> {
    await getAdService().hideBanner();
  }
}

let singleton: AdManager | null = null;

export function getAdManager(): AdManager {
  if (!singleton) {
    singleton = new AdManager();
  }
  return singleton;
}

/** Test helper. */
export function resetAdManager(): void {
  singleton = null;
}

export function createAdManager(
  sessionStartedAt?: number,
  lastInterstitialAt?: number | null,
): AdManager {
  return new AdManager(sessionStartedAt, lastInterstitialAt ?? null);
}
