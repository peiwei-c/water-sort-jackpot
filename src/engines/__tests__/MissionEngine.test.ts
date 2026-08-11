import {
  ALL_MISSIONS,
  COINS_PER_OVERFLOW_LIFE,
  claimMission,
  countClaimableMissions,
  createMissionBoard,
  formatRewardLabel,
  listMissionViews,
  localDayKey,
  localWeekKey,
  recordMissionEvent,
  refreshMissionBoard,
  sanitizeMissionBoard,
} from '../MissionEngine';
import { createFullLives, grantLife, MAX_LIVES } from '../LivesEngine';

describe('MissionEngine', () => {
  const t0 = Date.parse('2026-08-11T12:00:00');

  it('creates a full board for the local day/week', () => {
    const board = createMissionBoard(t0);
    expect(board.dailyKey).toBe(localDayKey(t0));
    expect(board.weeklyKey).toBe(localWeekKey(t0));
    expect(Object.keys(board.progress)).toHaveLength(ALL_MISSIONS.length);
  });

  it('advances matching missions and caps at target', () => {
    let board = createMissionBoard(t0);
    board = recordMissionEvent(board, 'station_clear', 2, t0);
    const daily = board.progress.daily_clear_3;
    expect(daily.progress).toBe(2);
    board = recordMissionEvent(board, 'station_clear', 10, t0);
    expect(board.progress.daily_clear_3.progress).toBe(3);
    expect(board.progress.daily_clear_5.progress).toBe(5);
    expect(board.progress.weekly_clear_20.progress).toBe(12);
  });

  it('tracks first clears separately from any clears', () => {
    let board = createMissionBoard(t0);
    board = recordMissionEvent(board, 'station_clear', 1, t0);
    board = recordMissionEvent(board, 'first_clear', 1, t0);
    expect(board.progress.daily_clear_3.progress).toBe(1);
    expect(board.progress.daily_first_2.progress).toBe(1);
  });

  it('claims once and returns the reward', () => {
    let board = createMissionBoard(t0);
    board = recordMissionEvent(board, 'rewarded_ad', 1, t0);
    const claimed = claimMission(board, 'daily_ad_1', t0);
    expect(claimed).not.toBeNull();
    expect(claimed!.reward.coins).toBe(15);
    expect(claimed!.board.progress.daily_ad_1.claimed).toBe(true);
    expect(claimMission(claimed!.board, 'daily_ad_1', t0)).toBeNull();
  });

  it('resets daily missions on a new day but keeps weekly progress', () => {
    let board = createMissionBoard(t0);
    board = recordMissionEvent(board, 'station_clear', 4, t0);
    expect(board.progress.daily_clear_3.progress).toBe(3);
    expect(board.progress.weekly_clear_20.progress).toBe(4);

    const nextDay = Date.parse('2026-08-12T09:00:00');
    board = refreshMissionBoard(board, nextDay);
    expect(board.dailyKey).toBe(localDayKey(nextDay));
    expect(board.progress.daily_clear_3.progress).toBe(0);
    expect(board.progress.weekly_clear_20.progress).toBe(4);
  });

  it('lists claimable missions for UI badges', () => {
    let board = createMissionBoard(t0);
    board = recordMissionEvent(board, 'rewarded_ad', 1, t0);
    const views = listMissionViews(board);
    const ad = views.find((m) => m.id === 'daily_ad_1');
    expect(ad?.claimable).toBe(true);
    expect(countClaimableMissions(board)).toBe(1);
    expect(formatRewardLabel({ coins: 15 })).toBe('+15 coins');
  });

  it('sanitizes corrupt boards into a usable state', () => {
    const board = sanitizeMissionBoard(
      {
        dailyKey: '2026-08-11',
        weeklyKey: 'nope',
        progress: {
          daily_clear_3: { progress: 99, claimed: true },
          ghost: { progress: 1, claimed: false },
        },
      },
      t0,
    );
    expect(board.progress.daily_clear_3.progress).toBe(3);
    expect(board.progress.daily_clear_3.claimed).toBe(true);
    expect(board.progress.ghost).toBeUndefined();
    expect(board.progress.daily_ad_1).toEqual({ progress: 0, claimed: false });
  });

  it('documents overflow life → coin conversion rate', () => {
    const full = createFullLives();
    const granted = grantLife(full, 1, t0);
    expect(granted.lives).toBe(MAX_LIVES);
    expect(COINS_PER_OVERFLOW_LIFE).toBe(15);
  });
});
