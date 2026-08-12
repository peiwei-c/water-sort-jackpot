# Remove Ads IAP — App Store + Play Console

In-app code already expects this product. Create the **same** non-consumable SKU on both stores.

| Field | Value |
|--------|--------|
| **Product ID** | `com.aquasort.lab.remove_ads` |
| **Type** | Non-consumable / one-time purchase |
| **Price** | `$1.99` (or store tier equivalent) |
| **Code** | [`src/services/IapService.ts`](../src/services/IapService.ts) → `REMOVE_ADS_PRODUCT_ID` |
| **UI** | Supply Store → Remove Ads + Restore Purchases |

**What it unlocks:** hides banner + forced interstitials. **Rewarded ads stay** (hints, extra moves, etc.).

---

## Prerequisites

### Apple
- App Store Connect app with bundle ID `com.aquasort.lab`
- **Paid Apps Agreement** + banking/tax completed (Agreements, Tax, and Banking)

### Google
- Play Console app with package `com.aquasort.lab`
- **Payments profile** / merchant account active

Without these, you can draft the product but cannot sell or sandbox-test it.

---

## App Store Connect

1. Open the AquaSort Lab app.
2. **Monetization → In-App Purchases → Create**.
3. Type: **Non-Consumable**.
4. Copy-paste:

| Field | Value |
|--------|--------|
| Product ID | `com.aquasort.lab.remove_ads` |
| Reference name | `Remove Ads` |
| Price | Tier for **$1.99** |

5. Localization (English — U.S. at minimum):

| Field | Value |
|--------|--------|
| Display name | `Remove Ads` |
| Description | `Remove banner ads and forced interstitials. Rewarded ads for optional boosts remain available.` |

6. Save.
7. Submit the IAP **with the next app binary** (Apple usually reviews the first IAP together with a build).
8. After the app exists in ASC, set the numeric Apple ID in [`eas.json`](../eas.json):

```json
"ios": {
  "ascAppId": "YOUR_NUMERIC_APPLE_ID"
}
```

**Do not change the Product ID after creation** — it must stay `com.aquasort.lab.remove_ads`.

---

## Google Play Console

1. Open the AquaSort Lab app.
2. **Monetize → Products → In-app products → Create product**.
3. Copy-paste:

| Field | Value |
|--------|--------|
| Product ID | `com.aquasort.lab.remove_ads` |
| Name | `Remove Ads` |
| Description | `Remove banner ads and forced interstitials. Rewarded ads for optional boosts remain available.` |
| Purchase type | One-time / non-consumable (not a subscription) |
| Default price | `$1.99` |

4. Set status to **Active**.
5. **Settings → License testing** — add your Google account as a license tester for sandbox purchases.

---

## Verify (TestFlight / Play internal)

Use a **preview or production** native build (not Expo Go).

1. Open **Supply Store** → confirm Remove Ads shows a store price (or `$1.99` fallback).
2. Tap **Buy** → complete sandbox / license-tester purchase.
3. Confirm banner is gone and forced interstitials no longer appear after clears.
4. Confirm rewarded ads (hint / extra moves) still work.
5. Delete and reinstall the app → tap **Restore Purchases** → entitlement returns (`isNoAdsPurchased`).

| Symptom | Likely cause |
|---------|----------------|
| “Product not found” | Product ID mismatch or product not Active / not linked to the app |
| Price stuck on `$1.99` in production forever | Store catalog not returning the SKU (check ID + agreements) |
| Buy works, Restore fails | Restore path / account — retry signed into same sandbox / license tester |
| Ads still show after buy | Build still on mock ads, or purchase did not set entitlement — check logs / Restore |

---

## Review notes (paste into ASC / Play)

> No login required. Remove Ads is a one-time non-consumable (`com.aquasort.lab.remove_ads`) in Supply Store. It removes banner and interstitial ads only; optional rewarded ads remain. Use Restore Purchases after reinstall. Centrifuge uses virtual coins only — no real-money gambling.
