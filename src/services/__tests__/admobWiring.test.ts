import {
  ADMOB_ANDROID_APP_ID,
  ADMOB_IOS_APP_ID,
  getAdMobUnitId,
  type AdMobUnitKind,
} from '../admobUnitIds';
import appJson from '../../../app.json';

const APP_ID = /^ca-app-pub-\d+~\d+$/;
const UNIT_ID = /^ca-app-pub-\d+\/\d+$/;
const KINDS: AdMobUnitKind[] = ['banner', 'interstitial', 'rewarded'];

describe('AdMob wiring config', () => {
  it('app.json plugin App IDs match module constants', () => {
    const plugin = appJson.expo.plugins.find(
      (entry) =>
        Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads',
    ) as [string, { androidAppId: string; iosAppId: string }] | undefined;

    expect(plugin).toBeDefined();
    expect(plugin![1].androidAppId).toBe(ADMOB_ANDROID_APP_ID);
    expect(plugin![1].iosAppId).toBe(ADMOB_IOS_APP_ID);
    expect(plugin![1].androidAppId).toMatch(APP_ID);
    expect(plugin![1].iosAppId).toMatch(APP_ID);
  });

  it('exposes formatted Android and iOS unit IDs for every kind', () => {
    for (const kind of KINDS) {
      const android = getAdMobUnitId(kind, 'android');
      const ios = getAdMobUnitId(kind, 'ios');
      expect(android).toMatch(UNIT_ID);
      expect(ios).toMatch(UNIT_ID);
      expect(android).not.toBe(ios);
    }
  });

  it('uses distinct unit IDs across platforms and formats', () => {
    const ids = KINDS.flatMap((kind) => [
      getAdMobUnitId(kind, 'android'),
      getAdMobUnitId(kind, 'ios'),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
