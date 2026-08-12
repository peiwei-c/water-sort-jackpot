import {
  WaterSortEngine,
  canPour,
  findHint,
  adUndoCount,
  pour,
  isWon,
  isSolvable,
  getTopColor,
  getTopContiguousCount,
  generateLevel,
  getLevelDifficulty,
  DEFAULT_CAPACITY,
  MAX_UNDO_HISTORY,
  type Tube,
} from '../WaterSortEngine';

describe('WaterSortEngine', () => {
  describe('canPour', () => {
    it('rejects pouring into a full tube', () => {
      const tubes: Tube[] = [
        [1, 1, 1, 1],
        [2],
      ];
      expect(canPour(tubes, 1, 0)).toBe(false);
    });

    it('allows mixing different colors when space remains', () => {
      const tubes: Tube[] = [
        [1, 1],
        [2, 2],
      ];
      expect(canPour(tubes, 0, 1)).toBe(true);
      expect(canPour(tubes, 1, 0)).toBe(true);
    });

    it('allows pour into empty tube', () => {
      const tubes: Tube[] = [[1, 1], []];
      expect(canPour(tubes, 0, 1)).toBe(true);
    });

    it('allows pour when top colors match and space remains', () => {
      const tubes: Tube[] = [
        [2, 1, 1],
        [1],
      ];
      expect(canPour(tubes, 0, 1)).toBe(true);
    });

    it('rejects pouring from an empty tube', () => {
      const tubes: Tube[] = [[], [1]];
      expect(canPour(tubes, 0, 1)).toBe(false);
    });

    it('rejects pouring a tube into itself', () => {
      const tubes: Tube[] = [[1, 1], []];
      expect(canPour(tubes, 0, 0)).toBe(false);
    });

    it('rejects out-of-range indices', () => {
      const tubes: Tube[] = [[1], []];
      expect(canPour(tubes, -1, 1)).toBe(false);
      expect(canPour(tubes, 0, 5)).toBe(false);
    });
  });

  describe('pour', () => {
    it('transfers all contiguous matching top segments', () => {
      const tubes: Tube[] = [
        [2, 1, 1],
        [1],
        [],
      ];
      const { tubes: next, result } = pour(tubes, 0, 1);
      expect(result.success).toBe(true);
      expect(result.amount).toBe(2);
      expect(result.color).toBe(1);
      expect(next[0]).toEqual([2]);
      expect(next[1]).toEqual([1, 1, 1]);
    });

    it('limits transfer by remaining capacity', () => {
      const tubes: Tube[] = [
        [1, 1, 1],
        [1, 1, 1],
      ];
      const { tubes: next, result } = pour(tubes, 0, 1);
      expect(result.success).toBe(true);
      expect(result.amount).toBe(1);
      expect(next[0]).toEqual([1, 1]);
      expect(next[1]).toEqual([1, 1, 1, 1]);
    });

    it('pours onto a different top color when space remains', () => {
      const tubes: Tube[] = [
        [1, 1],
        [2, 2],
      ];
      const { tubes: next, result } = pour(tubes, 0, 1);
      expect(result.success).toBe(true);
      expect(result.amount).toBe(2);
      expect(result.color).toBe(1);
      expect(next[0]).toEqual([]);
      expect(next[1]).toEqual([2, 2, 1, 1]);
    });

    it('does not mutate on illegal pour', () => {
      const tubes: Tube[] = [
        [1, 1],
        [2, 2, 2, 2],
      ];
      const { tubes: next, result } = pour(tubes, 0, 1);
      expect(result.success).toBe(false);
      expect(next).toEqual(tubes);
    });

    it('pours entire color stack into empty tube', () => {
      const tubes: Tube[] = [[3, 3, 3], []];
      const { tubes: next, result } = pour(tubes, 0, 1);
      expect(result.amount).toBe(3);
      expect(next[0]).toEqual([]);
      expect(next[1]).toEqual([3, 3, 3]);
    });
  });

  describe('helpers', () => {
    it('getTopColor returns null for empty', () => {
      expect(getTopColor([])).toBeNull();
      expect(getTopColor([1, 2])).toBe(2);
    });

    it('getTopContiguousCount counts matching tops', () => {
      expect(getTopContiguousCount([])).toBe(0);
      expect(getTopContiguousCount([1, 2, 2, 2])).toBe(3);
      expect(getTopContiguousCount([1])).toBe(1);
    });
  });

  describe('win condition', () => {
    it('wins when every tube is empty or mono-full', () => {
      const tubes: Tube[] = [
        [1, 1, 1, 1],
        [2, 2, 2, 2],
        [],
      ];
      expect(isWon(tubes, DEFAULT_CAPACITY)).toBe(true);
    });

    it('does not win with mixed or partial tubes', () => {
      expect(isWon([[1, 1, 1], []], DEFAULT_CAPACITY)).toBe(false);
      expect(isWon([[1, 2, 1, 1], []], DEFAULT_CAPACITY)).toBe(false);
    });
  });

  describe('WaterSortEngine class', () => {
    it('tracks history and supports undo', () => {
      const engine = new WaterSortEngine({
        tubes: [[1, 1], []],
        capacity: 4,
      });
      expect(engine.canUndo()).toBe(false);
      const r = engine.pour(0, 1);
      expect(r.success).toBe(true);
      expect(engine.getTubes()[0]).toEqual([]);
      expect(engine.getTubes()[1]).toEqual([1, 1]);
      expect(engine.undo()).toBe(true);
      expect(engine.getTubes()[0]).toEqual([1, 1]);
      expect(engine.getTubes()[1]).toEqual([]);
    });

    it('detects win after solving', () => {
      const engine = new WaterSortEngine({
        tubes: [
          [1, 1, 1],
          [1],
          [],
        ],
        capacity: 4,
      });
      expect(engine.isWon()).toBe(false);
      engine.pour(1, 0);
      expect(engine.isWon()).toBe(true);
    });

    it('addEmptyTube appends an empty tube', () => {
      const engine = new WaterSortEngine({
        tubes: [[1], []],
        capacity: 4,
      });
      engine.addEmptyTube();
      expect(engine.getTubes()).toHaveLength(3);
      expect(engine.getTubes()[2]).toEqual([]);
    });

    it('findHint returns a valid pour', () => {
      const tubes = [[1, 1], [], [2]];
      const hint = findHint(tubes, 4);
      expect(hint).not.toBeNull();
      expect(canPour(tubes, hint!.fromIndex, hint!.toIndex, 4)).toBe(true);
    });

    it('undoMany scales with history and adUndoCount caps at 3', () => {
      expect(adUndoCount(0)).toBe(0);
      expect(adUndoCount(1)).toBe(1);
      expect(adUndoCount(2)).toBe(2);
      expect(adUndoCount(5)).toBe(3);

      const engine = new WaterSortEngine({
        tubes: [[1], [2], [3], [], [], []],
        capacity: 4,
      });
      expect(engine.pour(0, 3).success).toBe(true);
      expect(engine.pour(1, 4).success).toBe(true);
      expect(engine.pour(2, 5).success).toBe(true);
      expect(engine.undoDepth()).toBe(3);
      expect(engine.undoMany(adUndoCount(engine.undoDepth()))).toBe(3);
      expect(engine.getTubes()).toEqual([[1], [2], [3], [], [], []]);
    });

    it('caps undo history at MAX_UNDO_HISTORY', () => {
      const engine = new WaterSortEngine({
        tubes: [[1], []],
        capacity: 4,
      });
      for (let i = 0; i < MAX_UNDO_HISTORY + 40; i++) {
        if (i % 2 === 0) engine.pour(0, 1);
        else engine.pour(1, 0);
      }
      expect(engine.undoDepth()).toBe(MAX_UNDO_HISTORY);
    });

    it('generateLevel creates colorCount + emptyTubes tubes', () => {
      const state = generateLevel({ colorCount: 3, emptyTubes: 2, seed: 1 });
      expect(state.tubes).toHaveLength(5);
      // Scramble may partially fill empties; total liquid volume stays fixed.
      const flat = state.tubes.flat();
      expect(flat).toHaveLength(3 * DEFAULT_CAPACITY);
      expect(
        state.tubes.reduce((slots, t) => slots + (DEFAULT_CAPACITY - t.length), 0),
      ).toBe(2 * DEFAULT_CAPACITY);
    });

    it('generateLevel boards that are not won have at least one pour', () => {
      for (let seed = 0; seed < 20; seed++) {
        const state = generateLevel({
          colorCount: 5,
          emptyTubes: 1,
          seed: seed * 97 + 3,
          scrambleStrictness: 0.6,
        });
        expect(isWon(state.tubes, state.capacity)).toBe(false);
        expect(findHint(state.tubes, state.capacity)).not.toBeNull();
      }
    });

    it('generateLevel hard boards open with a pour (scramble guarantee)', () => {
      for (let seed = 0; seed < 12; seed++) {
        const state = generateLevel({
          colorCount: 4,
          emptyTubes: 2,
          seed: seed * 41 + 11,
          scrambleStrictness: 0.5,
        });
        expect(isWon(state.tubes, state.capacity)).toBe(false);
        expect(findHint(state.tubes, state.capacity)).not.toBeNull();
      }
    });

    it('isSolvable detects a trivial solvable board', () => {
      const tubes: Tube[] = [
        [1, 1, 1],
        [1],
        [],
      ];
      expect(isSolvable(tubes, 4)).toBe(true);
    });

    it('isSolvable rejects a stuck board with no moves', () => {
      // Free-pour still cannot move when every tube is full.
      const tubes: Tube[] = [
        [1, 2, 1, 2],
        [2, 1, 2, 1],
      ];
      expect(findHint(tubes, 4)).toBeNull();
      expect(isSolvable(tubes, 4)).toBe(false);
    });
  });

  describe('getLevelDifficulty', () => {
    it('starts easy with 3 colors, 1 empty, and a move budget', () => {
      const d1 = getLevelDifficulty(1);
      expect(d1.colorCount).toBe(3);
      expect(d1.emptyTubes).toBe(1);
      expect(d1.moveLimit).toBeGreaterThan(15);
    });

    it('gets harder across the 3650-level campaign', () => {
      const early = getLevelDifficulty(1);
      const mid = getLevelDifficulty(1500);
      const late = getLevelDifficulty(3650);

      expect(mid.colorCount).toBeGreaterThan(early.colorCount);
      expect(late.colorCount).toBeGreaterThan(mid.colorCount);
      expect(late.colorCount).toBe(12);
      expect(late.moveLimit / late.colorCount).toBeLessThan(
        early.moveLimit / early.colorCount,
      );
    });

    it('createDefaultLevel uses the difficulty curve', () => {
      const engine = WaterSortEngine.createDefaultLevel(5);
      const diff = WaterSortEngine.difficultyFor(5);
      expect(engine.getTubes()).toHaveLength(diff.colorCount + diff.emptyTubes);
      expect(diff.moveLimit).toBeGreaterThan(0);
    });
  });
});
