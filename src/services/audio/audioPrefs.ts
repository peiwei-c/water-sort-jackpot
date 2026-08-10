import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_AUDIO_PREFS,
  normalizePrefs,
  type AudioPrefs,
} from './audioPrefsCore';

export type { AudioPrefs } from './audioPrefsCore';
export {
  DEFAULT_AUDIO_PREFS,
  DEFAULT_BGM_VOLUME,
  DEFAULT_SFX_VOLUME,
  clamp01,
  normalizePrefs,
  effectiveVolume,
} from './audioPrefsCore';

const STORAGE_KEY = 'aquasort.audio.v1';

export async function loadAudioPrefs(): Promise<AudioPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_PREFS };
    return normalizePrefs(JSON.parse(raw) as Partial<AudioPrefs>);
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

export async function saveAudioPrefs(prefs: AudioPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePrefs(prefs)));
  } catch {
    // Ignore — audio still works in-memory.
  }
}
