/**
 * Mock IAP / ads are for local and explicit staging only.
 * Production builds must set a real EXPO_PUBLIC_AD_PROVIDER and real billing.
 */

export function allowMockMonetization(): boolean {
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION === 'true') return true;
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION === 'false') return false;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  // Jest sets NODE_ENV=test without RN's __DEV__ global.
  if (process.env.NODE_ENV === 'test') return true;
  return false;
}
