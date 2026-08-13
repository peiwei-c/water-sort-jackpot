import {
  sanitizePersistedGame,
  sanitizeSession,
} from '../persistence';
import { PATH_DEFAULT, VIAL_DEFAULT } from '../../engines/StoreCatalog';
import { localDayKey, localWeekKey } from '../../engines/MissionEngine';
import { MAX_LIVES } from '../../engines/LivesEngine';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

describe('persistence sanitization', () => {
  it('clamps economy fields, filters owned ids, and drops corrupt session', () => {
    const data = sanitizePersistedGame({
      unlockedLevel: 9999,
      highestCompleted: -3,
      coins: 50_000_000,
      undoItems: -1,
      ownedItemIds: [PATH_DEFAULT, 'not_real', VIAL_DEFAULT],
      isNoAdsPurchased: true,
      rareSkinUnlocked: true,
      levelsCompletedSinceAd: 99,
      hasSeenLabManual: true,
      session: {
        level: 1,
        capacity: 4,
        tubes: [[99], [1]],
        history: [],
        movesLeft: 10,
        moveLimit: 10,
      },
    });
    expect(data).not.toBeNull();
    expect(data!.unlockedLevel).toBe(3650);
    expect(data!.highestCompleted).toBe(0);
    expect(data!.coins).toBe(1_000_000);
    expect(data!.undoItems).toBe(0);
    expect(data!.ownedItemIds).not.toContain('not_real');
    expect(data!.ownedItemIds).toEqual(
      expect.arrayContaining([PATH_DEFAULT, VIAL_DEFAULT]),
    );
    expect(data!.isNoAdsPurchased).toBe(true);
    expect(data!.session).toBeNull();
    expect(data!.levelsCompletedSinceAd).toBe(99);
    expect(data!.hasSeenLabManual).toBe(true);
    expect(data!.rareSkinUnlocked).toBe(true);
    expect(data!.lives).toBe(MAX_LIVES);
    expect(data!.nextLifeAt).toBeNull();
    expect(data!.missionBoard.progress.daily_clear_3).toEqual({
      progress: 0,
      claimed: false,
    });
  });

  it('keeps regenerating lives below max and clamps overfill', () => {
    const regenerating = sanitizePersistedGame({
      unlockedLevel: 10,
      lives: 2,
      nextLifeAt: 1_700_000_000_000,
    });
    expect(regenerating!.lives).toBe(2);
    expect(regenerating!.nextLifeAt).toBe(1_700_000_000_000);

    const over = sanitizePersistedGame({
      unlockedLevel: 10,
      lives: 99,
      nextLifeAt: 1_700_000_000_000,
    });
    expect(over!.lives).toBe(MAX_LIVES);
    expect(over!.nextLifeAt).toBeNull();
  });

  it('restores mission progress and drops unknown mission ids', () => {
    const now = Date.now();
    const data = sanitizePersistedGame({
      unlockedLevel: 4,
      missionBoard: {
        dailyKey: localDayKey(now),
        weeklyKey: localWeekKey(now),
        progress: {
          daily_clear_3: { progress: 2, claimed: false },
          not_a_mission: { progress: 9, claimed: true },
        },
      },
    });
    expect(data!.missionBoard.progress.daily_clear_3.progress).toBe(2);
    expect(
      (data!.missionBoard.progress as Record<string, unknown>).not_a_mission,
    ).toBeUndefined();
  });

  it('rejects corrupt sessions', () => {
    expect(sanitizeSession(null)).toBeNull();
    expect(
      sanitizeSession({
        level: 1,
        capacity: 4,
        tubes: [[99], [1, 2]],
        history: [],
        movesLeft: 10,
        moveLimit: 10,
      }),
    ).toBeNull();
  });

  it('accepts a valid session snapshot', () => {
    const session = sanitizeSession({
      level: 2,
      capacity: 4,
      tubes: [
        [1, 1],
        [2, 2],
        [],
      ],
      history: [[[1], [2], []]],
      movesLeft: 8,
      moveLimit: 12,
    });
    expect(session).not.toBeNull();
    expect(session!.tubes).toHaveLength(3);
    expect(session!.movesLeft).toBe(8);
  });
});
