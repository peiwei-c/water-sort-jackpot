/**
 * Candy Crush–style lives: capped pool, timed regen, ad refill.
 * Pure data + math — no UI or ad code.
 */

export const MAX_LIVES = 10;
/** One life every 30 minutes while below max. */
export const LIFE_REGEN_MS = 30 * 60 * 1000;

export type LivesState = {
  lives: number;
  /** Epoch ms when the next life drops; null when at max. */
  nextLifeAt: number | null;
};

export function createFullLives(): LivesState {
  return { lives: MAX_LIVES, nextLifeAt: null };
}

function clampLives(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_LIVES, Math.floor(n)));
}

/**
 * Apply any lives that matured since `nextLifeAt` (supports catch-up after long absences).
 */
export function syncLives(state: LivesState, now: number = Date.now()): LivesState {
  let lives = clampLives(state.lives);
  let nextLifeAt = state.nextLifeAt;

  if (lives >= MAX_LIVES) {
    return { lives: MAX_LIVES, nextLifeAt: null };
  }

  if (nextLifeAt == null || !Number.isFinite(nextLifeAt)) {
    return { lives, nextLifeAt: now + LIFE_REGEN_MS };
  }

  while (lives < MAX_LIVES && now >= nextLifeAt) {
    lives += 1;
    if (lives >= MAX_LIVES) {
      return { lives: MAX_LIVES, nextLifeAt: null };
    }
    nextLifeAt += LIFE_REGEN_MS;
  }

  return { lives, nextLifeAt };
}

export function canSpendLife(
  state: LivesState,
  now: number = Date.now(),
): boolean {
  return syncLives(state, now).lives >= 1;
}

/**
 * Spend one life to start / retry a station.
 * Returns null when none available after sync.
 */
export function spendLife(
  state: LivesState,
  now: number = Date.now(),
): LivesState | null {
  const synced = syncLives(state, now);
  if (synced.lives < 1) return null;
  const lives = synced.lives - 1;
  if (lives >= MAX_LIVES) {
    return { lives: MAX_LIVES, nextLifeAt: null };
  }
  const nextLifeAt =
    synced.nextLifeAt != null ? synced.nextLifeAt : now + LIFE_REGEN_MS;
  return { lives, nextLifeAt };
}

/** Grant lives from rewarded ads (never above MAX_LIVES). */
export function grantLife(
  state: LivesState,
  amount: number = 1,
  now: number = Date.now(),
): LivesState {
  const synced = syncLives(state, now);
  const add = Math.max(0, Math.floor(amount));
  const lives = Math.min(MAX_LIVES, synced.lives + add);
  if (lives >= MAX_LIVES) {
    return { lives: MAX_LIVES, nextLifeAt: null };
  }
  return {
    lives,
    nextLifeAt: synced.nextLifeAt ?? now + LIFE_REGEN_MS,
  };
}

/** Ms until the next regenerating life, or null when full. */
export function msUntilNextLife(
  state: LivesState,
  now: number = Date.now(),
): number | null {
  const synced = syncLives(state, now);
  if (synced.lives >= MAX_LIVES || synced.nextLifeAt == null) return null;
  return Math.max(0, synced.nextLifeAt - now);
}

/** Format remaining regen as m:ss or h:mm:ss. */
export function formatRegenCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
