import {
  MockAdService,
  createAdService,
  INTERSTITIAL_EVERY_N_LEVELS,
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

  it('createAdService defaults to mock', () => {
    expect(createAdService('mock')).toBeInstanceOf(MockAdService);
  });

  it('uses interstitial cadence of every 3 levels', () => {
    expect(INTERSTITIAL_EVERY_N_LEVELS).toBe(3);
  });
});
