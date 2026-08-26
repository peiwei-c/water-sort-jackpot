import { bootstrapAds } from '../adsBootstrap';
import { adsDisabled } from '../monetizationGate';

describe('adsBootstrap', () => {
  const prevNoAds = process.env.EXPO_PUBLIC_NO_ADS;

  afterEach(() => {
    if (prevNoAds === undefined) delete process.env.EXPO_PUBLIC_NO_ADS;
    else process.env.EXPO_PUBLIC_NO_ADS = prevNoAds;
  });

  it('completes without throwing when native SDKs are missing', async () => {
    const result = await bootstrapAds();
    expect(result).toMatchObject({
      consentOk: expect.any(Boolean),
      trackingStatus: expect.any(String),
      adsReady: expect.any(Boolean),
      message: expect.any(String),
    });
  });

  it('skips AdMob init when EXPO_PUBLIC_NO_ADS is set', async () => {
    process.env.EXPO_PUBLIC_NO_ADS = 'true';
    expect(adsDisabled()).toBe(true);
    const result = await bootstrapAds();
    expect(result).toEqual({
      consentOk: true,
      trackingStatus: 'ads-disabled',
      adsReady: false,
      message: 'Ads disabled for this build',
    });
  });
});
