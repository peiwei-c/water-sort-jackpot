import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tube } from '../engines/WaterSortEngine';
import type { BetOption } from '../engines/JackpotEngine';
import { BET_OPTIONS, clampBet } from '../engines/JackpotEngine';
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
  /** Epoch ms of last forced interstitial (cooldown across sessions). */
  lastInterstitialAt: number | null;
  /** First-run Lab Manual has been shown. */
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
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= MAX_COLOR_ID;
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

  return {
    level,
    tubes,
    capacity,
    history,
    movesLeft,
    moveLimit,
  };
}

export function sanitizePersistedGame(
  data: Partial<PersistedGame>,
): PersistedGame | null {
  if (!data || typeof data.unlockedLevel !== 'number') return null;

  const unlockedLevel = clampInt(data.unlockedLevel, 1, 1, MAX_LEVEL);
  const highestCompleted = clampInt(
    data.highestCompleted,
    0,
    0,
    MAX_LEVEL,
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

  const now = Date.now();
  let lastInterstitialAt: number | null = null;
  if (typeof data.lastInterstitialAt === 'number' && Number.isFinite(data.lastInterstitialAt)) {
    lastInterstitialAt = Math.min(Math.max(0, Math.floor(data.lastInterstitialAt)), now);
  }

  const betRaw = data.betPerLine;
  const betPerLine =
    typeof betRaw === 'number' && (BET_OPTIONS as readonly number[]).includes(betRaw)
      ? (betRaw as BetOption)
      : clampBet(typeof betRaw === 'number' ? betRaw : 5);

  return {
    unlockedLevel,
    highestCompleted: Math.min(highestCompleted, unlockedLevel),
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
    lastInterstitialAt,
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
