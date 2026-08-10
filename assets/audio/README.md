# Audio assets (placeholders)

These short WAV tones exist so `AudioManager` works out of the box.

| File | Role |
|------|------|
| `bgm_home.wav` | Menu / path / store bed (loops) |
| `bgm_play.wav` | Sorting bench bed (loops) |
| `sfx_tap.wav` | UI tap |
| `sfx_pour.wav` | Successful pour |
| `sfx_success.wav` | Level / campaign clear |
| `sfx_fail.wav` | Out of moves |

Replace with real music/SFX (keep filenames, or update `src/services/audio/audioCatalog.ts`). Prefer looping-friendly BGM and short one-shots for SFX.
