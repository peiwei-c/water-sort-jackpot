/**
 * Daily / weekly shop missions — pure progress + claim math.
 * No UI or ad code.
 */

export type MissionCadence = 'daily' | 'weekly';

export type MissionMetric =
  | 'station_clear'
  | 'first_clear'
  | 'centrifuge_spin'
  | 'rewarded_ad';

export type MissionReward = {
  coins?: number;
  lives?: number;
  undoItems?: number;
  extraTubeItems?: number;
  freeSpins?: number;
};

export type MissionDef = {
  id: string;
  cadence: MissionCadence;
  title: string;
  blurb: string;
  metric: MissionMetric;
  target: number;
  reward: MissionReward;
};

export type MissionProgress = {
  progress: number;
  claimed: boolean;
};

export type MissionBoardState = {
  /** Local calendar day key YYYY-MM-DD */
  dailyKey: string;
  /** Local ISO-like week key YYYY-Www */
  weeklyKey: string;
  progress: Record<string, MissionProgress>;
};

export type MissionView = MissionDef & {
  progress: number;
  claimed: boolean;
  complete: boolean;
  claimable: boolean;
};

/** Coins granted when a life reward can't fit under the live cap. */
export const COINS_PER_OVERFLOW_LIFE = 15;

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: 'daily_clear_3',
    cadence: 'daily',
    title: 'Sort 3 tickets',
    blurb: 'Clear any 3 tickets today.',
    metric: 'station_clear',
    target: 3,
    reward: { coins: 20 },
  },
  {
    id: 'daily_clear_5',
    cadence: 'daily',
    title: 'Rush hour',
    blurb: 'Clear 5 tickets for an extra life.',
    metric: 'station_clear',
    target: 5,
    reward: { lives: 1, coins: 10 },
  },
  {
    id: 'daily_first_2',
    cadence: 'daily',
    title: 'New drinks',
    blurb: 'First-clear 2 brand-new tickets.',
    metric: 'first_clear',
    target: 2,
    reward: { coins: 25, undoItems: 1 },
  },
  {
    id: 'daily_spin_3',
    cadence: 'daily',
    title: 'Lucky spin',
    blurb: 'Run Lucky 3 times.',
    metric: 'centrifuge_spin',
    target: 3,
    reward: { freeSpins: 2, extraTubeItems: 1 },
  },
  {
    id: 'daily_ad_1',
    cadence: 'daily',
    title: 'Watch a clip',
    blurb: 'Watch 1 rewarded ad (hint, life, moves, etc.).',
    metric: 'rewarded_ad',
    target: 1,
    reward: { coins: 15 },
  },
];

export const WEEKLY_MISSIONS: MissionDef[] = [
  {
    id: 'weekly_clear_20',
    cadence: 'weekly',
    title: 'Week on shift',
    blurb: 'Clear 20 tickets this week.',
    metric: 'station_clear',
    target: 20,
    reward: { coins: 80, lives: 1 },
  },
  {
    id: 'weekly_first_10',
    cadence: 'weekly',
    title: 'New recipes',
    blurb: 'First-clear 10 new tickets this week.',
    metric: 'first_clear',
    target: 10,
    reward: { lives: 2, coins: 40, undoItems: 2 },
  },
  {
    id: 'weekly_spin_15',
    cadence: 'weekly',
    title: 'Lucky marathon',
    blurb: 'Spin 15 times this week.',
    metric: 'centrifuge_spin',
    target: 15,
    reward: { freeSpins: 5, extraTubeItems: 2, coins: 30 },
  },
];

export const ALL_MISSIONS: MissionDef[] = [
  ...DAILY_MISSIONS,
  ...WEEKLY_MISSIONS,
];

const MISSION_BY_ID = new Map(ALL_MISSIONS.map((m) => [m.id, m]));

export function getMissionDef(id: string): MissionDef | undefined {
  return MISSION_BY_ID.get(id);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar day key (device timezone). */
export function localDayKey(now: number = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Local week key: year + ISO week number (Mon-start).
 * Enough for weekly mission resets.
 */
export function localWeekKey(now: number = Date.now()): string {
  const d = new Date(now);
  // Shift to Thursday to stabilize ISO week year
  const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (tmp.getDay() + 6) % 7; // Mon=0 … Sun=6
  tmp.setDate(tmp.getDate() - day + 3);
  const weekYear = tmp.getFullYear();
  const week1 = new Date(weekYear, 0, 4);
  const week1Day = (week1.getDay() + 6) % 7;
  week1.setDate(week1.getDate() - week1Day);
  const week = 1 + Math.round((tmp.getTime() - week1.getTime()) / 604800000);
  return `${weekYear}-W${pad2(week)}`;
}

function emptyProgress(): MissionProgress {
  return { progress: 0, claimed: false };
}

function seedProgress(
  previous: Record<string, MissionProgress> | undefined,
  keepCadence: MissionCadence | null,
): Record<string, MissionProgress> {
  const out: Record<string, MissionProgress> = {};
  for (const mission of ALL_MISSIONS) {
    if (keepCadence && mission.cadence === keepCadence && previous?.[mission.id]) {
      const prev = previous[mission.id];
      out[mission.id] = {
        progress: Math.max(0, Math.floor(prev.progress)),
        claimed: prev.claimed === true,
      };
    } else if (!keepCadence && previous?.[mission.id]) {
      const prev = previous[mission.id];
      out[mission.id] = {
        progress: Math.max(0, Math.floor(prev.progress)),
        claimed: prev.claimed === true,
      };
    } else {
      out[mission.id] = emptyProgress();
    }
  }
  return out;
}

export function createMissionBoard(now: number = Date.now()): MissionBoardState {
  return {
    dailyKey: localDayKey(now),
    weeklyKey: localWeekKey(now),
    progress: seedProgress(undefined, null),
  };
}

/**
 * Roll daily/weekly slots when the calendar keys change.
 * Daily reset clears daily missions; weekly reset clears weekly ones.
 */
export function refreshMissionBoard(
  state: MissionBoardState,
  now: number = Date.now(),
): MissionBoardState {
  const day = localDayKey(now);
  const week = localWeekKey(now);
  const dayChanged = state.dailyKey !== day;
  const weekChanged = state.weeklyKey !== week;
  if (!dayChanged && !weekChanged) {
    return ensureMissionIds(state);
  }

  let progress = ensureMissionIds(state).progress;
  if (dayChanged) {
    progress = {
      ...progress,
      ...Object.fromEntries(DAILY_MISSIONS.map((m) => [m.id, emptyProgress()])),
    };
  }
  if (weekChanged) {
    progress = {
      ...progress,
      ...Object.fromEntries(WEEKLY_MISSIONS.map((m) => [m.id, emptyProgress()])),
    };
  }
  return { dailyKey: day, weeklyKey: week, progress };
}

function ensureMissionIds(state: MissionBoardState): MissionBoardState {
  const progress = { ...state.progress };
  let changed = false;
  for (const mission of ALL_MISSIONS) {
    if (!progress[mission.id]) {
      progress[mission.id] = emptyProgress();
      changed = true;
    }
  }
  return changed
    ? { ...state, progress }
    : state;
}

export function recordMissionEvent(
  state: MissionBoardState,
  metric: MissionMetric,
  amount: number = 1,
  now: number = Date.now(),
): MissionBoardState {
  const board = refreshMissionBoard(state, now);
  const add = Math.max(0, Math.floor(amount));
  if (add <= 0) return board;

  const progress = { ...board.progress };
  let changed = false;
  for (const mission of ALL_MISSIONS) {
    if (mission.metric !== metric) continue;
    const slot = progress[mission.id] ?? emptyProgress();
    if (slot.claimed) continue;
    const next = Math.min(mission.target, slot.progress + add);
    if (next !== slot.progress) {
      progress[mission.id] = { ...slot, progress: next };
      changed = true;
    }
  }
  return changed ? { ...board, progress } : board;
}

export function claimMission(
  state: MissionBoardState,
  missionId: string,
  now: number = Date.now(),
): { board: MissionBoardState; reward: MissionReward } | null {
  const board = refreshMissionBoard(state, now);
  const def = getMissionDef(missionId);
  if (!def) return null;
  const slot = board.progress[missionId] ?? emptyProgress();
  if (slot.claimed || slot.progress < def.target) return null;

  return {
    board: {
      ...board,
      progress: {
        ...board.progress,
        [missionId]: { ...slot, claimed: true },
      },
    },
    reward: { ...def.reward },
  };
}

export function listMissionViews(state: MissionBoardState): MissionView[] {
  const board = ensureMissionIds(state);
  return ALL_MISSIONS.map((def) => {
    const slot = board.progress[def.id] ?? emptyProgress();
    const complete = slot.progress >= def.target;
    return {
      ...def,
      progress: Math.min(def.target, slot.progress),
      claimed: slot.claimed,
      complete,
      claimable: complete && !slot.claimed,
    };
  });
}

export function countClaimableMissions(state: MissionBoardState): number {
  return listMissionViews(state).filter((m) => m.claimable).length;
}

export function formatRewardLabel(reward: MissionReward): string {
  const parts: string[] = [];
  if (reward.lives) parts.push(`+${reward.lives} life${reward.lives === 1 ? '' : 's'}`);
  if (reward.coins) parts.push(`+${reward.coins} coins`);
  if (reward.undoItems) {
    parts.push(`+${reward.undoItems} undo`);
  }
  if (reward.extraTubeItems) {
    parts.push(`+${reward.extraTubeItems} cup${reward.extraTubeItems === 1 ? '' : 's'}`);
  }
  if (reward.freeSpins) {
    parts.push(`+${reward.freeSpins} free spin${reward.freeSpins === 1 ? '' : 's'}`);
  }
  return parts.join(' · ') || 'Reward';
}

/** Sanitize persisted board; drops unknown ids and clamps fields. */
export function sanitizeMissionBoard(
  raw: unknown,
  now: number = Date.now(),
): MissionBoardState {
  if (!raw || typeof raw !== 'object') {
    return createMissionBoard(now);
  }
  const data = raw as Partial<MissionBoardState>;
  const progress: Record<string, MissionProgress> = {};
  if (data.progress && typeof data.progress === 'object') {
    for (const mission of ALL_MISSIONS) {
      const slot = (data.progress as Record<string, Partial<MissionProgress>>)[
        mission.id
      ];
      if (!slot || typeof slot !== 'object') {
        progress[mission.id] = emptyProgress();
        continue;
      }
      const p =
        typeof slot.progress === 'number' && Number.isFinite(slot.progress)
          ? Math.max(0, Math.min(mission.target, Math.floor(slot.progress)))
          : 0;
      progress[mission.id] = {
        progress: p,
        claimed: slot.claimed === true,
      };
    }
  } else {
    for (const mission of ALL_MISSIONS) {
      progress[mission.id] = emptyProgress();
    }
  }

  const board: MissionBoardState = {
    dailyKey:
      typeof data.dailyKey === 'string' && data.dailyKey.length >= 8
        ? data.dailyKey
        : localDayKey(now),
    weeklyKey:
      typeof data.weeklyKey === 'string' && data.weeklyKey.length >= 6
        ? data.weeklyKey
        : localWeekKey(now),
    progress,
  };
  return refreshMissionBoard(board, now);
}
