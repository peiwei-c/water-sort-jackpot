import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Tube } from '../engines/WaterSortEngine';
import type { BetOption } from '../engines/JackpotEngine';

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
  rareSkinUnlocked: boolean;
  betPerLine: BetOption;
  activeLines: number;
  /** In-progress puzzle the player can resume. */
  session: PuzzleSession | null;
};

export async function loadPersistedGame(): Promise<PersistedGame | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedGame;
    if (!data || typeof data.unlockedLevel !== 'number') return null;
    return data;
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
