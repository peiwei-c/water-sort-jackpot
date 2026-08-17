# app-ads.txt — AdMob authorized sellers

AdMob crawls **`https://<hostname>/app-ads.txt`**, using only the **hostname** of the developer website on the store listing. It does **not** look under `/water-sort-jackpot/`.

| | |
|--|--|
| Live crawl URL | **https://peiwei-c.github.io/app-ads.txt** |
| Publisher line | `google.com, pub-3994151354323315, DIRECT, f08c47fec0942fa0` |
| Source in this repo | [`store/app-ads.txt`](./app-ads.txt) |
| Hosting repo | [`peiwei-c/peiwei-c.github.io`](https://github.com/peiwei-c/peiwei-c.github.io) (GitHub user Pages, domain root) |

Privacy / terms can stay at `https://peiwei-c.github.io/water-sort-jackpot/…`. Those are not the crawl URL.

---

## 1. Confirm the file is live

Open **https://peiwei-c.github.io/app-ads.txt** in a browser. You should see exactly:

```
google.com, pub-3994151354323315, DIRECT, f08c47fec0942fa0
```

If that 404s, push [`store/app-ads.txt`](./app-ads.txt) to the root of `peiwei-c/peiwei-c.github.io` on `main` (user Pages publishes from that repo automatically).

---

## 2. Put the same hostname on both store listings

The website field must use host **`peiwei-c.github.io`** (path is ignored by the crawler).

**Copy-paste URL (recommended):**

```
https://peiwei-c.github.io/water-sort-jackpot/
```

That keeps users on the legal/index pages and still crawls `https://peiwei-c.github.io/app-ads.txt`.

### Google Play Console

1. Sign in to [Play Console](https://play.google.com/console).
2. **Grow users → Store presence → Store settings**.
3. **Store listing contact details → Website** → paste the URL above.
4. Save. AdMob can take **up to 24 hours** to notice a new/changed Play website.

Confirm on the public Play listing that **Developer website** appears under app support.

### Apple App Store Connect

1. Open AquaSort Lab → **App Information**.
2. **Marketing URL** (developer website) → paste the same URL.
3. Save. On a live listing this shows as **Developer Website**. Marketing URL is often only editable with a new version.

Support URL / Privacy URL can remain the existing Pages privacy link.

---

## 3. Ask AdMob to crawl

1. [AdMob](https://admob.google.com) → **Apps → View all apps → app-ads.txt**.
2. Expand the app row → **Check for updates** / crawl (if shown).
3. Status can take a few minutes, sometimes up to **24 hours**.

Expected: file found, one `DIRECT` Google line, publisher `pub-3994151354323315`.

---

## If crawl fails

| Symptom | Fix |
|--|--|
| File not found | Website hostname is not `peiwei-c.github.io`, or `https://peiwei-c.github.io/app-ads.txt` 404s |
| File at `/water-sort-jackpot/app-ads.txt` only | Crawler never looks there — publish at domain root |
| Play website updated today | Wait up to 24h for AdMob to pick up the listing URL |
| Wrong publisher ID | Must be `pub-3994151354323315` (same as AdMob app IDs in `app.json`) |
