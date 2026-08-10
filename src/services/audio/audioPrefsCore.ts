export const DEFAULT_BGM_VOLUME = 0.55;
export const DEFAULT_SFX_VOLUME = 0.85;

export type AudioPrefs = {
  bgmVolume: number;
  sfxVolume: number;
  bgmMuted: boolean;
  sfxMuted: boolean;
};

export const DEFAULT_AUDIO_PREFS: AudioPrefs = {
  bgmVolume: DEFAULT_BGM_VOLUME,
  sfxVolume: DEFAULT_SFX_VOLUME,
  bgmMuted: false,
  sfxMuted: false,
};

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function normalizePrefs(raw: Partial<AudioPrefs> | null | undefined): AudioPrefs {
  return {
    bgmVolume: clamp01(
      typeof raw?.bgmVolume === 'number' ? raw.bgmVolume : DEFAULT_BGM_VOLUME,
    ),
    sfxVolume: clamp01(
      typeof raw?.sfxVolume === 'number' ? raw.sfxVolume : DEFAULT_SFX_VOLUME,
    ),
    bgmMuted: raw?.bgmMuted === true,
    sfxMuted: raw?.sfxMuted === true,
  };
}

export function effectiveVolume(volume: number, muted: boolean): number {
  return muted ? 0 : clamp01(volume);
}
