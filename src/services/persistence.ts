import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tube } from '../engines/WaterSortEngine';
import {
  BET_OPTIONS,
  clampBet,
  SLOT_SYMBOLS,
  type BetOption,
  type Payout,
  type PayoutKind,
  type LineWin,
  type PaylineId,
  type SlotSymbol,
} from '../engines/JackpotEngine';
import { MAX_LEVEL } from '../engines/LevelProgression';
import {
  PATH_DEFAULT,
  VIAL_DEFAULT,
  VIAL_CROWN,
  sanitizeOwnedItemIds,
} from '../engines/StoreCatalog';

const STORAGE_KEY = 'aquasort.lab.v1';

const MAX_COINS = 1_000_000;
const MAX_CONSUMABLE = 999;
const MAX_CAPACITY = 16;
const MAX_HISTORY = 200;
const MAX_COLOR_ID = 12;

export type PuzzleSession = {
  level: number;
  tubes: Tube[];
  capacity: number;
  history: Tube[][];
  movesLeft: number;
  moveLimit: number;
};

export type PersistedGame = {
  unlockedLevel: number;
  highestCompleted: number;
  coins: number;
  undoItems: number;
  extraTubeItems: number;
  freeSpins: number;
  /** @deprecated Prefer ownedItemIds + vial_crown */
  rareSkinUnlocked: boolean;
  betPerLine: BetOption;
  activeLines: number;
  session: PuzzleSession | null;
  ownedItemIds: string[];
  equippedPathId: string;
  equippedVialId: string;
  /** Remove Ads IAP — suppresses banner + interstitial only. */
  isNoAdsPurchased: boolean;
  levelsCompletedSinceAd: number;
  /** Unclaimed Centrifuge payout (survives brief background; flush may auto-collect). */
  pendingPayout: Payout | null;
  hasSeenLabManual: boolean;
};

function clampInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function isValidColorId(n: unknown): n is number {
  return (
    typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= MAX_COLOR_ID
  );
}

function sanitizeTube(tube: unknown, capacity: number): Tube | null {
  if (!Array.isArray(tube)) return null;
  if (tube.length > capacity) return null;
  const out: number[] = [];
  for (const cell of tube) {
    if (!isValidColorId(cell)) return null;
    out.push(cell);
  }
  return out;
}

function sanitizeTubes(raw: unknown, capacity: number): Tube[] | null {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 24) return null;
  const tubes: Tube[] = [];
  for (const t of raw) {
    const tube = sanitizeTube(t, capacity);
    if (!tube) return null;
    tubes.push(tube);
  }
  return tubes;
}

export function sanitizeSession(raw: unknown): PuzzleSession | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<PuzzleSession>;
  const level = clampInt(data.level, 0, 1, MAX_LEVEL);
  if (level < 1) return null;
  const capacity = clampInt(data.capacity, 0, 2, MAX_CAPACITY);
  if (capacity < 2) return null;
  const tubes = sanitizeTubes(data.tubes, capacity);
  if (!tubes) return null;

  let history: Tube[][] = [];
  if (Array.isArray(data.history)) {
    const capped = data.history.slice(-MAX_HISTORY);
    for (const snap of capped) {
      const h = sanitizeTubes(snap, capacity);
      if (!h || h.length !== tubes.length) {
        history = [];
        break;
      }
      history.push(h);
    }
  }

  const moveLimit = clampInt(data.moveLimit, 20, 1, 500);
  const movesLeft = clampInt(data.movesLeft, moveLimit, 0, moveLimit);

  return { level, tubes, capacity, history, movesLeft, moveLimit };
}

const SYMBOL_SET = new Set<string>(SLOT_SYMBOLS);
const PAYOUT_KINDS = new Set<PayoutKind>([
  'grand_jackpot',
  'extra_tube',
  'undo_pack',
  'triple_coin',
  'drop_min',
  'line_win',
  'consolation',
  'none',
]);

function sanitizeLineWin(raw: unknown): LineWin | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Partial<LineWin>;
  if (typeof w.lineId !== 'number' || w.lineId < 1 || w.lineId > 5) return null;
  if (typeof w.lineName !== 'string') return null;
  if (!Array.isArray(w.symbols) || w.symbols.length !== 3) return null;
  if (!w.symbols.every((s) => typeof s === 'string' && SYMBOL_SET.has(s))) {
    return null;
  }
  if (typeof w.kind !== 'string' || !PAYOUT_KINDS.has(w.kind as PayoutKind)) {
    return null;
  }
  return {
    lineId: w.lineId as PaylineId,
    lineName: w.lineName,
    symbols: w.symbols as [SlotSymbol, SlotSymbol, SlotSymbol],
    kind: w.kind as PayoutKind,
    coins: clampInt(w.coins, 0, 0, MAX_COINS),
    undoItems: clampInt(w.undoItems, 0, 0, MAX_CONSUMABLE),
    extraTubeItems: clampInt(w.extraTubeItems, 0, 0, MAX_CONSUMABLE),
    unlockRareSkin: w.unlockRareSkin === true,
    label: typeof w.label === 'string' ? w.label : 'Win',
  };
}

export function sanitizePendingPayout(raw: unknown): Payout | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Payout>;
  if (typeof p.kind !== 'string' || !PAYOUT_KINDS.has(p.kind as PayoutKind)) {
    return null;
  }
  if (p.kind === 'none') return null;
  const lineWins = Array.isArray(p.lineWins)
    ? p.lineWins.map(sanitizeLineWin).filter((w): w is LineWin => w != null)
    : [];
  return {
    kind: p.kind as PayoutKind,
    coins: clampInt(p.coins, 0, 0, MAX_COINS),
    undoItems: clampInt(p.undoItems, 0, 0, MAX_CONSUMABLE),
    extraTubeItems: clampInt(p.extraTubeItems, 0, 0, MAX_CONSUMABLE),
    unlockRareSkin: p.unlockRareSkin === true,
    label: typeof p.label === 'string' ? p.label : 'Win',
    lineWins,
    linesPlayed: clampInt(p.linesPlayed, 1, 1, 5),
    betPerLine: clampBet(typeof p.betPerLine === 'number' ? p.betPerLine : 5),
  };
}

export function sanitizePersistedGame(
  data: Partial<PersistedGame>,
): PersistedGame | null {
  if (!data || typeof data.unlockedLevel !== 'number') return null;

  const unlockedLevel = clampInt(data.unlockedLevel, 1, 1, MAX_LEVEL);
  const highestCompleted = Math.min(
    clampInt(data.highestCompleted, 0, 0, MAX_LEVEL),
    unlockedLevel,
  );
  const owned = sanitizeOwnedItemIds(
    data.ownedItemIds,
    data.rareSkinUnlocked === true,
  );
  const equippedPathId =
    typeof data.equippedPathId === 'string' && owned.includes(data.equippedPathId)
      ? data.equippedPathId
      : PATH_DEFAULT;
  const equippedVialId =
    typeof data.equippedVialId === 'string' && owned.includes(data.equippedVialId)
      ? data.equippedVialId
      : VIAL_DEFAULT;

  const betRaw = data.betPerLine;
  const betPerLine =
    typeof betRaw === 'number' &&
    (BET_OPTIONS as readonly number[]).includes(betRaw)
      ? (betRaw as BetOption)
      : clampBet(typeof betRaw === 'number' ? betRaw : 5);

  return {
    unlockedLevel,
    highestCompleted,
    coins: clampInt(data.coins, 50, 0, MAX_COINS),
    undoItems: clampInt(data.undoItems, 2, 0, MAX_CONSUMABLE),
    extraTubeItems: clampInt(data.extraTubeItems, 1, 0, MAX_CONSUMABLE),
    freeSpins: clampInt(data.freeSpins, 0, 0, MAX_CONSUMABLE),
    rareSkinUnlocked: owned.includes(VIAL_CROWN),
    betPerLine,
    activeLines: clampInt(data.activeLines, 5, 1, 5),
    session: sanitizeSession(data.session),
    ownedItemIds: owned,
    equippedPathId,
    equippedVialId,
    isNoAdsPurchased: data.isNoAdsPurchased === true,
    levelsCompletedSinceAd: clampInt(data.levelsCompletedSinceAd, 0, 0, 100),
    pendingPayout: sanitizePendingPayout(data.pendingPayout),
    hasSeenLabManual: data.hasSeenLabManual === true,
  };
}

export async function loadPersistedGame(): Promise<PersistedGame | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedGame>;
    return sanitizePersistedGame(data);
  } catch {
    return null;
  }
}

export async function savePersistedGame(data: PersistedGame): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures — game remains playable in-memory.
  }
}
