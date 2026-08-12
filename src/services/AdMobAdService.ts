/**
 * Real AdMob provider via react-native-google-mobile-ads.
 * SDK is required lazily so Jest (node) can still import AdService.
 * Keeps one preloaded interstitial + rewarded instance when possible.
 */

import type {
  AdPlacement,
  AdResult,
  AdType,
  IAdService,
} from './AdService';
import { getAdMobUnitId, shouldUseAdMobTestIds, type AdMobUnitKind } from './admobUnitIds';

type BannerListener = (visible: boolean) => void;

type AdsSdk = typeof import('react-native-google-mobile-ads');
type InterstitialAd = ReturnType<AdsSdk['InterstitialAd']['createForAdRequest']>;
type RewardedAd = ReturnType<AdsSdk['RewardedAd']['createForAdRequest']>;

const LOAD_TIMEOUT_MS = 30_000;

function denied(placement: AdPlacement, message: string): AdResult {
  return {
    success: false,
    rewarded: false,
    placement,
    provider: 'admob',
    message,
  };
}

function nativePlatform(): 'ios' | 'android' | 'web' | 'unknown' {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as typeof import('react-native');
    if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
      return Platform.OS;
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function isWebPlatform(): boolean {
  const os = nativePlatform();
  return os === 'web' || os === 'unknown';
}

function loadSdk(): AdsSdk {
  // Lazy load — native module is unavailable in Jest / Expo Go / web.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-google-mobile-ads') as AdsSdk;
}

function unitId(kind: AdMobUnitKind): string {
  const sdk = loadSdk();
  if (shouldUseAdMobTestIds()) {
    if (kind === 'banner') return sdk.TestIds.BANNER;
    if (kind === 'interstitial') return sdk.TestIds.INTERSTITIAL;
    return sdk.TestIds.REWARDED;
  }
  const os = nativePlatform();
  if (os !== 'ios' && os !== 'android') {
    throw new Error('AdMob unit IDs require iOS or Android');
  }
  const id = getAdMobUnitId(kind, os);
  if (!id) {
    throw new Error(`Missing AdMob ${os} ${kind} unit ID`);
  }
  return id;
}

export class AdMobAdService implements IAdService {
  readonly provider = 'admob' as const;
  private ready = false;
  private unavailable = false;
  private bannerVisible = false;
  private bannerListeners = new Set<BannerListener>();

  private interstitial: InterstitialAd | null = null;
  private interstitialLoaded = false;
  private interstitialLoading: Promise<boolean> | null = null;

  private rewarded: RewardedAd | null = null;
  private rewardedLoaded = false;
  private rewardedLoading: Promise<boolean> | null = null;

  async initialize(): Promise<void> {
    if (this.ready) return;
    try {
      if (isWebPlatform()) {
        throw new Error('AdMob is not supported on web / this runtime');
      }
      const mobileAds = loadSdk().default;
      await mobileAds().initialize();
      this.ready = true;
      this.unavailable = false;
      console.log(
        '[AdService:admob] SDK initialized',
        shouldUseAdMobTestIds() ? '(test unit ids)' : '(live unit ids)',
      );
    } catch (e) {
      this.ready = true;
      this.unavailable = true;
      console.warn(
        '[AdService:admob] Unavailable — rewards disabled until native build + SDK work',
        e,
      );
    }
  }

  isReady(type: AdType): boolean {
    void type;
    return this.ready && !this.unavailable;
  }

  isBannerVisible(): boolean {
    return this.bannerVisible;
  }

  subscribeBannerVisibility(listener: BannerListener): () => void {
    this.bannerListeners.add(listener);
    listener(this.bannerVisible);
    return () => {
      this.bannerListeners.delete(listener);
    };
  }

  private setBannerVisible(visible: boolean): void {
    this.bannerVisible = visible;
    for (const listener of this.bannerListeners) listener(visible);
  }

  async showBanner(placement: AdPlacement = 'banner_home'): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    if (this.unavailable) return denied(placement, 'Ads unavailable');
    this.setBannerVisible(true);
    return {
      success: true,
      rewarded: false,
      placement,
      provider: 'admob',
      message: 'Banner slot visible',
    };
  }

  async hideBanner(): Promise<void> {
    this.setBannerVisible(false);
  }

  getBannerUnitId(): string | null {
    if (this.unavailable) return null;
    try {
      return unitId('banner');
    } catch {
      return null;
    }
  }

  async preload(types: AdType[] = ['interstitial', 'rewarded']): Promise<void> {
    if (!this.ready) await this.initialize();
    if (this.unavailable) return;
    const jobs: Promise<unknown>[] = [];
    if (types.includes('interstitial')) {
      jobs.push(this.ensureInterstitialLoaded());
    }
    if (types.includes('rewarded')) {
      jobs.push(this.ensureRewardedLoaded());
    }
    await Promise.all(jobs);
  }

  private ensureInterstitialLoaded(): Promise<boolean> {
    if (this.unavailable) return Promise.resolve(false);
    if (this.interstitialLoaded && this.interstitial) {
      return Promise.resolve(true);
    }
    if (this.interstitialLoading) return this.interstitialLoading;

    this.interstitialLoading = new Promise<boolean>((resolve) => {
      try {
        const { InterstitialAd, AdEventType } = loadSdk();
        const ad = InterstitialAd.createForAdRequest(unitId('interstitial'));
        this.interstitial = ad;
        this.interstitialLoaded = false;

        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubLoaded();
          unsubError();
          this.interstitialLoading = null;
          this.interstitialLoaded = ok;
          if (!ok) this.interstitial = null;
          resolve(ok);
        };

        const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
          finish(true);
        });
        const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
          console.warn('[AdService:admob] Interstitial load failed', error);
          finish(false);
        });
        const timer = setTimeout(() => {
          console.warn('[AdService:admob] Interstitial load timed out');
          finish(false);
        }, LOAD_TIMEOUT_MS);
        ad.load();
      } catch {
        this.interstitialLoading = null;
        this.interstitial = null;
        this.interstitialLoaded = false;
        resolve(false);
      }
    });

    return this.interstitialLoading;
  }

  private ensureRewardedLoaded(): Promise<boolean> {
    if (this.unavailable) return Promise.resolve(false);
    if (this.rewardedLoaded && this.rewarded) {
      return Promise.resolve(true);
    }
    if (this.rewardedLoading) return this.rewardedLoading;

    this.rewardedLoading = new Promise<boolean>((resolve) => {
      try {
        const { RewardedAd, RewardedAdEventType, AdEventType } = loadSdk();
        const ad = RewardedAd.createForAdRequest(unitId('rewarded'));
        this.rewarded = ad;
        this.rewardedLoaded = false;

        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubLoaded();
          unsubError();
          this.rewardedLoading = null;
          this.rewardedLoaded = ok;
          if (!ok) this.rewarded = null;
          resolve(ok);
        };

        const unsubLoaded = ad.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => finish(true),
        );
        const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
          console.warn('[AdService:admob] Rewarded load failed', error);
          finish(false);
        });
        const timer = setTimeout(() => {
          console.warn('[AdService:admob] Rewarded load timed out');
          finish(false);
        }, LOAD_TIMEOUT_MS);
        ad.load();
      } catch {
        this.rewardedLoading = null;
        this.rewarded = null;
        this.rewardedLoaded = false;
        resolve(false);
      }
    });

    return this.rewardedLoading;
  }

  async showInterstitial(
    placement: AdPlacement = 'interstitial_level',
  ): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    if (this.unavailable) return denied(placement, 'Ads unavailable');

    try {
      const { AdEventType } = loadSdk();
      const loaded = await this.ensureInterstitialLoaded();
      const ad = this.interstitial;
      if (!loaded || !ad) {
        return denied(placement, 'Interstitial failed to load');
      }

      // Consume preloaded instance; refresh in background after close.
      this.interstitialLoaded = false;
      this.interstitial = null;

      return await new Promise<AdResult>((resolve) => {
        let settled = false;
        const finish = (result: AdResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubClosed();
          unsubError();
          void this.ensureInterstitialLoaded();
          resolve(result);
        };

        const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          finish({
            success: true,
            rewarded: false,
            placement,
            provider: 'admob',
            message: 'Interstitial completed',
          });
        });
        const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
          finish(
            denied(placement, error?.message ?? 'Interstitial failed to show'),
          );
        });
        const timer = setTimeout(() => {
          finish(denied(placement, 'Interstitial show timed out'));
        }, LOAD_TIMEOUT_MS);

        void ad.show();
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Interstitial error';
      return denied(placement, message);
    }
  }

  async showRewarded(placement: AdPlacement): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    if (this.unavailable) return denied(placement, 'Ads unavailable');

    try {
      const { RewardedAdEventType, AdEventType } = loadSdk();
      const loaded = await this.ensureRewardedLoaded();
      const ad = this.rewarded;
      if (!loaded || !ad) {
        return denied(placement, 'Rewarded ad failed to load');
      }

      this.rewardedLoaded = false;
      this.rewarded = null;

      return await new Promise<AdResult>((resolve) => {
        let settled = false;
        let earned = false;

        const finish = (result: AdResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubEarned();
          unsubClosed();
          unsubError();
          void this.ensureRewardedLoaded();
          resolve(result);
        };

        const unsubEarned = ad.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            earned = true;
          },
        );
        const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          finish({
            success: earned,
            rewarded: earned,
            placement,
            provider: 'admob',
            message: earned
              ? `Reward granted: ${placement}`
              : 'Rewarded ad closed without reward',
          });
        });
        const unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
          finish(
            denied(placement, error?.message ?? 'Rewarded ad failed to show'),
          );
        });
        const timer = setTimeout(() => {
          finish(denied(placement, 'Rewarded ad show timed out'));
        }, LOAD_TIMEOUT_MS);

        void ad.show();
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Rewarded ad error';
      return denied(placement, message);
    }
  }
}
