import {
  MAX_LIVES,
  LIFE_REGEN_MS,
  createFullLives,
  syncLives,
  canSpendLife,
  spendLife,
  grantLife,
  msUntilNextLife,
  formatRegenCountdown,
} from '../LivesEngine';

describe('LivesEngine (Candy Crush–style)', () => {
  const t0 = 1_700_000_000_000;

  it('starts full with no regen timer', () => {
    expect(createFullLives()).toEqual({ lives: MAX_LIVES, nextLifeAt: null });
  });

  it('spends a life and starts the regen timer from full', () => {
    const next = spendLife(createFullLives(), t0);
    expect(next).toEqual({
      lives: MAX_LIVES - 1,
      nextLifeAt: t0 + LIFE_REGEN_MS,
    });
  });

  it('refuses spend when empty', () => {
    const empty = { lives: 0, nextLifeAt: t0 + LIFE_REGEN_MS };
    expect(canSpendLife(empty, t0)).toBe(false);
    expect(spendLife(empty, t0)).toBeNull();
  });

  it('regenerates one life after the timer', () => {
    const state = { lives: 3, nextLifeAt: t0 + LIFE_REGEN_MS };
    expect(syncLives(state, t0 + LIFE_REGEN_MS - 1).lives).toBe(3);
    expect(syncLives(state, t0 + LIFE_REGEN_MS)).toEqual({
      lives: 4,
      nextLifeAt: t0 + 2 * LIFE_REGEN_MS,
    });
  });

  it('catches up multiple lives after a long absence', () => {
    const state = { lives: 1, nextLifeAt: t0 };
    const synced = syncLives(state, t0 + 3 * LIFE_REGEN_MS);
    expect(synced.lives).toBe(MAX_LIVES);
    expect(synced.nextLifeAt).toBeNull();
  });

  it('fills to max and clears the timer', () => {
    const state = { lives: 4, nextLifeAt: t0 };
    expect(syncLives(state, t0)).toEqual({
      lives: MAX_LIVES,
      nextLifeAt: null,
    });
  });

  it('grants one life from an ad without exceeding max', () => {
    const low = { lives: 2, nextLifeAt: t0 + LIFE_REGEN_MS };
    expect(grantLife(low, 1, t0)).toEqual({
      lives: 3,
      nextLifeAt: t0 + LIFE_REGEN_MS,
    });
    expect(grantLife(createFullLives(), 1, t0)).toEqual(createFullLives());
  });

  it('reports countdown only while regenerating', () => {
    expect(msUntilNextLife(createFullLives(), t0)).toBeNull();
    const regenerating = { lives: 2, nextLifeAt: t0 + 90_000 };
    expect(msUntilNextLife(regenerating, t0)).toBe(90_000);
  });

  it('formats countdown as m:ss', () => {
    expect(formatRegenCountdown(90_000)).toBe('1:30');
    expect(formatRegenCountdown(5_000)).toBe('0:05');
    expect(formatRegenCountdown(3_600_000)).toBe('1:00:00');
  });
});
