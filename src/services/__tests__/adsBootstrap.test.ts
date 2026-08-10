import { bootstrapAds } from '../adsBootstrap';

describe('adsBootstrap', () => {
  it('completes without throwing when native SDKs are missing', async () => {
    const result = await bootstrapAds();
    expect(result).toMatchObject({
      consentOk: expect.any(Boolean),
      trackingStatus: expect.any(String),
      adsReady: expect.any(Boolean),
      message: expect.any(String),
    });
  });
});
