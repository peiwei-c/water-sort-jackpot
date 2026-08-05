/**
 * Abstract ad layer for AdMob / AppLovin with a mock fallback for local play.
 */

export type AdPlacement =
  | 'interstitial_level'
  | 'rewarded_extra_tube'
  | 'rewarded_extra_moves'
  | 'rewarded_free_spins'
  | 'rewarded_2x_payout'
  | 'banner_home';

export type AdType = 'banner' | 'interstitial' | 'rewarded';

export type AdResult = {
  success: boolean;
  rewarded: boolean;
  placement: AdPlacement;
  provider: 'mock' | 'admob' | 'applovin';
  message: string;
};

export interface IAdService {
  initialize(): Promise<void>;
  isReady(type: AdType): boolean;
  showBanner(placement?: AdPlacement): Promise<AdResult>;
  hideBanner(): Promise<void>;
  showInterstitial(placement?: AdPlacement): Promise<AdResult>;
  showRewarded(placement: AdPlacement): Promise<AdResult>;
}

const MOCK_DELAY_MS: Record<AdType, number> = {
  banner: 200,
  interstitial: 800,
  rewarded: 1200,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock ad provider — always "fills", logs to console, simulates latency.
 * Swap for AdMobAdService / AppLovinAdService when real SDK IDs are wired.
 */
export class MockAdService implements IAdService {
  private ready = false;
  private bannerVisible = false;
  readonly provider = 'mock' as const;

  async initialize(): Promise<void> {
    console.log('[AdService:mock] Initializing…');
    await sleep(150);
    this.ready = true;
    console.log('[AdService:mock] Ready (mock environment)');
  }

  isReady(type: AdType): boolean {
    void type;
    return this.ready;
  }

  async showBanner(placement: AdPlacement = 'banner_home'): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    console.log(`[AdService:mock] Show banner @ ${placement}`);
    await sleep(MOCK_DELAY_MS.banner);
    this.bannerVisible = true;
    return {
      success: true,
      rewarded: false,
      placement,
      provider: this.provider,
      message: 'Mock banner shown',
    };
  }

  async hideBanner(): Promise<void> {
    console.log('[AdService:mock] Hide banner');
    this.bannerVisible = false;
  }

  isBannerVisible(): boolean {
    return this.bannerVisible;
  }

  async showInterstitial(
    placement: AdPlacement = 'interstitial_level',
  ): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    console.log(`[AdService:mock] Show interstitial @ ${placement}…`);
    await sleep(MOCK_DELAY_MS.interstitial);
    console.log('[AdService:mock] Interstitial closed');
    return {
      success: true,
      rewarded: false,
      placement,
      provider: this.provider,
      message: 'Mock interstitial completed',
    };
  }

  async showRewarded(placement: AdPlacement): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    console.log(`[AdService:mock] Show rewarded video @ ${placement}…`);
    await sleep(MOCK_DELAY_MS.rewarded);
    console.log(`[AdService:mock] Rewarded granted for ${placement}`);
    return {
      success: true,
      rewarded: true,
      placement,
      provider: this.provider,
      message: `Mock reward granted: ${placement}`,
    };
  }
}

/**
 * Stub for future Google AdMob wiring.
 * Throws until real App IDs / unit IDs are configured.
 */
export class AdMobAdService implements IAdService {
  async initialize(): Promise<void> {
    throw new Error(
      'AdMobAdService: set EXPO_PUBLIC_ADMOB_APP_ID and unit IDs before use',
    );
  }

  isReady(): boolean {
    return false;
  }

  async showBanner(): Promise<AdResult> {
    throw new Error('AdMob not configured');
  }

  async hideBanner(): Promise<void> {
    throw new Error('AdMob not configured');
  }

  async showInterstitial(): Promise<AdResult> {
    throw new Error('AdMob not configured');
  }

  async showRewarded(): Promise<AdResult> {
    throw new Error('AdMob not configured');
  }
}

/**
 * Stub for future AppLovin MAX wiring.
 */
export class AppLovinAdService implements IAdService {
  async initialize(): Promise<void> {
    throw new Error(
      'AppLovinAdService: set EXPO_PUBLIC_APPLOVIN_SDK_KEY before use',
    );
  }

  isReady(): boolean {
    return false;
  }

  async showBanner(): Promise<AdResult> {
    throw new Error('AppLovin not configured');
  }

  async hideBanner(): Promise<void> {
    throw new Error('AppLovin not configured');
  }

  async showInterstitial(): Promise<AdResult> {
    throw new Error('AppLovin not configured');
  }

  async showRewarded(): Promise<AdResult> {
    throw new Error('AppLovin not configured');
  }
}

export type AdProviderName = 'mock' | 'admob' | 'applovin';

let singleton: IAdService | null = null;

export function createAdService(provider: AdProviderName = 'mock'): IAdService {
  switch (provider) {
    case 'admob':
      return new AdMobAdService();
    case 'applovin':
      return new AppLovinAdService();
    case 'mock':
    default:
      return new MockAdService();
  }
}

export function getAdService(): IAdService {
  if (!singleton) {
    const name = (process.env.EXPO_PUBLIC_AD_PROVIDER as AdProviderName) || 'mock';
    singleton = createAdService(name);
  }
  return singleton;
}

/** Test helper to reset the singleton. */
export function resetAdService(): void {
  singleton = null;
}

/** Levels between automatic interstitial ads. */
export const INTERSTITIAL_EVERY_N_LEVELS = 3;
