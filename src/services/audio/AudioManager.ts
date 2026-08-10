import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import {
  BGM_FADE_MS,
  BGM_SOURCES,
  SFX_POOL_SIZE,
  SFX_SOURCES,
  type BgmId,
  type SfxId,
} from './audioCatalog';
import {
  DEFAULT_AUDIO_PREFS,
  effectiveVolume,
  loadAudioPrefs,
  normalizePrefs,
  saveAudioPrefs,
  type AudioPrefs,
} from './audioPrefs';

type PrefsListener = (prefs: AudioPrefs) => void;

type FadeHandle = {
  cancel: () => void;
};

/**
 * Singleton audio bus for AquaSort.
 * - BGM: dual-player crossfade, looping, AppState pause/resume
 * - SFX: fixed pool so overlapping pours/taps don't cut each other off
 * - Prefs: volume + mute per bus, persisted via AsyncStorage
 */
export class AudioManager {
  private ready = false;
  private prefs: AudioPrefs = { ...DEFAULT_AUDIO_PREFS };
  private listeners = new Set<PrefsListener>();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  private bgmA: AudioPlayer | null = null;
  private bgmB: AudioPlayer | null = null;
  private activeBgm: 'A' | 'B' = 'A';
  private currentBgm: BgmId | null = null;
  private bgmSuspended = false;
  private fade: FadeHandle | null = null;

  private sfxPool: AudioPlayer[] = [];
  private sfxCursor = 0;

  async initialize(): Promise<void> {
    if (this.ready) return;

    this.prefs = await loadAudioPrefs();

    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
    });
    await setIsAudioActiveAsync(true);

    this.bgmA = createAudioPlayer(null, { updateInterval: 500 });
    this.bgmB = createAudioPlayer(null, { updateInterval: 500 });
    this.bgmA.loop = true;
    this.bgmB.loop = true;
    this.bgmA.volume = 0;
    this.bgmB.volume = 0;

    for (let i = 0; i < SFX_POOL_SIZE; i++) {
      const p = createAudioPlayer(null, { updateInterval: 250 });
      p.loop = false;
      p.volume = this.sfxGain();
      this.sfxPool.push(p);
    }

    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  getPrefs(): AudioPrefs {
    return { ...this.prefs };
  }

  /** Subscribe to preference changes (settings UI). Returns unsubscribe. */
  subscribe(listener: PrefsListener): () => void {
    this.listeners.add(listener);
    listener(this.getPrefs());
    return () => this.listeners.delete(listener);
  }

  setBgmVolume(volume: number): void {
    this.patchPrefs({ bgmVolume: volume });
    this.applyBgmGain();
  }

  setSfxVolume(volume: number): void {
    this.patchPrefs({ sfxVolume: volume });
    this.applySfxGain();
  }

  setBgmMuted(muted: boolean): void {
    this.patchPrefs({ bgmMuted: muted });
    this.applyBgmGain();
    if (muted) {
      this.pauseBgmPlayers();
    } else if (!this.bgmSuspended && this.currentBgm) {
      this.resumeBgmPlayers();
    }
  }

  setSfxMuted(muted: boolean): void {
    this.patchPrefs({ sfxMuted: muted });
    this.applySfxGain();
  }

  toggleBgmMute(): void {
    this.setBgmMuted(!this.prefs.bgmMuted);
  }

  toggleSfxMute(): void {
    this.setSfxMuted(!this.prefs.sfxMuted);
  }

  /**
   * Crossfade (or start) a looping BGM track.
   * Safe to call repeatedly with the same id — no restart.
   */
  async playBgm(track: BgmId, fadeMs: number = BGM_FADE_MS): Promise<void> {
    await this.ensureReady();
    if (this.currentBgm === track && !this.bgmSuspended) {
      this.applyBgmGain();
      return;
    }

    const incoming = this.activeBgm === 'A' ? this.bgmB : this.bgmA;
    const outgoing = this.activeBgm === 'A' ? this.bgmA : this.bgmB;
    if (!incoming || !outgoing) return;

    this.fade?.cancel();
    this.currentBgm = track;
    this.activeBgm = this.activeBgm === 'A' ? 'B' : 'A';

    const target = this.bgmGain();
    incoming.replace(BGM_SOURCES[track]);
    incoming.loop = true;
    incoming.volume = 0;
    try {
      await incoming.seekTo(0);
    } catch {
      // Fresh replace may not need seek.
    }

    if (!this.prefs.bgmMuted && !this.bgmSuspended) {
      incoming.play();
    }

    const outStart = outgoing.volume;
    this.fade = rampVolumes({
      durationMs: fadeMs,
      onUpdate: (t) => {
        incoming.volume = target * t;
        outgoing.volume = outStart * (1 - t);
      },
      onDone: () => {
        outgoing.pause();
        outgoing.volume = 0;
      },
    });
  }

  /** Soft-stop current BGM (e.g. leaving the app for good). */
  async stopBgm(fadeMs: number = BGM_FADE_MS): Promise<void> {
    await this.ensureReady();
    this.fade?.cancel();
    const active = this.activeBgm === 'A' ? this.bgmA : this.bgmB;
    if (!active) return;
    const start = active.volume;
    this.fade = rampVolumes({
      durationMs: fadeMs,
      onUpdate: (t) => {
        active.volume = start * (1 - t);
      },
      onDone: () => {
        active.pause();
        active.volume = 0;
        this.currentBgm = null;
      },
    });
  }

  /** App background / inactive — pause BGM, keep prefs. */
  async handleAppBackground(): Promise<void> {
    if (!this.ready) return;
    this.bgmSuspended = true;
    this.fade?.cancel();
    this.pauseBgmPlayers();
    await setIsAudioActiveAsync(false);
  }

  /** App foreground — resume BGM if unmuted. */
  async handleAppForeground(): Promise<void> {
    if (!this.ready) return;
    this.bgmSuspended = false;
    await setIsAudioActiveAsync(true);
    if (!this.prefs.bgmMuted && this.currentBgm) {
      this.applyBgmGain();
      this.resumeBgmPlayers();
    }
  }

  /** Fire a one-shot from the SFX pool (overlapping OK). */
  playSfx(id: SfxId): void {
    if (!this.ready || this.prefs.sfxMuted) return;
    const source = SFX_SOURCES[id];
    const player = this.nextSfxPlayer();
    if (!player) return;

    try {
      player.replace(source);
      player.loop = false;
      player.volume = this.sfxGain();
      void player.seekTo(0).finally(() => {
        player.play();
      });
    } catch {
      // Ignore decode / replace races on rapid taps.
    }
  }

  /** Release native players (tests / hot reload teardown). */
  dispose(): void {
    this.fade?.cancel();
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.bgmA?.remove();
    this.bgmB?.remove();
    for (const p of this.sfxPool) p.remove();
    this.bgmA = null;
    this.bgmB = null;
    this.sfxPool = [];
    this.ready = false;
    this.currentBgm = null;
  }

  // —— internals ——

  private async ensureReady(): Promise<void> {
    if (!this.ready) await this.initialize();
  }

  private bgmGain(): number {
    return effectiveVolume(this.prefs.bgmVolume, this.prefs.bgmMuted);
  }

  private sfxGain(): number {
    return effectiveVolume(this.prefs.sfxVolume, this.prefs.sfxMuted);
  }

  private applyBgmGain(): void {
    const gain = this.bgmGain();
    const active = this.activeBgm === 'A' ? this.bgmA : this.bgmB;
    if (active && !this.bgmSuspended) active.volume = gain;
  }

  private applySfxGain(): void {
    const gain = this.sfxGain();
    for (const p of this.sfxPool) p.volume = gain;
  }

  private pauseBgmPlayers(): void {
    this.bgmA?.pause();
    this.bgmB?.pause();
  }

  private resumeBgmPlayers(): void {
    const active = this.activeBgm === 'A' ? this.bgmA : this.bgmB;
    if (!active || this.prefs.bgmMuted) return;
    active.volume = this.bgmGain();
    active.play();
  }

  private nextSfxPlayer(): AudioPlayer | null {
    if (this.sfxPool.length === 0) return null;
    // Prefer a free (not playing) slot; otherwise round-robin steal.
    for (let i = 0; i < this.sfxPool.length; i++) {
      const idx = (this.sfxCursor + i) % this.sfxPool.length;
      const p = this.sfxPool[idx];
      if (!p.playing) {
        this.sfxCursor = (idx + 1) % this.sfxPool.length;
        return p;
      }
    }
    const stolen = this.sfxPool[this.sfxCursor];
    this.sfxCursor = (this.sfxCursor + 1) % this.sfxPool.length;
    return stolen;
  }

  private patchPrefs(partial: Partial<AudioPrefs>): void {
    this.prefs = normalizePrefs({ ...this.prefs, ...partial });
    for (const l of this.listeners) l(this.getPrefs());
    this.schedulePersist();
  }

  private schedulePersist(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      void saveAudioPrefs(this.prefs);
    }, 200);
  }
}

function rampVolumes(opts: {
  durationMs: number;
  onUpdate: (t: number) => void;
  onDone: () => void;
}): FadeHandle {
  const steps = Math.max(1, Math.round(opts.durationMs / 32));
  let i = 0;
  const id = setInterval(() => {
    i += 1;
    const t = Math.min(1, i / steps);
    opts.onUpdate(t);
    if (t >= 1) {
      clearInterval(id);
      opts.onDone();
    }
  }, 32);
  return {
    cancel: () => {
      clearInterval(id);
    },
  };
}

let singleton: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!singleton) singleton = new AudioManager();
  return singleton;
}

/** Test helper — reset singleton between suites. */
export function __resetAudioManagerForTests(): void {
  singleton?.dispose();
  singleton = null;
}
