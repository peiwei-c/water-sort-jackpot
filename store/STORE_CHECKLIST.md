# Dual-store release checklist — AquaSort Lab

Code is largely ready for both stores. Work through **Shared** first, then **Apple** and **Google** in parallel.

## Shared (both stores)

### 1. Host legal pages
1. GitHub Pages is configured: branch `main` / folder `/docs`
2. Confirm both return **200**:
   - https://peiwei-c.github.io/water-sort-jackpot/privacy.html ✅
   - https://peiwei-c.github.io/water-sort-jackpot/terms.html ✅
   - https://peiwei-c.github.io/water-sort-jackpot/ (index) — merge `docs/index.html` to `main` if missing
3. Use a monitored support inbox. Update if needed:
   - `src/constants/legal.ts`
   - `app.json` → `extra.legal.supportEmail`
   - `docs/privacy.html` + `docs/terms.html`

### 2. AdMob console
1. Link iOS app `com.aquasort.lab` and Android package `com.aquasort.lab`
2. Privacy & messaging → enable **GDPR** + **IDFA / ATT** forms
3. Confirm unit IDs match `src/services/admobUnitIds.ts`
4. **app-ads.txt** — full steps: [APP_ADS_TXT.md](./APP_ADS_TXT.md)
   - Live file must be **https://peiwei-c.github.io/app-ads.txt** (domain root; not `/water-sort-jackpot/`)
   - Play **Store listing contact details → Website** and App Store **Marketing URL** must use host `peiwei-c.github.io`
   - In AdMob: Apps → View all apps → app-ads.txt → Check for updates

### 3. Remove Ads IAP (same product ID both stores)
**Full steps + copy-paste fields:** [IAP_REMOVE_ADS.md](./IAP_REMOVE_ADS.md)

| | |
|--|--|
| Product ID | **`com.aquasort.lab.remove_ads`** |
| Type | Non-consumable / one-time (Play: managed, non-consumable) |
| Price | **$1.99** |
| Effect | Hides banner + interstitial; rewarded stays |

Without this SKU, purchase fails → store rejection risk (broken IAP).

**Quick path**
1. Finish Paid Apps Agreement (Apple) + Payments profile (Play).
2. Create the product on ASC and Play with the exact Product ID above.
3. Activate (Play) / submit with next binary (Apple).
4. Smoke-test Buy + Restore on TestFlight / Play internal.

### 4. Production builds
```bash
eas login
eas build --platform all --profile production
```
- iOS: submit via `eas submit --platform ios --profile production` (after `ascAppId` is set)
- Android: upload AAB to Play Console (or `eas submit --platform android --profile production` → internal draft)

### 5. Screenshots (from preview/production build, not Expo Go)
Capture at least:
- Home / Reagent Path
- Sorting bench mid-puzzle
- Centrifuge modal
- Level complete / rewarded prompt

---

## Apple App Store Connect

- [ ] Create app with bundle ID `com.aquasort.lab`
- [ ] Privacy Policy URL → live GitHub Pages privacy link
- [ ] Support URL / email → monitored contact
- [ ] Marketing URL (developer website) → `https://peiwei-c.github.io/water-sort-jackpot/` (app-ads.txt crawl)
- [ ] Age rating questionnaire: ads + **simulated gambling** → expect **17+**
- [ ] App Privacy nutrition labels (AdMob advertising / device IDs / tracking as applicable)
- [ ] Screenshots: iPhone **6.7"** + **6.1"** minimum
- [ ] If keeping `supportsTablet: true` in `app.json`: also provide **iPad** screenshots, or set `supportsTablet: false`
- [ ] Create IAP `com.aquasort.lab.remove_ads` and submit with the binary
- [ ] Paid Apps Agreement + banking/tax (required before IAP sells)
- [ ] Put real Apple ID into `eas.json` → `submit.production.ios.ascAppId`
- [ ] Export compliance: No (matches `ITSAppUsesNonExemptEncryption: false`)
- [ ] Review notes: no account; Centrifuge is fictional/virtual currency only; how to open Supply Store + Restore Purchases
- [ ] Demo account: N/A (no login)
- [ ] Smoke-test Remove Ads + Restore on TestFlight / sandbox before “Submit for Review”

---

## Google Play Console

- [ ] Create app with package `com.aquasort.lab`
- [ ] Privacy Policy URL → same live Pages link
- [ ] Store settings → Store listing contact details → Website → `https://peiwei-c.github.io/water-sort-jackpot/` (app-ads.txt crawl)
- [ ] **App content → Ads → Yes, my app contains ads**
- [ ] Content rating questionnaire (IARC): ads + gambling/simulated casino theme — expect mature / 18+ equivalent depending on answers
- [ ] Target audience: **not children** (declare 18+ / adults only as appropriate)
- [ ] Data safety form: declare AdMob advertising ID / analytics-style ad data collection
- [ ] Create in-app product `com.aquasort.lab.remove_ads` (one-time)
- [ ] Merchant / payments profile active (required for IAP)
- [ ] Screenshots: phone + **7" tablet** (Play requires phone; tablet recommended)
- [ ] Feature graphic (1024×500) + high-res icon
- [ ] Upload production AAB; start with **internal testing** track (`eas.json` already drafts to `internal`)
- [ ] Store listing: short/full description, category (Puzzle / Casual)
- [ ] Review notes: same as Apple — virtual coins, no real-money gambling, Restore in Supply Store
- [ ] Smoke-test billing on a license tester account before production rollout

### Android-specific notes (already in repo)
- Package: `com.aquasort.lab`
- Declares `com.google.android.gms.permission.AD_ID` in `app.json`
- Production EAS env: `EXPO_PUBLIC_AD_PROVIDER=admob`, mocks disabled
- Submit profile defaults to **internal / draft** — promote to closed/open/production after QA

---

## Done in repo (both platforms)

- [x] Bundle ID / package `com.aquasort.lab`
- [x] Icons + splash
- [x] AdMob Android + iOS App IDs and unit IDs
- [x] UMP consent + iOS ATT
- [x] Delay AdMob measurement until after consent
- [x] Privacy Policy + Terms HTML under `docs/`
- [x] app-ads.txt source + setup (`store/APP_ADS_TXT.md`; live at `https://peiwei-c.github.io/app-ads.txt`)
- [x] In-app Privacy / Terms links
- [x] Error boundary
- [x] EAS development / preview / production profiles
- [x] Real Remove Ads IAP via `expo-iap` (StoreKit 2 / Play Billing)
- [x] Restore Purchases in Supply Store
- [x] Android `AD_ID` permission declared

---

## Suggested order

1. Fix Pages + support email  
2. AdMob Privacy & messaging (both apps) + app-ads.txt crawl  
3. Create ASC + Play apps; paste Privacy URL + developer website (`peiwei-c.github.io`)  
4. Create Remove Ads IAP on both stores  
5. `eas build --platform all --profile production`  
6. Screenshots from that build  
7. Internal / TestFlight smoke test (IAP + ads)  
8. Submit Apple review + promote Play track  
