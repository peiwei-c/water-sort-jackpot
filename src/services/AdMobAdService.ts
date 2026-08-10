/**
 * Real AdMob provider via react-native-google-mobile-ads.
 * SDK is required lazily so Jest (node) can still import AdService.
 */

import type {
  AdPlacement,
  AdResult,
  AdType,
  IAdService,
} from './AdService';
import { getAdMobUnitId, type AdMobUnitKind } from './admobUnitIds';

type BannerListener = (visible: boolean) => void;

type AdsSdk = typeof import('react-native-google-mobile-ads');

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
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
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
      console.log('[AdService:admob] SDK initialized');
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

  async showInterstitial(
    placement: AdPlacement = 'interstitial_level',
  ): Promise<AdResult> {
    if (!this.ready) await this.initialize();
    if (this.unavailable) return denied(placement, 'Ads unavailable');

    try {
      const { InterstitialAd, AdEventType } = loadSdk();
      const interstitial = InterstitialAd.createForAdRequest(unitId('interstitial'));

      return await new Promise<AdResult>((resolve) => {
        let settled = false;
        const finish = (result: AdResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubLoaded();
          unsubClosed();
          unsubError();
          resolve(result);
        };

        const unsubLoaded = interstitial.addAdEventListener(
          AdEventType.LOADED,
          () => {
            void interstitial.show();
          },
        );
        const unsubClosed = interstitial.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            finish({
              success: true,
              rewarded: false,
              placement,
              provider: 'admob',
              message: 'Interstitial completed',
            });
          },
        );
        const unsubError = interstitial.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            finish(
              denied(
                placement,
                error?.message ?? 'Interstitial failed to load',
              ),
            );
          },
        );

        const timer = setTimeout(() => {
          finish(denied(placement, 'Interstitial load timed out'));
        }, LOAD_TIMEOUT_MS);

        interstitial.load();
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
      const { RewardedAd, RewardedAdEventType, AdEventType } = loadSdk();
      const rewardedAd = RewardedAd.createForAdRequest(unitId('rewarded'));

      return await new Promise<AdResult>((resolve) => {
        let settled = false;
        let earned = false;

        const finish = (result: AdResult) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          unsubLoaded();
          unsubEarned();
          unsubClosed();
          unsubError();
          resolve(result);
        };

        const unsubLoaded = rewardedAd.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            void rewardedAd.show();
          },
        );
        const unsubEarned = rewardedAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            earned = true;
          },
        );
        const unsubClosed = rewardedAd.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            finish({
              success: earned,
              rewarded: earned,
              placement,
              provider: 'admob',
              message: earned
                ? `Reward granted: ${placement}`
                : 'Rewarded ad closed without reward',
            });
          },
        );
        const unsubError = rewardedAd.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            finish(
              denied(placement, error?.message ?? 'Rewarded ad failed to load'),
            );
          },
        );

        const timer = setTimeout(() => {
          finish(denied(placement, 'Rewarded ad load timed out'));
        }, LOAD_TIMEOUT_MS);

        rewardedAd.load();
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Rewarded ad error';
      return denied(placement, message);
    }
  }
}
