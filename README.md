# AquaSort Lab

Hyper-casual hybrid: **Water Sort Puzzle** + **3-reel Centrifuge** with AdMob monetization.

## Architecture

| Module | Role |
|--------|------|
| `src/engines/WaterSortEngine.ts` | Pure tube logic, pour rules, history, win checks |
| `src/engines/JackpotEngine.ts` | Pure RNG, spin costs, payout table |
| `src/services/AdService.ts` | Banner / interstitial / rewarded abstraction + mock |
| `src/services/AdManager.ts` | Monetization policy (cooldown, first-ad delay, no-ads) |
| `src/services/IapService.ts` | Remove Ads IAP (`expo-iap` / StoreKit + Play Billing) |
| `src/services/AdMobAdService.ts` | Real AdMob provider |
| `src/services/adsBootstrap.ts` | UMP consent + ATT before ads |
| `src/store/gameStore.ts` | Zustand bridge between engines, economy, ads |
| `src/components/*` | React Native UI |

Engines have **zero** UI or ad imports.

## Run (local / mock ads)

```bash
npm install
npm test
npm start
```

Mock ads are the default in `__DEV__`. AdMob needs a **native build** (not Expo Go).

## AdMob native builds

```bash
# development client
eas build --profile development --platform ios
# or local
EXPO_PUBLIC_AD_PROVIDER=admob npx expo prebuild
EXPO_PUBLIC_AD_PROVIDER=admob npx expo run:ios
```

Production EAS profiles already set `EXPO_PUBLIC_AD_PROVIDER=admob`.
Unit IDs: `src/services/admobUnitIds.ts`. Google `TestIds` are used in `__DEV__` and when `EXPO_PUBLIC_ADMOB_USE_TEST_IDS=true` (preview APK).

## Store release

Follow **[`store/STORE_CHECKLIST.md`](store/STORE_CHECKLIST.md)** end-to-end (EAS, GitHub Pages legal URLs, AdMob Privacy & messaging, app-ads.txt, App Store / Play Console).

AdMob **app-ads.txt**: [`store/APP_ADS_TXT.md`](store/APP_ADS_TXT.md) — live at https://peiwei-c.github.io/app-ads.txt (domain root, not this project’s `/docs` Pages path).

Legal pages live in `docs/` for GitHub Pages:
- Privacy: `docs/privacy.html`
- Terms: `docs/terms.html`

### Policy (AdManager)

- **Interstitial**: on “Next Station” only; suppressed for first **90s** or until **Level 4**; **120s** cooldown; never during pour; suppressed by Remove Ads
- **Banner**: bottom of screen; hidden when Remove Ads purchased
- **Rewarded** (always available, even with Remove Ads): extra tube · undo (1–3 pours) · hint · skip level (after 2 fails) · extra moves · free spins · 2× payout

## Economy

- Level clear → **+10** coins
- Spin → bet × lines coins (or free spins from rewarded ads)
- Remove Ads → store price for `com.aquasort.lab.remove_ads` (hides banner + interstitial only; mock only in `__DEV__` / Jest)
- Interstitial every **3** levels
- Rewarded: extra tube · 3 free spins · 2× payout

### Persistence / app kill

Mid-puzzle progress is written to AsyncStorage on every pour (debounced) and
**flushed immediately** when the app backgrounds or becomes inactive.

### Monetization safety

- `__DEV__` defaults to mock unless `EXPO_PUBLIC_AD_PROVIDER` is set
- Release defaults to **admob** (also forced in `eas.json`)
- Mock rewards / mock IAP only when `__DEV__` / Jest / `EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION=true`
- Missing native SDK → fail closed (no free rewards / no free Remove Ads)
- Wire StoreKit / Play Billing before shipping paid entitlement
