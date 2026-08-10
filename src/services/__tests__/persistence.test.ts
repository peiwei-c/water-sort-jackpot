import {
  sanitizePersistedGame,
  sanitizeSession,
} from '../persistence';
import { PATH_DEFAULT, VIAL_DEFAULT } from '../../engines/StoreCatalog';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

describe('persistence sanitization', () => {
  it('clamps economy fields and filters owned ids', () => {
    const data = sanitizePersistedGame({
      unlockedLevel: 9999,
      highestCompleted: -3,
      coins: 50_000_000,
      undoItems: -1,
      ownedItemIds: [PATH_DEFAULT, 'not_real', VIAL_DEFAULT],
      isNoAdsPurchased: true,
      lastInterstitialAt: Date.now() + 86_400_000,
      hasSeenLabManual: true,
    });
    expect(data).not.toBeNull();
    expect(data!.unlockedLevel).toBe(300);
    expect(data!.highestCompleted).toBe(0);
    expect(data!.coins).toBe(1_000_000);
    expect(data!.undoItems).toBe(0);
    expect(data!.ownedItemIds).not.toContain('not_real');
    expect(data!.ownedItemIds).toEqual(
      expect.arrayContaining([PATH_DEFAULT, VIAL_DEFAULT]),
    );
    expect(data!.isNoAdsPurchased).toBe(true);
    expect(data!.lastInterstitialAt).toBeLessThanOrEqual(Date.now());
    expect(data!.hasSeenLabManual).toBe(true);
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
