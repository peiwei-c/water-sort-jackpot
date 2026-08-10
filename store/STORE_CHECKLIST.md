# Store release checklist — AquaSort Lab

## Done in repo
- [x] Bundle ID / package `com.aquasort.lab`
- [x] Icons + splash (`expo-splash-screen`)
- [x] AdMob Android + iOS App IDs and unit IDs
- [x] Production EAS env sets `EXPO_PUBLIC_AD_PROVIDER=admob`
- [x] UMP consent bootstrap + iOS ATT request
- [x] Delay AdMob measurement until after consent
- [x] Age gate (17+) on first launch
- [x] Privacy Policy + Terms HTML under `docs/`
- [x] In-app Privacy / Terms links
- [x] Error boundary
- [x] `eas.json` development / preview / production profiles

## You must do in consoles (cannot automate)

### 1. Host legal pages
1. GitHub → repo **Settings → Pages**
2. Source: Deploy from branch `main` / folder `/docs`
3. Confirm:
   - https://peiwei-c.github.io/water-sort-jackpot/privacy.html
   - https://peiwei-c.github.io/water-sort-jackpot/terms.html
4. Update `support@aquasort.lab` to a real inbox (or change `src/constants/legal.ts`)

### 2. Expo / EAS
```bash
npm i -g eas-cli
eas login
eas init   # replaces REPLACE_AFTER_EAS_INIT in app.json
eas build --platform all --profile production
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### 3. AdMob Privacy & messaging
1. AdMob → Privacy & messaging → enable GDPR + IDFA / ATT messages
2. Link both Android and iOS apps
3. Without this, UMP may not show a form (ads can still load with defaults)

### 4. Apple App Store Connect
- Create app with bundle `com.aquasort.lab`
- Privacy Policy URL → GitHub Pages privacy link
- Age rating: answer for simulated gambling + ads (expect 17+)
- App Privacy nutrition labels (advertising data via AdMob)
- Screenshots (6.7" + 6.1" iPhone minimum)
- Replace `ascAppId` in `eas.json` after the app exists
- Export compliance: app sets `ITSAppUsesNonExemptEncryption: false`

### 5. Google Play Console
- Create app with package `com.aquasort.lab`
- **App content → Ads → Yes, my app contains ads**
- Content rating questionnaire (simulated casino / gambling theme)
- Target audience: not children / 18+ or equivalent
- Privacy Policy URL
- Phone + 7" tablet screenshots
- Upload AAB from EAS production build

### 6. Screenshots
Capture from a release or preview build (not Expo Go):
- Home / Reagent Path
- Sorting bench mid-puzzle
- Centrifuge modal
- Level complete / rewarded prompt

Suggested sizes: see Apple HIG / Play Console requirements for current year.
