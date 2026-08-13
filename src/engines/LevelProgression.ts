/**
 * Year-long campaign difficulty curve (~10 stations/day × 365 days).
 * Tutorial: +1 fluid tube (and color) every 5 levels through FAST_RAMP_END.
 * Then colors tick up slowly so level 1500 is larger than level 50.
 * Pure data + math — no UI or ad code.
 */

/** ~10 first clears per day for a full year of daily play. */
export const MAX_LEVEL = 3650;
export const LEVEL_CAPACITY = 4;

/** Board size at level 1 (fluid tubes + empties). */
export const START_TOTAL_TUBES = 5;
/** Tutorial: levels spent at each tube count before adding another fluid tube. */
export const LEVELS_PER_TUBE_STEP = 5;
/** Last level of the fast +1/5-level tutorial (6 colors / 7 tubes). */
export const FAST_RAMP_END = 15;
/** Palette / engine cap for distinct liquids. */
export const MAX_COLOR_COUNT = 12;
/** Helper empties baked into every generated board. */
export const BASE_EMPTY_TUBES = 1;
/**
 * After the tutorial, one extra color every this many levels.
 * 6 remaining steps (7→12) across the rest of the campaign.
 */
export const SLOW_LEVELS_PER_COLOR = Math.floor(
  (MAX_LEVEL - FAST_RAMP_END) / (MAX_COLOR_COUNT - 6),
);

export type DifficultyTier =
  | 'beginner'
  | 'easy'
  | 'normal'
  | 'hard'
  | 'expert'
  | 'master'
  | 'legend';

export type LevelDifficulty = {
  level: number;
  colorCount: number;
  emptyTubes: number;
  capacity: number;
  moveLimit: number;
  /** 0 = loosest shuffle filter, 1 = reject almost any pre-sorted tubes */
  scrambleStrictness: number;
  tier: DifficultyTier;
  tierLabel: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function tierFor(level: number): { tier: DifficultyTier; tierLabel: string } {
  if (level <= 100) return { tier: 'beginner', tierLabel: 'Beginner' };
  if (level <= 400) return { tier: 'easy', tierLabel: 'Easy' };
  if (level <= 900) return { tier: 'normal', tierLabel: 'Normal' };
  if (level <= 1500) return { tier: 'hard', tierLabel: 'Hard' };
  if (level <= 2200) return { tier: 'expert', tierLabel: 'Expert' };
  if (level <= 3000) return { tier: 'master', tierLabel: 'Master' };
  return { tier: 'legend', tierLabel: 'Legend' };
}

/**
 * Fluid tubes = colors.
 * 1–5: 4, 6–10: 5, 11–15: 6, then +1 every SLOW_LEVELS_PER_COLOR.
 */
function colorCountFor(level: number): number {
  if (level <= FAST_RAMP_END) {
    return clamp(
      START_TOTAL_TUBES -
        BASE_EMPTY_TUBES +
        Math.floor((level - 1) / LEVELS_PER_TUBE_STEP),
      1,
      MAX_COLOR_COUNT,
    );
  }
  const slowIndex = Math.floor((level - FAST_RAMP_END - 1) / SLOW_LEVELS_PER_COLOR);
  return clamp(7 + slowIndex, 7, MAX_COLOR_COUNT);
}

/**
 * Empty helper tubes baked into the board.
 * Always 1 so the puzzle is pourable; more empties come from inventory / ads.
 */
function emptyTubesFor(_level: number): number {
  return BASE_EMPTY_TUBES;
}

/**
 * Move budget scales with puzzle size.
 * Mild campaign squeeze only — board growth is the main difficulty lever.
 */
function moveLimitFor(
  level: number,
  colorCount: number,
  emptyTubes: number,
  capacity: number,
): number {
  const progress = (level - 1) / (MAX_LEVEL - 1); // 0 → 1
  const base = colorCount * capacity + emptyTubes * 3;
  // Small buffer so early bands feel fair; later bands stay playable
  const buffer = Math.round(8 - progress * 4);
  // Soft squeeze: 1.08x early → 0.98x at the finale (size carries the hardness)
  const squeeze = 1.08 - progress * 0.1;
  return Math.max(colorCount * 4 + 4, Math.round((base + buffer) * squeeze));
}

/**
 * How aggressively we reject semi-solved generated boards.
 * Board size (stage) plus campaign progress, so same-size bands still tighten.
 */
function scrambleStrictnessFor(level: number): number {
  if (level >= MAX_LEVEL) return 1;
  const colors = colorCountFor(level);
  const colorSpan = Math.max(1, MAX_COLOR_COUNT - (START_TOTAL_TUBES - 1));
  const stage = (colors - (START_TOTAL_TUBES - 1)) / colorSpan; // 0 → 1
  const campaign = (level - 1) / (MAX_LEVEL - 1);
  return clamp(stage * 0.4 + campaign * 0.6, 0, 1);
}

/**
 * Full difficulty snapshot for a campaign level (clamped to 1…MAX_LEVEL).
 */
export function getLevelDifficulty(level: number): LevelDifficulty {
  const safeLevel = clamp(Math.floor(level), 1, MAX_LEVEL);
  const capacity = LEVEL_CAPACITY;
  const colorCount = colorCountFor(safeLevel);
  const emptyTubes = emptyTubesFor(safeLevel);
  const moveLimit = moveLimitFor(safeLevel, colorCount, emptyTubes, capacity);
  const scrambleStrictness = scrambleStrictnessFor(safeLevel);
  const { tier, tierLabel } = tierFor(safeLevel);

  return {
    level: safeLevel,
    colorCount,
    emptyTubes,
    capacity,
    moveLimit,
    scrambleStrictness,
    tier,
    tierLabel,
  };
}

/** True when the player has cleared the final campaign level. */
export function isCampaignComplete(completedLevel: number): boolean {
  return completedLevel >= MAX_LEVEL;
}

/**
 * Sample milestones for docs / tests — verifies the tube/color ramp.
 */
export function sampleDifficultyCurve(
  steps: number[] = [1, 5, 15, 50, 1500, 3041, 3650],
): LevelDifficulty[] {
  return steps.map(getLevelDifficulty);
}
