/**
 * AdMob App / ad unit IDs for AquaSort Lab.
 * In __DEV__, AdMobAdService uses Google TestIds instead of these.
 *
 * Bundle / package: com.aquasort.lab
 */

export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-3994151354323315~6576501262';

export const ADMOB_IOS_APP_ID =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ??
  'ca-app-pub-3994151354323315~6719971499';

export type AdMobUnitKind = 'banner' | 'interstitial' | 'rewarded';

const ANDROID_UNITS: Record<AdMobUnitKind, string> = {
  banner:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID ??
    process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ??
    'ca-app-pub-3994151354323315/7351506827',
  interstitial:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID ??
    process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ??
    'ca-app-pub-3994151354323315/5160457752',
  rewarded:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID ??
    process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ??
    'ca-app-pub-3994151354323315/3109009487',
};

const IOS_UNITS: Record<AdMobUnitKind, string> = {
  banner:
    process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID ??
    'ca-app-pub-3994151354323315/5156588324',
  interstitial:
    process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID ??
    'ca-app-pub-3994151354323315/8496087594',
  rewarded:
    process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID ??
    'ca-app-pub-3994151354323315/8416910554',
};

export function getAdMobUnitId(
  kind: AdMobUnitKind,
  platform: 'ios' | 'android',
): string | null {
  const id = platform === 'ios' ? IOS_UNITS[kind] : ANDROID_UNITS[kind];
  return id || null;
}

/** @deprecated Prefer getAdMobUnitId(kind, platform). Android-only map. */
export const ADMOB_UNIT_IDS = ANDROID_UNITS;
