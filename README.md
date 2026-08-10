# AquaSort Jackpot

Hyper-casual hybrid: **Water Sort Puzzle** + **3-reel Jackpot** with mock AdMob/AppLovin hooks.

## Architecture

| Module | Role |
|--------|------|
| `src/engines/WaterSortEngine.ts` | Pure tube logic, pour rules, history, win checks |
| `src/engines/JackpotEngine.ts` | Pure RNG, spin costs, payout table |
| `src/services/AdService.ts` | Banner / interstitial / rewarded abstraction + mock |
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

## Economy

- Level clear → **+10** coins
- Spin → bet × lines coins (or free spins from rewarded ads)
- Interstitial every **3** levels
- Rewarded: extra tube · 3 free spins · 2× payout

### Persistence / app kill

Mid-puzzle progress is written to AsyncStorage on every pour (debounced) and
**flushed immediately** when the app backgrounds or becomes inactive. Killing
the app mid-station resumes from the saved flask on next launch.

### Monetization safety

Mock rewarded ads run only in `__DEV__` / Jest, or when
`EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION=true`. Unconfigured AdMob/AppLovin stubs
fail closed (no throw on boot, no free rewards).
