/**
 * Mock IAP / ads are for local and explicit staging only.
 * Production must set a real EXPO_PUBLIC_AD_PROVIDER (or allow mock explicitly) and real billing.
 */

export function allowMockMonetization(): boolean {
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION === 'true') return true;
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION === 'false') return false;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  // Jest sets NODE_ENV=test without RN's __DEV__ global.
  if (process.env.NODE_ENV === 'test') return true;
  return false;
}

/** Screenshot / internal APK: no banner, interstitial, consent, or AdMob init. */
export function adsDisabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_NO_ADS;
  return flag === 'true' || flag === '1';
}
