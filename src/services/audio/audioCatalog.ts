import type { AudioSource } from 'expo-audio';
import { DEFAULT_BGM_VOLUME, DEFAULT_SFX_VOLUME } from './audioPrefsCore';

/** Background music track ids. */
export type BgmId = 'home' | 'play';

/** One-shot SFX ids. */
export type SfxId = 'tap' | 'pour' | 'success' | 'fail';

/**
 * Local asset map. Placeholder tones live in `assets/audio/` —
 * swap the WAV/MP3 files (keep the same filenames) for production audio.
 */
export const BGM_SOURCES: Record<BgmId, AudioSource> = {
  home: require('../../assets/audio/bgm_home.wav'),
  play: require('../../assets/audio/bgm_play.wav'),
};

export const SFX_SOURCES: Record<SfxId, AudioSource> = {
  tap: require('../../assets/audio/sfx_tap.wav'),
  pour: require('../../assets/audio/sfx_pour.wav'),
  success: require('../../assets/audio/sfx_success.wav'),
  fail: require('../../assets/audio/sfx_fail.wav'),
};

export const SFX_POOL_SIZE = 6;
export const BGM_FADE_MS = 700;
export { DEFAULT_BGM_VOLUME, DEFAULT_SFX_VOLUME };
