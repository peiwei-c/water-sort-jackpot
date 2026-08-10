/**
 * Pure water-sort puzzle engine.
 * No UI, no ads — only tube state, pour rules, history, and win checks.
 */

import {
  getLevelDifficulty,
  MAX_LEVEL,
  isCampaignComplete,
  type LevelDifficulty,
} from './LevelProgression';

export { getLevelDifficulty, MAX_LEVEL, isCampaignComplete };
export type { LevelDifficulty };

export type ColorId = number;

/** Tube contents bottom → top. Empty tube = []. */
export type Tube = ColorId[];

export type WaterSortState = {
  tubes: Tube[];
  capacity: number;
};

export type PourResult = {
  success: boolean;
  amount: number;
  color: ColorId | null;
};

export const DEFAULT_CAPACITY = 4;

function cloneTubes(tubes: Tube[]): Tube[] {
  return tubes.map((t) => [...t]);
}

export function getTopColor(tube: Tube): ColorId | null {
  if (tube.length === 0) return null;
  return tube[tube.length - 1];
}

/** Count of contiguous segments matching the top color. */
export function getTopContiguousCount(tube: Tube): number {
  if (tube.length === 0) return 0;
  const top = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] !== top) break;
    count++;
  }
  return count;
}

export function isTubeFull(tube: Tube, capacity: number): boolean {
  return tube.length >= capacity;
}

export function isTubeEmpty(tube: Tube): boolean {
  return tube.length === 0;
}

/** Tube is solved if empty OR filled with a single color. */
export function isTubeSolved(tube: Tube, capacity: number): boolean {
  if (tube.length === 0) return true;
  if (tube.length !== capacity) return false;
  const color = tube[0];
  return tube.every((c) => c === color);
}

export function isWon(tubes: Tube[], capacity: number): boolean {
  return tubes.every((t) => isTubeSolved(t, capacity));
}

export function canPour(
  tubes: Tube[],
  fromIndex: number,
  toIndex: number,
  capacity: number = DEFAULT_CAPACITY,
): boolean {
  if (fromIndex === toIndex) return false;
  if (fromIndex < 0 || toIndex < 0) return false;
  if (fromIndex >= tubes.length || toIndex >= tubes.length) return false;

  const from = tubes[fromIndex];
  const to = tubes[toIndex];

  if (isTubeEmpty(from)) return false;
  if (isTubeFull(to, capacity)) return false;

  const fromTop = getTopColor(from);
  if (fromTop === null) return false;

  if (isTubeEmpty(to)) return true;

  const toTop = getTopColor(to);
  return toTop === fromTop;
}

export type HintMove = { fromIndex: number; toIndex: number };

/** First valid pour (prefer non-empty targets, then empty). */
export function findHint(
  tubes: Tube[],
  capacity: number = DEFAULT_CAPACITY,
): HintMove | null {
  const n = tubes.length;
  // Prefer pouring onto matching color (non-empty) before empties.
  for (let pass = 0; pass < 2; pass++) {
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (!canPour(tubes, from, to, capacity)) continue;
        const toEmpty = isTubeEmpty(tubes[to]);
        if (pass === 0 && toEmpty) continue;
        if (pass === 1 && !toEmpty) continue;
        return { fromIndex: from, toIndex: to };
      }
    }
  }
  return null;
}

/** Scale ad undo depth: 1–3 based on available history. */
export function adUndoCount(historyLength: number): number {
  if (historyLength <= 0) return 0;
  return Math.min(3, historyLength);
}

/**
 * Transfers all contiguous matching top color segments into the target,
 * limited by remaining capacity.
 */
export function pour(
  tubes: Tube[],
  fromIndex: number,
  toIndex: number,
  capacity: number = DEFAULT_CAPACITY,
): { tubes: Tube[]; result: PourResult } {
  if (!canPour(tubes, fromIndex, toIndex, capacity)) {
    return {
      tubes: cloneTubes(tubes),
      result: { success: false, amount: 0, color: null },
    };
  }

  const next = cloneTubes(tubes);
  const from = next[fromIndex];
  const to = next[toIndex];
  const color = getTopColor(from)!;
  const contiguous = getTopContiguousCount(from);
  const space = capacity - to.length;
  const amount = Math.min(contiguous, space);

  for (let i = 0; i < amount; i++) {
    from.pop();
    to.push(color);
  }

  return {
    tubes: next,
    result: { success: true, amount, color },
  };
}

export type LevelConfig = {
  colorCount: number;
  emptyTubes: number;
  capacity?: number;
  /** Optional seed for deterministic generation. */
  seed?: number;
  /**
   * 0–1 how hard we reject boards that are already partly sorted.
   * Higher = more scrambled / harder opening positions.
   */
  scrambleStrictness?: number;
};

/** Simple seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Generates a solvable-looking shuffled level.
 * Creates `colorCount` full monochrome tubes, shuffles segments into
 * `colorCount` tubes, then appends `emptyTubes` empty tubes.
 * Re-shuffles if the board is already won or too pre-sorted for the
 * requested scrambleStrictness.
 */
export function generateLevel(config: LevelConfig): WaterSortState {
  const capacity = config.capacity ?? DEFAULT_CAPACITY;
  const strictness = config.scrambleStrictness ?? 0;
  const rng = mulberry32(config.seed ?? Date.now());

  const segments: ColorId[] = [];
  for (let c = 1; c <= config.colorCount; c++) {
    for (let i = 0; i < capacity; i++) {
      segments.push(c);
    }
  }

  // Allow fewer pre-solved tubes as strictness rises (floor at 0)
  const maxSolvedAllowed = Math.max(
    0,
    Math.floor(config.colorCount * (0.34 - strictness * 0.3)),
  );
  const attempts = 12 + Math.floor(strictness * 28);

  let tubes: Tube[] = [];
  for (let attempt = 0; attempt < attempts; attempt++) {
    shuffleInPlace(segments, rng);
    // Extra pass on hard levels: break up long same-color runs
    if (strictness > 0.35) {
      breakLongRuns(segments, capacity, rng);
    }

    tubes = [];
    let cursor = 0;
    for (let t = 0; t < config.colorCount; t++) {
      tubes.push(segments.slice(cursor, cursor + capacity));
      cursor += capacity;
    }
    for (let e = 0; e < config.emptyTubes; e++) {
      tubes.push([]);
    }

    const solvedFilled = tubes.filter(
      (t) => t.length === capacity && isTubeSolved(t, capacity),
    ).length;
    if (!isWon(tubes, capacity) && solvedFilled <= maxSolvedAllowed) {
      break;
    }
  }

  return { tubes, capacity };
}

/** Swap neighbors to reduce contiguous same-color streaks. */
function breakLongRuns(
  segments: ColorId[],
  capacity: number,
  rng: () => number,
): void {
  for (let i = 0; i < segments.length - 1; i++) {
    let run = 1;
    while (
      i + run < segments.length &&
      segments[i + run] === segments[i] &&
      run < capacity
    ) {
      run++;
    }
    if (run >= 3) {
      const j = Math.min(
        segments.length - 1,
        i + run + Math.floor(rng() * 3),
      );
      if (segments[j] !== segments[i]) {
        [segments[i + 1], segments[j]] = [segments[j], segments[i + 1]];
      }
    }
  }
}

export class WaterSortEngine {
  private tubes: Tube[];
  readonly capacity: number;
  private history: Tube[][] = [];

  constructor(initial: WaterSortState) {
    this.tubes = cloneTubes(initial.tubes);
    this.capacity = initial.capacity;
  }

  static createDefaultLevel(level: number = 1): WaterSortEngine {
    const diff = getLevelDifficulty(level);
    const state = generateLevel({
      colorCount: diff.colorCount,
      emptyTubes: diff.emptyTubes,
      capacity: diff.capacity,
      scrambleStrictness: diff.scrambleStrictness,
      seed: level * 9973 + 42,
    });
    return new WaterSortEngine(state);
  }

  static difficultyFor(level: number): LevelDifficulty {
    return getLevelDifficulty(level);
  }

  getTubes(): Tube[] {
    return cloneTubes(this.tubes);
  }

  getState(): WaterSortState {
    return { tubes: this.getTubes(), capacity: this.capacity };
  }

  /** Tubes + undo history for save / continue. */
  getSnapshot(): { tubes: Tube[]; capacity: number; history: Tube[][] } {
    return {
      tubes: this.getTubes(),
      capacity: this.capacity,
      history: this.history.map((h) => cloneTubes(h)),
    };
  }

  static fromSnapshot(snapshot: {
    tubes: Tube[];
    capacity: number;
    history?: Tube[][];
  }): WaterSortEngine {
    const engine = new WaterSortEngine({
      tubes: snapshot.tubes,
      capacity: snapshot.capacity,
    });
    engine.history = (snapshot.history ?? []).map((h) => cloneTubes(h));
    return engine;
  }

  canPour(fromIndex: number, toIndex: number): boolean {
    return canPour(this.tubes, fromIndex, toIndex, this.capacity);
  }

  pour(fromIndex: number, toIndex: number): PourResult {
    if (!this.canPour(fromIndex, toIndex)) {
      return { success: false, amount: 0, color: null };
    }
    this.history.push(cloneTubes(this.tubes));
    const { tubes, result } = pour(this.tubes, fromIndex, toIndex, this.capacity);
    this.tubes = tubes;
    return result;
  }

  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.tubes = prev;
    return true;
  }

  /** Undo up to `count` pours (clamped to history). Returns how many were undone. */
  undoMany(count: number): number {
    const n = Math.max(0, Math.min(count, this.history.length));
    for (let i = 0; i < n; i++) {
      this.undo();
    }
    return n;
  }

  undoDepth(): number {
    return this.history.length;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  findHint(): HintMove | null {
    return findHint(this.tubes, this.capacity);
  }

  isWon(): boolean {
    return isWon(this.tubes, this.capacity);
  }

  /** Insert an extra empty tube (consumable / ad reward). */
  addEmptyTube(): void {
    this.history.push(cloneTubes(this.tubes));
    this.tubes.push([]);
  }

  reset(state: WaterSortState): void {
    this.tubes = cloneTubes(state.tubes);
    this.history = [];
  }
}
