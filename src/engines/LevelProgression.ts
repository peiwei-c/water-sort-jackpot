/**
 * 300-level campaign difficulty curve.
 * Pure data + math — no UI or ad code.
 */

export const MAX_LEVEL = 300;
export const LEVEL_CAPACITY = 4;

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
  if (level <= 10) return { tier: 'beginner', tierLabel: 'Beginner' };
  if (level <= 40) return { tier: 'easy', tierLabel: 'Easy' };
  if (level <= 90) return { tier: 'normal', tierLabel: 'Normal' };
  if (level <= 150) return { tier: 'hard', tierLabel: 'Hard' };
  if (level <= 210) return { tier: 'expert', tierLabel: 'Expert' };
  if (level <= 270) return { tier: 'master', tierLabel: 'Master' };
  return { tier: 'legend', tierLabel: 'Legend' };
}

/**
 * Color count ramps 3 → 12 across the campaign.
 * Holds each count for a stretch so players adapt before the next bump.
 */
function colorCountFor(level: number): number {
  // ~25 levels per color step from 3 up to 12
  return clamp(3 + Math.floor((level - 1) / 25), 3, 12);
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
  // Overall squeeze: 1.12x early → 0.92x at level 300
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
  steps: number[] = [1, 25, 50, 100, 150, 200, 250, 300],
): LevelDifficulty[] {
  return steps.map(getLevelDifficulty);
}
