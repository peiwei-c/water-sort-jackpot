# Audio assets

| File | Role |
|------|------|
| `bgm_home.wav` | Menu / path / store bed — bright arcade-lab loop (~17s) |
| `bgm_play.wav` | Sorting bench bed — higher-energy groove (~15s) |
| `sfx_tap.wav` | UI tap |
| `sfx_pour.wav` | Liquid pour during vial transfer (~0.55s) |
| `sfx_success.wav` | Level / campaign clear |
| `sfx_fail.wav` | Out of moves |

BGM is stereo 22.05 kHz PCM, authored to loop. Swap files (keep filenames) or update `src/services/audio/audioCatalog.ts` for production music. SFX are still short placeholder one-shots.
