import {
  getLevelDifficulty,
  MAX_LEVEL,
  MAX_COLOR_COUNT,
  START_TOTAL_TUBES,
  FAST_RAMP_END,
  SLOW_LEVELS_PER_COLOR,
  isCampaignComplete,
  sampleDifficultyCurve,
} from '../LevelProgression';
import { WaterSortEngine } from '../WaterSortEngine';

describe('LevelProgression (3650-level campaign)', () => {
  it('exposes MAX_LEVEL = 3650', () => {
    expect(MAX_LEVEL).toBe(3650);
  });

  it('clamps levels into 1…3650', () => {
    expect(getLevelDifficulty(0).level).toBe(1);
    expect(getLevelDifficulty(9999).level).toBe(3650);
  });

  it('starts as beginner with 5 tubes (4 colors + 1 empty)', () => {
    const d = getLevelDifficulty(1);
    expect(d.colorCount).toBe(START_TOTAL_TUBES - 1);
    expect(d.emptyTubes).toBe(1);
    expect(d.colorCount + d.emptyTubes).toBe(5);
    expect(d.tier).toBe('beginner');
    expect(d.tierLabel).toBe('Beginner');
    expect(d.moveLimit).toBeGreaterThan(20);
  });

  it('adds one fluid tube (and color) every 5 levels through the tutorial', () => {
    // 1–5: 5 tubes / 4 colors
    expect(getLevelDifficulty(1).colorCount).toBe(4);
    expect(getLevelDifficulty(5).colorCount).toBe(4);
    expect(getLevelDifficulty(5).colorCount + getLevelDifficulty(5).emptyTubes).toBe(5);

    // 6–10: 6 tubes / 5 colors
    expect(getLevelDifficulty(6).colorCount).toBe(5);
    expect(getLevelDifficulty(10).colorCount + getLevelDifficulty(10).emptyTubes).toBe(6);

    // 11–15: 7 tubes / 6 colors
    expect(getLevelDifficulty(11).colorCount).toBe(6);
    expect(getLevelDifficulty(FAST_RAMP_END).colorCount).toBe(6);
    expect(getLevelDifficulty(15).colorCount + getLevelDifficulty(15).emptyTubes).toBe(7);

    // Slow campaign band starts at 7 colors
    expect(getLevelDifficulty(16).colorCount).toBe(7);
    expect(getLevelDifficulty(20).colorCount).toBe(7);
  });

  it('keeps adding colors through the campaign instead of capping by level 50', () => {
    const l50 = getLevelDifficulty(50);
    const l1500 = getLevelDifficulty(1500);
    const late = getLevelDifficulty(3650);
    expect(l50.colorCount).toBeLessThan(l1500.colorCount);
    expect(l1500.colorCount).toBeLessThan(late.colorCount);
    expect(late.colorCount).toBe(MAX_COLOR_COUNT);
    expect(late.colorCount + late.emptyTubes).toBe(MAX_COLOR_COUNT + 1);
    const firstCapped = FAST_RAMP_END + 1 + 5 * SLOW_LEVELS_PER_COLOR;
    expect(getLevelDifficulty(firstCapped).colorCount).toBe(MAX_COLOR_COUNT);
    expect(firstCapped).toBeGreaterThan(1500);
  });

  it('starts every level with exactly 1 empty tube', () => {
    expect(getLevelDifficulty(1).emptyTubes).toBe(1);
    expect(getLevelDifficulty(200).emptyTubes).toBe(1);
    expect(getLevelDifficulty(3650).emptyTubes).toBe(1);
  });

  it('scales move budget with puzzle size rather than crushing early levels', () => {
    const small = getLevelDifficulty(1);
    const bigger = getLevelDifficulty(20);
    expect(bigger.moveLimit).toBeGreaterThan(small.moveLimit);
    expect(bigger.colorCount).toBeGreaterThan(small.colorCount);
  });

  it('ramps scramble strictness with tube stages (not only campaign end)', () => {
    const l1 = getLevelDifficulty(1).scrambleStrictness;
    const l6 = getLevelDifficulty(6).scrambleStrictness;
    const l20 = getLevelDifficulty(20).scrambleStrictness;
    const late = getLevelDifficulty(3650).scrambleStrictness;
    expect(l1).toBeGreaterThanOrEqual(0);
    expect(l6).toBeGreaterThan(l1);
    expect(l20).toBeGreaterThan(l6);
    expect(late).toBe(1);
  });

  it('assigns rising tiers', () => {
    expect(getLevelDifficulty(50).tier).toBe('beginner');
    expect(getLevelDifficulty(200).tier).toBe('easy');
    expect(getLevelDifficulty(600).tier).toBe('normal');
    expect(getLevelDifficulty(1200).tier).toBe('hard');
    expect(getLevelDifficulty(1800).tier).toBe('expert');
    expect(getLevelDifficulty(2500).tier).toBe('master');
    expect(getLevelDifficulty(3200).tier).toBe('legend');
  });

  it('marks campaign complete only at/after 3650', () => {
    expect(isCampaignComplete(3649)).toBe(false);
    expect(isCampaignComplete(3650)).toBe(true);
  });

  it('sample curve is monotonically non-decreasing in colors', () => {
    const samples = sampleDifficultyCurve();
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].colorCount).toBeGreaterThanOrEqual(
        samples[i - 1].colorCount,
      );
    }
  });

  it('can generate boards for milestone levels', () => {
    for (const level of [1, 5, 20, 40, 3650]) {
      const engine = WaterSortEngine.createDefaultLevel(level);
      const diff = getLevelDifficulty(level);
      expect(engine.getTubes()).toHaveLength(diff.colorCount + diff.emptyTubes);
      expect(engine.isWon()).toBe(false);
    }
  });
});
