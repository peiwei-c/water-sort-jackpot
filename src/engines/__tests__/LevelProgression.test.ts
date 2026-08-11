import {
  getLevelDifficulty,
  MAX_LEVEL,
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

  it('starts as beginner with 3 colors and 1 empty tube', () => {
    const d = getLevelDifficulty(1);
    expect(d.colorCount).toBe(3);
    expect(d.emptyTubes).toBe(1);
    expect(d.tier).toBe('beginner');
    expect(d.tierLabel).toBe('Beginner');
    expect(d.moveLimit).toBeGreaterThan(20);
  });

  it('ramps color count up to 12 by the end', () => {
    expect(getLevelDifficulty(1).colorCount).toBe(3);
    expect(getLevelDifficulty(500).colorCount).toBe(4);
    expect(getLevelDifficulty(1200).colorCount).toBe(5);
    expect(getLevelDifficulty(2000).colorCount).toBe(7);
    expect(getLevelDifficulty(3650).colorCount).toBe(12);
  });

  it('starts every level with exactly 1 empty tube', () => {
    expect(getLevelDifficulty(1).emptyTubes).toBe(1);
    expect(getLevelDifficulty(200).emptyTubes).toBe(1);
    expect(getLevelDifficulty(3650).emptyTubes).toBe(1);
  });

  it('tightens moves-per-color across the campaign', () => {
    const early = getLevelDifficulty(1);
    const late = getLevelDifficulty(3650);
    const earlyRatio = early.moveLimit / early.colorCount;
    const lateRatio = late.moveLimit / late.colorCount;
    expect(lateRatio).toBeLessThan(earlyRatio);
  });

  it('increases scramble strictness from 0 → 1', () => {
    expect(getLevelDifficulty(1).scrambleStrictness).toBe(0);
    expect(getLevelDifficulty(3650).scrambleStrictness).toBe(1);
    expect(getLevelDifficulty(1825).scrambleStrictness).toBeGreaterThan(0.4);
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
    for (const level of [1, 500, 1500, 3000, 3650]) {
      const engine = WaterSortEngine.createDefaultLevel(level);
      const diff = getLevelDifficulty(level);
      expect(engine.getTubes()).toHaveLength(diff.colorCount + diff.emptyTubes);
      expect(engine.isWon()).toBe(false);
    }
  });
});
