import {
  MockAdService,
  FailClosedAdService,
  createAdService,
  resetAdService,
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

  it('createAdService defaults to mock in __DEV__', () => {
    expect(createAdService('mock')).toBeInstanceOf(MockAdService);
  });

  it('FailClosedAdService never grants rewards', async () => {
    const ads = new FailClosedAdService();
    await ads.initialize();
    const rewarded = await ads.showRewarded('rewarded_hint');
    expect(rewarded.success).toBe(false);
    expect(rewarded.rewarded).toBe(false);
  });
});
