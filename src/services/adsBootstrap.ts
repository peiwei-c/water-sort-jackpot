/**
 * Consent + ATT before Mobile Ads init (UMP + App Tracking Transparency).
 * Soft-fails when native modules are missing (Jest / Expo Go / web).
 */

export type AdsBootstrapResult = {
  consentOk: boolean;
  trackingStatus: string;
  adsReady: boolean;
  message: string;
};

function loadAdsConsent(): typeof import('react-native-google-mobile-ads').AdsConsent | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sdk = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    return sdk.AdsConsent;
  } catch {
    return null;
  }
}

async function requestAttIfNeeded(): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as typeof import('react-native');
    if (Platform.OS !== 'ios') return 'android-skip';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracking = require('expo-tracking-transparency') as typeof import('expo-tracking-transparency');
    if (!tracking.isAvailable()) return 'unavailable';

    const current = await tracking.getTrackingPermissionsAsync();
    if (current.status === tracking.PermissionStatus.UNDETERMINED) {
      const next = await tracking.requestTrackingPermissionsAsync();
      return next.status;
    }
    return current.status;
  } catch (e) {
    console.warn('[adsBootstrap] ATT skipped', e);
    return 'error';
  }
}

/**
 * Gather GDPR/UMP consent (when required), request ATT on iOS, then
 * initialize the configured ad provider and show the home banner.
 */
export async function bootstrapAds(): Promise<AdsBootstrapResult> {
  let consentOk = true;
  let trackingStatus = 'skipped';

  try {
    const AdsConsent = loadAdsConsent();
    if (AdsConsent) {
      try {
        await AdsConsent.gatherConsent();
        const info = await AdsConsent.getConsentInfo();
        consentOk = info.canRequestAds !== false;
      } catch (e) {
        // UMP can fail offline / before Privacy & messaging is configured —
        // still attempt ads with prior-session consent defaults.
        console.warn('[adsBootstrap] Consent gather failed; continuing', e);
        consentOk = true;
      }

      try {
        const gdprApplies = await AdsConsent.getGdprApplies();
        const purposeConsents = await AdsConsent.getPurposeConsents();
        const hasPurposeOne =
          !gdprApplies || purposeConsents.startsWith('1');
        if (hasPurposeOne) {
          trackingStatus = await requestAttIfNeeded();
        } else {
          trackingStatus = 'gdpr-purpose-one-denied';
        }
      } catch {
        trackingStatus = await requestAttIfNeeded();
      }
    } else {
      trackingStatus = await requestAttIfNeeded();
    }
  } catch (e) {
    console.warn('[adsBootstrap] Consent/ATT path failed softly', e);
  }

  try {
    // Lazy import keeps Jest from loading native ad code until needed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAdService } = require('./AdService') as typeof import('./AdService');
    const ads = getAdService();
    await ads.initialize();
    if (consentOk) {
      await ads.showBanner('banner_home');
    }
    return {
      consentOk,
      trackingStatus,
      adsReady: ads.isReady('banner'),
      message: 'Ads bootstrap complete',
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ads bootstrap failed';
    console.warn('[adsBootstrap]', message);
    return {
      consentOk,
      trackingStatus,
      adsReady: false,
      message,
    };
  }
}
