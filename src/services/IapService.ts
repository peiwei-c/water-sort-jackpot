/**
 * Remove Ads IAP via StoreKit 2 / Play Billing (expo-iap).
 * Mock path only when allowMockMonetization() is true (dev / Jest / explicit flag).
 */

import { allowMockMonetization } from './monetizationGate';

/** Must match App Store Connect + Play Console non-consumable product id. */
export const REMOVE_ADS_PRODUCT_ID =
  process.env.EXPO_PUBLIC_IAP_REMOVE_ADS_ID ?? 'com.aquasort.lab.remove_ads';

/** Fallback until the store returns a localized price. */
export const REMOVE_ADS_PRICE_LABEL = '$1.99';

export type PurchaseResult = {
  success: boolean;
  productId: string;
  message: string;
  /** True when the shopper cancelled the system sheet. */
  cancelled?: boolean;
};

type ExpoIap = typeof import('expo-iap');

let iapModule: ExpoIap | null | undefined;
let connectionReady = false;
let cachedPriceLabel: string | null = null;

function isWebRuntime(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native') as typeof import('react-native');
    return Platform.OS === 'web';
  } catch {
    // Jest / Node without RN — treat as non-native.
    return true;
  }
}

function loadExpoIap(): ExpoIap | null {
  if (iapModule !== undefined) return iapModule;
  try {
    // Lazy require keeps Jest / web from hard-crashing when native is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iapModule = require('expo-iap') as ExpoIap;
    return iapModule;
  } catch (e) {
    console.warn('[IapService] expo-iap unavailable', e);
    iapModule = null;
    return null;
  }
}

function isNativeStoreAvailable(): boolean {
  if (isWebRuntime()) return false;
  return loadExpoIap() != null;
}

async function ensureConnection(): Promise<ExpoIap> {
  const iap = loadExpoIap();
  if (!iap) {
    throw new Error('In-app purchases require a native iOS/Android build');
  }
  if (!connectionReady) {
    await iap.initConnection();
    connectionReady = true;
  }
  return iap;
}

function purchaseMatchesRemoveAds(productId: string | null | undefined): boolean {
  if (!productId) return false;
  return (
    productId === REMOVE_ADS_PRODUCT_ID ||
    // Legacy mock / early id still treated as owned if somehow present.
    productId === 'remove_ads'
  );
}

async function mockPurchaseRemoveAds(): Promise<PurchaseResult> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    success: true,
    productId: REMOVE_ADS_PRODUCT_ID,
    message: 'Remove Ads unlocked (mock)',
  };
}

/**
 * Localized price from the store when available; otherwise fallback label.
 */
export async function getRemoveAdsPriceLabel(): Promise<string> {
  if (cachedPriceLabel) return cachedPriceLabel;
  if (!isNativeStoreAvailable()) return REMOVE_ADS_PRICE_LABEL;

  try {
    const iap = await ensureConnection();
    const products = await iap.fetchProducts({
      skus: [REMOVE_ADS_PRODUCT_ID],
      type: 'in-app',
    });
    const list = Array.isArray(products) ? products : [];
    const match = list.find((p) => p.id === REMOVE_ADS_PRODUCT_ID);
    if (match?.displayPrice) {
      cachedPriceLabel = match.displayPrice;
      return cachedPriceLabel;
    }
  } catch (e) {
    console.warn('[IapService] fetchProducts price failed', e);
  }
  return REMOVE_ADS_PRICE_LABEL;
}

/**
 * Purchase Remove Ads (non-consumable).
 * Listens for purchase-updated / purchase-error; finishes the transaction on success.
 */
export async function purchaseRemoveAds(): Promise<PurchaseResult> {
  if (!isNativeStoreAvailable()) {
    if (allowMockMonetization()) return mockPurchaseRemoveAds();
    return {
      success: false,
      productId: REMOVE_ADS_PRODUCT_ID,
      message: 'Billing unavailable on this platform',
    };
  }

  let iap: ExpoIap;
  try {
    iap = await ensureConnection();
  } catch (e) {
    if (allowMockMonetization()) return mockPurchaseRemoveAds();
    return {
      success: false,
      productId: REMOVE_ADS_PRODUCT_ID,
      message: e instanceof Error ? e.message : 'Could not connect to the store',
    };
  }

  try {
    const products = await iap.fetchProducts({
      skus: [REMOVE_ADS_PRODUCT_ID],
      type: 'in-app',
    });
    const list = Array.isArray(products) ? products : [];
    const product = list.find((p) => p.id === REMOVE_ADS_PRODUCT_ID);
    if (!product) {
      if (allowMockMonetization()) return mockPurchaseRemoveAds();
      return {
        success: false,
        productId: REMOVE_ADS_PRODUCT_ID,
        message:
          'Remove Ads product not found — create it in App Store Connect / Play Console',
      };
    }
    if (product.displayPrice) cachedPriceLabel = product.displayPrice;
  } catch (e) {
    if (allowMockMonetization()) return mockPurchaseRemoveAds();
    return {
      success: false,
      productId: REMOVE_ADS_PRODUCT_ID,
      message: e instanceof Error ? e.message : 'Could not load store products',
    };
  }

  return new Promise<PurchaseResult>((resolve) => {
    let settled = false;
    const cleanup = () => {
      updated.remove();
      errored.remove();
      clearTimeout(timer);
    };
    const settle = (result: PurchaseResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const updated = iap.purchaseUpdatedListener(async (purchase) => {
      if (!purchaseMatchesRemoveAds(purchase.productId)) return;
      if (purchase.purchaseState === 'pending') {
        settle({
          success: false,
          productId: REMOVE_ADS_PRODUCT_ID,
          message: 'Purchase pending — try Restore Purchases shortly',
        });
        return;
      }
      try {
        await iap.finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.warn('[IapService] finishTransaction', e);
      }
      settle({
        success: true,
        productId: REMOVE_ADS_PRODUCT_ID,
        message: 'Ads removed — rewarded ads still available',
      });
    });

    const errored = iap.purchaseErrorListener((error) => {
      if (error.code === iap.ErrorCode.UserCancelled) {
        settle({
          success: false,
          productId: REMOVE_ADS_PRODUCT_ID,
          message: 'Purchase cancelled',
          cancelled: true,
        });
        return;
      }
      if (error.code === iap.ErrorCode.AlreadyOwned) {
        settle({
          success: true,
          productId: REMOVE_ADS_PRODUCT_ID,
          message: 'Ads already removed — restored',
        });
        return;
      }
      settle({
        success: false,
        productId: REMOVE_ADS_PRODUCT_ID,
        message: error.message || 'Purchase failed',
      });
    });

    const timer = setTimeout(() => {
      settle({
        success: false,
        productId: REMOVE_ADS_PRODUCT_ID,
        message: 'Purchase timed out — check your connection and try again',
      });
    }, 120_000);

    void iap
      .requestPurchase({
        type: 'in-app',
        request: {
          apple: { sku: REMOVE_ADS_PRODUCT_ID },
          google: { skus: [REMOVE_ADS_PRODUCT_ID] },
        },
      })
      .catch((e: unknown) => {
        settle({
          success: false,
          productId: REMOVE_ADS_PRODUCT_ID,
          message: e instanceof Error ? e.message : 'Could not start purchase',
        });
      });
  });
}

/**
 * Restore non-consumable Remove Ads from the store.
 */
export async function restorePurchases(): Promise<{
  isNoAdsPurchased: boolean;
  message: string;
}> {
  if (!isNativeStoreAvailable()) {
    if (allowMockMonetization()) {
      return { isNoAdsPurchased: false, message: 'Nothing to restore (mock)' };
    }
    return {
      isNoAdsPurchased: false,
      message: 'Restore requires a native iOS/Android build',
    };
  }

  try {
    const iap = await ensureConnection();
    const purchases = await iap.getAvailablePurchases();
    let owned = false;
    for (const purchase of purchases) {
      if (!purchaseMatchesRemoveAds(purchase.productId)) continue;
      owned = true;
      try {
        await iap.finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.warn('[IapService] finish on restore', e);
      }
    }
    return {
      isNoAdsPurchased: owned,
      message: owned
        ? 'Purchases restored — ads removed'
        : 'No Remove Ads purchase found for this account',
    };
  } catch (e) {
    if (allowMockMonetization()) {
      return { isNoAdsPurchased: false, message: 'Nothing to restore (mock)' };
    }
    return {
      isNoAdsPurchased: false,
      message: e instanceof Error ? e.message : 'Restore failed',
    };
  }
}

/** Test helper. */
export function resetIapServiceForTests(): void {
  connectionReady = false;
  cachedPriceLabel = null;
  iapModule = undefined;
}
