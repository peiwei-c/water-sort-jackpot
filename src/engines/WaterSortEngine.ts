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
/** Cap undo history (matches persistence MAX_HISTORY). */
export const MAX_UNDO_HISTORY = 200;

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

  // Any non-empty source may pour into any tube that still has space
  // (including onto a different top color).
  return true;
}

export type HintMove = { fromIndex: number; toIndex: number };

/** First useful pour: matching tops, then empty targets, then any with space. */
export function findHint(
  tubes: Tube[],
  capacity: number = DEFAULT_CAPACITY,
): HintMove | null {
  const n = tubes.length;
  const passes: Array<(from: number, to: number) => boolean> = [
    (from, to) =>
      !isTubeEmpty(tubes[to]) &&
      getTopColor(tubes[to]) === getTopColor(tubes[from]),
    (from, to) => isTubeEmpty(tubes[to]),
    () => true,
  ];
  for (const prefer of passes) {
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (!canPour(tubes, from, to, capacity)) continue;
        if (!prefer(from, to)) continue;
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
 * Transfers contiguous top-color segments into the target, limited by
 * remaining capacity. Target top color does not need to match.
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
 * Generates a solvable shuffled level.
 * Free-pour branching makes full BFS filters too expensive, so hard boards
 * prefer reverse-scrambling from a solved state (always solvable by undo).
 * Easy boards still try a few shuffle openings with a cheap solvability budget.
 */
export function generateLevel(config: LevelConfig): WaterSortState {
  const capacity = config.capacity ?? DEFAULT_CAPACITY;
  const strictness = config.scrambleStrictness ?? 0;
  const rng = mulberry32(config.seed ?? Date.now());
  const colorCount = config.colorCount;
  const emptyTubes = config.emptyTubes;

  const segments: ColorId[] = [];
  for (let c = 1; c <= colorCount; c++) {
    for (let i = 0; i < capacity; i++) {
      segments.push(c);
    }
  }

  const maxSolvedAllowed = Math.max(
    0,
    Math.floor(colorCount * (0.34 - strictness * 0.3)),
  );
  // Free-pour state space explodes; only cheap-check small/easy shuffles.
  const useShuffle = strictness < 0.25 && colorCount <= 4;
  const attempts = useShuffle ? 12 + Math.floor(strictness * 28) : 0;
  const cheapSolveBudget = 4_000;

  let tubes: Tube[] = [];
  let accepted = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    shuffleInPlace(segments, rng);
    if (strictness > 0.35) {
      breakLongRuns(segments, capacity, rng);
    }

    tubes = [];
    let cursor = 0;
    for (let t = 0; t < colorCount; t++) {
      tubes.push(segments.slice(cursor, cursor + capacity));
      cursor += capacity;
    }
    for (let e = 0; e < emptyTubes; e++) {
      tubes.push([]);
    }

    const solvedFilled = tubes.filter(
      (t) => t.length === capacity && isTubeSolved(t, capacity),
    ).length;
    if (
      isWon(tubes, capacity) ||
      solvedFilled > maxSolvedAllowed ||
      findHint(tubes, capacity) === null
    ) {
      continue;
    }
    if (!isSolvable(tubes, capacity, cheapSolveBudget)) {
      continue;
    }
    accepted = true;
    break;
  }

  if (!accepted) {
    tubes = scrambleFromSolved(colorCount, emptyTubes, capacity, rng, {
      moves: 8 + colorCount * 4 + Math.floor(strictness * 20),
    });
  }

  // Final safety: never ship an already-won or stuck opening.
  if (isWon(tubes, capacity) || findHint(tubes, capacity) === null) {
    tubes = scrambleFromSolved(colorCount, emptyTubes, capacity, rng, {
      moves: Math.max(12, colorCount * 6),
    });
  }
  breakWonOpening(tubes, capacity);

  return { tubes, capacity };
}

/** Serialize board for visited-set (order-sensitive per tube). */
function boardKey(tubes: Tube[]): string {
  return tubes.map((t) => t.join(',')).join('|');
}

/**
 * BFS solvability check. Returns false if unsolvable or search budget exhausted
 * without a win (treat exhausted as unsolvable for generation filters).
 * Free-pour branching is large — callers should keep maxNodes modest.
 */
export function isSolvable(
  tubes: Tube[],
  capacity: number = DEFAULT_CAPACITY,
  maxNodes: number = 12_000,
): boolean {
  if (isWon(tubes, capacity)) return true;
  if (findHint(tubes, capacity) === null) return false;

  const start = cloneTubes(tubes);
  const queue: Tube[][] = [start];
  let head = 0;
  const visited = new Set<string>([boardKey(start)]);
  let nodes = 0;

  while (head < queue.length && nodes < maxNodes) {
    const cur = queue[head++];
    nodes++;
    if (isWon(cur, capacity)) return true;

    const n = cur.length;
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (!canPour(cur, from, to, capacity)) continue;
        const { tubes: next, result } = pour(cur, from, to, capacity);
        if (!result.success) continue;
        const key = boardKey(next);
        if (visited.has(key)) continue;
        visited.add(key);
        if (isWon(next, capacity)) return true;
        queue.push(next);
      }
    }
  }
  return false;
}

/**
 * Always-solvable generator: start from solved monochrome tubes, apply random
 * valid pours to scramble. Guarantees a legal opening move when possible.
 *
 * Free-pour can relocate whole monochrome tubes into empties and stay "won",
 * so we always force a one-unit break at the end.
 */
function scrambleFromSolved(
  colorCount: number,
  emptyTubes: number,
  capacity: number,
  rng: () => number,
  opts: { moves: number },
): Tube[] {
  const tubes: Tube[] = [];
  for (let c = 1; c <= colorCount; c++) {
    tubes.push(Array.from({ length: capacity }, () => c));
  }
  for (let e = 0; e < emptyTubes; e++) {
    tubes.push([]);
  }

  for (let i = 0; i < opts.moves; i++) {
    const moves: Array<[number, number]> = [];
    const n = tubes.length;
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (canPour(tubes, from, to, capacity)) moves.push([from, to]);
      }
    }
    if (moves.length === 0) break;
    const [from, to] = moves[Math.floor(rng() * moves.length)];
    const { tubes: next } = pour(tubes, from, to, capacity);
    for (let t = 0; t < n; t++) {
      tubes[t] = next[t];
    }
  }

  breakWonOpening(tubes, capacity);
  return tubes.map((t) => [...t]);
}

/** Peel one unit off a full tube into an empty so the board is not already won. */
function breakWonOpening(tubes: Tube[], capacity: number): void {
  if (!isWon(tubes, capacity)) return;
  const emptyIdx = tubes.findIndex((t) => t.length === 0);
  const fromIdx = tubes.findIndex((t) => t.length === capacity);
  if (emptyIdx < 0 || fromIdx < 0) return;
  tubes[emptyIdx].push(tubes[fromIdx].pop()!);
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

  private pushHistory(snapshot: Tube[]): void {
    this.history.push(snapshot);
    if (this.history.length > MAX_UNDO_HISTORY) {
      this.history.splice(0, this.history.length - MAX_UNDO_HISTORY);
    }
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
    this.pushHistory(cloneTubes(this.tubes));
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
    this.pushHistory(cloneTubes(this.tubes));
    this.tubes.push([]);
  }

  reset(state: WaterSortState): void {
    this.tubes = cloneTubes(state.tubes);
    this.history = [];
  }
}
