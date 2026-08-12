/**
 * Year-long campaign difficulty curve (~10 stations/day × 365 days).
 * Pure data + math — no UI or ad code.
 */

/** ~10 first clears per day for a full year of daily play. */
export const MAX_LEVEL = 3650;
export const LEVEL_CAPACITY = 4;

/** Levels spent at each color count while ramping 3 → 12. */
const LEVELS_PER_COLOR_STEP = Math.floor((MAX_LEVEL - 1) / 9); // 405

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
 * Color count ramps 3 → 12 across the campaign.
 * Holds each count for a stretch so players adapt before the next bump.
 */
function colorCountFor(level: number): number {
  return clamp(
    3 + Math.floor((level - 1) / LEVELS_PER_COLOR_STEP),
    3,
    12,
  );
}

/**
 * Empty helper tubes baked into the board.
 * Always 1 so the puzzle is pourable; more empties come from inventory / ads.
 */
function emptyTubesFor(_level: number): number {
  return 1;
}

/**
 * Move budget: scales with puzzle size, then squeezes as level rises.
 * Early levels feel generous; Legend is tight.
 */
function moveLimitFor(
  level: number,
  colorCount: number,
  emptyTubes: number,
  capacity: number,
): number {
  const progress = (level - 1) / (MAX_LEVEL - 1); // 0 → 1
  const base = colorCount * capacity + emptyTubes * 3;
  // Buffer drops from ~14 → ~2 across the campaign
  const buffer = Math.round(14 - progress * 12);
  // Overall squeeze: 1.12x early → 0.92x at the finale
  const squeeze = 1.12 - progress * 0.2;
  return Math.max(colorCount * 3 + 2, Math.round((base + buffer) * squeeze));
}

/** How aggressively we reject semi-solved generated boards. */
function scrambleStrictnessFor(level: number): number {
  return clamp((level - 1) / (MAX_LEVEL - 1), 0, 1);
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
 * Sample milestones for docs / tests — verifies the curve climbs.
 */
export function sampleDifficultyCurve(
  steps: number[] = [1, 400, 900, 1500, 2200, 3000, 3650],
): LevelDifficulty[] {
  return steps.map(getLevelDifficulty);
}
