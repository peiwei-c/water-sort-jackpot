import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tube } from '../engines/WaterSortEngine';
import type { BetOption } from '../engines/JackpotEngine';
import {
  PATH_DEFAULT,
  VIAL_DEFAULT,
  VIAL_CROWN,
  ensureOwnedDefaults,
} from '../engines/StoreCatalog';

const STORAGE_KEY = 'aquasort.lab.v1';

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
};

export async function loadPersistedGame(): Promise<PersistedGame | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<PersistedGame>;
    if (!data || typeof data.unlockedLevel !== 'number') return null;
    const owned = ensureOwnedDefaults(
      data.ownedItemIds ?? [],
      data.rareSkinUnlocked,
    );
    const equippedPathId = data.equippedPathId ?? PATH_DEFAULT;
    const equippedVialId = data.equippedVialId ?? VIAL_DEFAULT;
    return {
      unlockedLevel: data.unlockedLevel,
      highestCompleted: data.highestCompleted ?? 0,
      coins: data.coins ?? 50,
      undoItems: data.undoItems ?? 2,
      extraTubeItems: data.extraTubeItems ?? 1,
      freeSpins: data.freeSpins ?? 0,
      rareSkinUnlocked: owned.includes(VIAL_CROWN),
      betPerLine: (data.betPerLine ?? 5) as BetOption,
      activeLines: data.activeLines ?? 5,
      session: data.session ?? null,
      ownedItemIds: owned,
      equippedPathId: owned.includes(equippedPathId)
        ? equippedPathId
        : PATH_DEFAULT,
      equippedVialId: owned.includes(equippedVialId)
        ? equippedVialId
        : VIAL_DEFAULT,
    };
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
