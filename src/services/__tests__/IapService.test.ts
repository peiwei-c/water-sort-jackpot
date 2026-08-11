import {
  REMOVE_ADS_PRODUCT_ID,
  REMOVE_ADS_PRICE_LABEL,
  purchaseRemoveAds,
  restorePurchases,
  getRemoveAdsPriceLabel,
  resetIapServiceForTests,
} from '../IapService';
import { allowMockMonetization } from '../monetizationGate';

jest.mock('expo-iap', () => {
  throw new Error('expo-iap mock missing — tests should use allowMockMonetization');
});

describe('IapService', () => {
  const prevAllow = process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION;

  beforeEach(() => {
    resetIapServiceForTests();
    process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION = 'true';
  });

  afterEach(() => {
    if (prevAllow === undefined) {
      delete process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION;
    } else {
      process.env.EXPO_PUBLIC_ALLOW_MOCK_MONETIZATION = prevAllow;
    }
    resetIapServiceForTests();
  });

  it('exports a reverse-DNS product id for store consoles', () => {
    expect(REMOVE_ADS_PRODUCT_ID).toMatch(/^com\.aquasort\.lab\./);
  });

  it('mock purchase succeeds when mock monetization is allowed', async () => {
    expect(allowMockMonetization()).toBe(true);
    const result = await purchaseRemoveAds();
    expect(result.success).toBe(true);
    expect(result.productId).toBe(REMOVE_ADS_PRODUCT_ID);
    expect(result.message).toMatch(/mock/i);
  });

  it('returns fallback price label without a native store', async () => {
    await expect(getRemoveAdsPriceLabel()).resolves.toBe(REMOVE_ADS_PRICE_LABEL);
  });

  it('restore reports nothing owned on mock path', async () => {
    const result = await restorePurchases();
    expect(result.isNoAdsPurchased).toBe(false);
  });
});
