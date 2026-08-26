import {
  MockAdService,
  FailClosedAdService,
  createAdService,
  resetAdService,
  isInterstitialClearLevel,
} from '../AdService';

describe('AdService mock', () => {
  beforeEach(() => {
    resetAdService();
  });

  it('initializes and reports ready', async () => {
    const ads = new MockAdService();
    expect(ads.isReady('banner')).toBe(false);
    await ads.initialize();
    expect(ads.isReady('interstitial')).toBe(true);
  });

  it('completes rewarded video with rewarded=true', async () => {
    const ads = new MockAdService();
    const result = await ads.showRewarded('rewarded_free_spins');
    expect(result.success).toBe(true);
    expect(result.rewarded).toBe(true);
    expect(result.provider).toBe('mock');
  });

  it('completes interstitial without reward', async () => {
    const ads = new MockAdService();
    const result = await ads.showInterstitial('interstitial_level');
    expect(result.success).toBe(true);
    expect(result.rewarded).toBe(false);
  });

  it('createAdService defaults to mock in test/dev', () => {
    expect(createAdService('mock')).toBeInstanceOf(MockAdService);
  });

  it('FailClosedAdService never grants rewards and stays not ready', async () => {
    const ads = new FailClosedAdService();
    await ads.initialize();
    expect(ads.isReady('rewarded')).toBe(false);
    expect(ads.isReady('interstitial')).toBe(false);
    const rewarded = await ads.showRewarded('rewarded_hint');
    expect(rewarded.success).toBe(false);
    expect(rewarded.rewarded).toBe(false);
  });

  it('admob fails closed when native SDK is unavailable', async () => {
    const admob = createAdService('admob');
    await expect(admob.initialize()).resolves.toBeUndefined();
    const result = await admob.showRewarded('rewarded_free_spins');
    expect(result.provider).toBe('admob');
    expect(result.success).toBe(false);
    expect(result.rewarded).toBe(false);
  });

  it('applovin stub never grants rewards', async () => {
    const applovin = createAdService('applovin');
    await expect(applovin.initialize()).resolves.toBeUndefined();
    const result = await applovin.showRewarded('rewarded_free_spins');
    expect(result.rewarded).toBe(false);
  });
});

describe('isInterstitialClearLevel', () => {
  it('is true only on tickets 10, 20, 30, …', () => {
    expect(isInterstitialClearLevel(0)).toBe(false);
    expect(isInterstitialClearLevel(1)).toBe(false);
    expect(isInterstitialClearLevel(9)).toBe(false);
    expect(isInterstitialClearLevel(10)).toBe(true);
    expect(isInterstitialClearLevel(11)).toBe(false);
    expect(isInterstitialClearLevel(20)).toBe(true);
    expect(isInterstitialClearLevel(30)).toBe(true);
  });
});
