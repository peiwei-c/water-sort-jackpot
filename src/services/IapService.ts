/**
 * In-app purchase stub — mock Remove Ads until real billing is wired.
 */

import { allowMockMonetization } from './monetizationGate';

export const REMOVE_ADS_PRODUCT_ID = 'remove_ads';
export const REMOVE_ADS_PRICE_LABEL = '$1.99';

export type PurchaseResult = {
  success: boolean;
  productId: string;
  message: string;
};

/**
 * Purchase Remove Ads.
 * Mock succeeds only when allowMockMonetization() is true (__DEV__ or
 * EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION=true). Production must swap for
 * StoreKit / Play Billing / RevenueCat.
 */
export async function purchaseRemoveAds(): Promise<PurchaseResult> {
  await new Promise((r) => setTimeout(r, 400));

  if (!allowMockMonetization()) {
    return {
      success: false,
      productId: REMOVE_ADS_PRODUCT_ID,
      message:
        'Billing not configured — wire StoreKit / Play Billing before release',
    };
  }

  return {
    success: true,
    productId: REMOVE_ADS_PRODUCT_ID,
    message: 'Remove Ads unlocked (mock)',
  };
}

export async function restorePurchases(): Promise<{
  isNoAdsPurchased: boolean;
}> {
  // Mock has nothing to restore from the store.
  return { isNoAdsPurchased: false };
}
