/**
 * 3650-level campaign difficulty curve.
 * Beginner/Easy last 50 tickets each; Normal/Hard/Expert last 100 per color.
 * After the 12-color cap, difficulty continues via move-budget squeeze
 * and scramble complexity. Pure data + math — no UI or ad code.
 */

export const MAX_LEVEL = 3650;
export const LEVEL_CAPACITY = 4;

/** Board size at level 1 (fluid tubes + empties). */
export const START_TOTAL_TUBES = 5;
/** Colors at level 1 (4 colors + 1 empty = 5 tubes). */
export const START_COLOR_COUNT = 4;
/** Last ticket of the first (Beginner) band. */
export const EASY_ONBOARDING_END_LEVEL = 50;
/** Levels spent at Beginner and Easy colors. */
export const LEVELS_PER_TUBE_STEP = 50;
/** Levels spent at each Normal, Hard, and Expert color. */
export const MID_TIER_LEVELS_PER_COLOR = 100;
/** Palette / engine cap for distinct liquids. */
export const MAX_COLOR_COUNT = 12;
/** Helper empties baked into every generated board. */
export const BASE_EMPTY_TUBES = 1;

/**
 * Dwell at each color from START_COLOR_COUNT through MAX_COLOR_COUNT - 1.
 * Index 0 = 4 colors (Beginner), last index = 11 colors (Expert).
 */
export const LEVELS_AT_COLOR: readonly number[] = [
  LEVELS_PER_TUBE_STEP, // 4 — Beginner
  LEVELS_PER_TUBE_STEP, // 5 — Easy
  MID_TIER_LEVELS_PER_COLOR, // 6 — Normal
  MID_TIER_LEVELS_PER_COLOR, // 7 — Normal
  MID_TIER_LEVELS_PER_COLOR, // 8 — Hard
  MID_TIER_LEVELS_PER_COLOR, // 9 — Hard
  MID_TIER_LEVELS_PER_COLOR, // 10 — Expert
  MID_TIER_LEVELS_PER_COLOR, // 11 — Expert
];

/** First level that uses the 12-color cap. */
export const COLOR_RAMP_END_LEVEL =
  LEVELS_AT_COLOR.reduce((sum, n) => sum + n, 0) + 1;

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

function tierFor(
  level: number,
  colorCount: number,
): { tier: DifficultyTier; tierLabel: string } {
  if (colorCount <= 4) return { tier: 'beginner', tierLabel: 'Beginner' };
  if (colorCount <= 5) return { tier: 'easy', tierLabel: 'Easy' };
  if (colorCount <= 7) return { tier: 'normal', tierLabel: 'Normal' };
  if (colorCount <= 9) return { tier: 'hard', tierLabel: 'Hard' };
  if (colorCount <= 11) return { tier: 'expert', tierLabel: 'Expert' };
  if (level <= 1500) return { tier: 'master', tierLabel: 'Master' };
  return { tier: 'legend', tierLabel: 'Legend' };
}

/**
 * Fluid tubes = colors.
 * Beginner 1–50: 4 colors (50)
 * Easy 51–100: 5 colors (50)
 * Normal 101–200 / 201–300: 6 then 7 colors (100 each)
 * Hard 301–400 / 401–500: 8 then 9 colors (100 each)
 * Expert 501–600 / 601–700: 10 then 11 colors (100 each)
 * Level 701+: 12 colors (max)
 */
function colorCountFor(level: number): number {
  let remaining = level;
  for (let i = 0; i < LEVELS_AT_COLOR.length; i++) {
    const dwell = LEVELS_AT_COLOR[i];
    if (remaining <= dwell) return START_COLOR_COUNT + i;
    remaining -= dwell;
  }
  return MAX_COLOR_COUNT;
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
  const colorSpan = Math.max(1, MAX_COLOR_COUNT - START_COLOR_COUNT);
  const stage = (colors - START_COLOR_COUNT) / colorSpan; // 0 → 1
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
  const { tier, tierLabel } = tierFor(safeLevel, colorCount);

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
  steps: number[] = [1, 50, 51, 100, 200, 300, 400, 500, 600, 701, 3650],
): LevelDifficulty[] {
  return steps.map(getLevelDifficulty);
}
