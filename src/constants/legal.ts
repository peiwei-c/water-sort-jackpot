/**
 * Public legal / support URLs used in-app and for store listings.
 * Host docs/ via GitHub Pages (see store/STORE_CHECKLIST.md).
 */

export const LEGAL = {
  privacyUrl:
    process.env.EXPO_PUBLIC_PRIVACY_URL ??
    'https://peiwei-c.github.io/water-sort-jackpot/privacy.html',
  termsUrl:
    process.env.EXPO_PUBLIC_TERMS_URL ??
    'https://peiwei-c.github.io/water-sort-jackpot/terms.html',
  supportEmail:
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'jobygapps@gmail.com',
  /** Minimum age acknowledgment for store questionnaires (simulated gambling + ads). */
  minimumAge: 17,
} as const;
