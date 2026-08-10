import { useEffect, useState } from 'react';
import { getAudioManager } from '../services/audio/AudioManager';
import {
  DEFAULT_AUDIO_PREFS,
  type AudioPrefs,
} from '../services/audio/audioPrefs';

/** Live audio prefs for settings UI (volume sliders / mute toggles). */
export function useAudioPrefs(): AudioPrefs {
  const [prefs, setPrefs] = useState<AudioPrefs>(DEFAULT_AUDIO_PREFS);

  useEffect(() => {
    const audio = getAudioManager();
    return audio.subscribe(setPrefs);
  }, []);

  return prefs;
}
