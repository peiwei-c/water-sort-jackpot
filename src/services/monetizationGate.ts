/**
 * Mock ads are for local / explicit staging only.
 * Production must set a real EXPO_PUBLIC_AD_PROVIDER (or allow mock explicitly).
 */

export function allowMockMonetization(): boolean {
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION === 'true') return true;
  if (process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION === 'false') return false;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  if (process.env.NODE_ENV === 'test') return true;
  return false;
}
