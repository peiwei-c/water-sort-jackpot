# AquaSort Lab

Hyper-casual hybrid: **Water Sort Puzzle** + **3-reel Centrifuge** with mock AdMob/AppLovin hooks.

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

Default is **mock** (console logs + delays). AdMob needs a **dev client / native
build** (not Expo Go):

```bash
EXPO_PUBLIC_AD_PROVIDER=admob
npx expo prebuild
npx expo run:android
```

App / unit IDs are in `app.json` / `src/services/admobUnitIds.ts` (Android + iOS).
In `__DEV__`, Google `TestIds` are used so the account is not flagged.

`AppLovinAdService` remains a fail-closed stub.

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
`EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION=true`. If AdMob native SDK is missing
(Expo Go, web, Jest), `AdMobAdService` fails closed (no free rewards).
`AppLovinAdService` remains fail-closed until wired.
