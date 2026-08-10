import {
  clamp01,
  effectiveVolume,
  normalizePrefs,
  DEFAULT_AUDIO_PREFS,
} from '../audioPrefsCore';

describe('audioPrefsCore', () => {
  it('clamps volume to 0..1', () => {
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(1.5)).toBe(1);
  });

  it('effective volume is zero when muted', () => {
    expect(effectiveVolume(0.8, true)).toBe(0);
    expect(effectiveVolume(0.8, false)).toBe(0.8);
  });

  it('normalizes partial / bad prefs to safe defaults', () => {
    expect(normalizePrefs(null)).toEqual(DEFAULT_AUDIO_PREFS);
    expect(normalizePrefs({ bgmVolume: 2, sfxMuted: true })).toEqual({
      bgmVolume: 1,
      sfxVolume: DEFAULT_AUDIO_PREFS.sfxVolume,
      bgmMuted: false,
      sfxMuted: true,
    });
  });
});
