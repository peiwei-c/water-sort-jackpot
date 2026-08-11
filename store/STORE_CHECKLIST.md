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

### 3. Remove Ads IAP (same product ID both stores)
Product ID: **`com.aquasort.lab.remove_ads`**
- Type: **Non-consumable** / one-time (Play: managed product, non-consumable)
- Suggested price: **$1.99**
- Without this SKU, purchase fails → store rejection risk (broken IAP)

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
- [ ] Age rating questionnaire: ads + **simulated gambling** → expect **17+**
- [ ] App Privacy nutrition labels (AdMob advertising / device IDs / tracking as applicable)
- [ ] Screenshots: iPhone **6.7"** + **6.1"** minimum
- [ ] If keeping `supportsTablet: true` in `app.json`: also provide **iPad** screenshots, or set `supportsTablet: false`
- [ ] Create IAP `com.aquasort.lab.remove_ads` and submit with the binary
- [ ] Paid Apps Agreement + banking/tax (required before IAP sells)
- [ ] Put real Apple ID into `eas.json` → `submit.production.ios.ascAppId`
- [ ] Export compliance: No (matches `ITSAppUsesNonExemptEncryption: false`)
- [ ] Review notes: no account; 17+ age gate; Centrifuge is fictional/virtual currency only; how to open Supply Store + Restore Purchases
- [ ] Demo account: N/A (no login)
- [ ] Smoke-test Remove Ads + Restore on TestFlight / sandbox before “Submit for Review”

---

## Google Play Console

- [ ] Create app with package `com.aquasort.lab`
- [ ] Privacy Policy URL → same live Pages link
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
- [x] Age gate (17+) on first launch; Centrifuge blocked if declined
- [x] Privacy Policy + Terms HTML under `docs/`
- [x] In-app Privacy / Terms links
- [x] Error boundary
- [x] EAS development / preview / production profiles
- [x] Real Remove Ads IAP via `expo-iap` (StoreKit 2 / Play Billing)
- [x] Restore Purchases in Supply Store
- [x] Android `AD_ID` permission declared

---

## Suggested order

1. Fix Pages + support email  
2. AdMob Privacy & messaging (both apps)  
3. Create ASC + Play apps; paste Privacy URL  
4. Create Remove Ads IAP on both stores  
5. `eas build --platform all --profile production`  
6. Screenshots from that build  
7. Internal / TestFlight smoke test (IAP + ads + age gate)  
8. Submit Apple review + promote Play track  
