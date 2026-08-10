# AquaSort Jackpot

Hyper-casual hybrid: **Water Sort Puzzle** + **3-reel Jackpot** with mock AdMob/AppLovin hooks.

## Architecture

| Module | Role |
|--------|------|
| `src/engines/WaterSortEngine.ts` | Pure tube logic, pour rules, history, win checks |
| `src/engines/JackpotEngine.ts` | Pure RNG, spin costs, payout table |
| `src/services/AdService.ts` | Banner / interstitial / rewarded abstraction + mock |
| `src/services/AdManager.ts` | Monetization policy (cooldown, first-ad delay, no-ads) |
| `src/services/IapService.ts` | Mock Remove Ads purchase |
| `src/store/gameStore.ts` | Zustand bridge between engines, economy, ads |
| `src/components/*` | React Native UI |

Engines have **zero** UI or ad imports.

## Run

```bash
npm install
npm test
npm start
```

Then press `i` (iOS), `a` (Android), or `w` (web).

## Ad providers

Default is **mock** (console logs + delays). Switch later via:

```bash
EXPO_PUBLIC_AD_PROVIDER=admob   # or applovin
```

`AdMobAdService` / `AppLovinAdService` are stubs that throw until real SDK IDs are wired.

### Policy (AdManager)

- **Interstitial**: on “Next Station” only; suppressed for first **90s** or until **Level 4**; **120s** cooldown; never during pour; suppressed by Remove Ads
- **Banner**: bottom of screen; hidden when Remove Ads purchased
- **Rewarded** (always available, even with Remove Ads): extra tube · undo (1–3 pours) · hint · skip level (after 2 fails) · extra moves · free spins · 2× payout

## Economy

- Level clear → **+10** coins
- Spin → **−5** coins (or free spins from rewarded ads)
- Remove Ads → **$1.99** (mock IAP in `__DEV__` only; hides banner + interstitial only)

### Monetization safety

Mock IAP and mock rewarded ads run only when `__DEV__` is true, or when
`EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION=true`. Release builds without a real
`EXPO_PUBLIC_AD_PROVIDER` fail closed (no free rewards / no free Remove Ads).
Wire StoreKit / Play Billing before shipping paid entitlement.
