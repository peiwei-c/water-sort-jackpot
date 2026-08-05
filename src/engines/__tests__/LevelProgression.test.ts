import {
  getLevelDifficulty,
  MAX_LEVEL,
  isCampaignComplete,
  sampleDifficultyCurve,
} from '../LevelProgression';
import { WaterSortEngine } from '../WaterSortEngine';

describe('LevelProgression (300-level campaign)', () => {
  it('exposes MAX_LEVEL = 300', () => {
    expect(MAX_LEVEL).toBe(300);
  });

  it('clamps levels into 1…300', () => {
    expect(getLevelDifficulty(0).level).toBe(1);
    expect(getLevelDifficulty(999).level).toBe(300);
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
    expect(getLevelDifficulty(50).colorCount).toBe(4);
    expect(getLevelDifficulty(100).colorCount).toBe(6);
    expect(getLevelDifficulty(200).colorCount).toBe(10);
    expect(getLevelDifficulty(300).colorCount).toBe(12);
  });

  it('starts every level with exactly 1 empty tube', () => {
    expect(getLevelDifficulty(1).emptyTubes).toBe(1);
    expect(getLevelDifficulty(20).emptyTubes).toBe(1);
    expect(getLevelDifficulty(300).emptyTubes).toBe(1);
  });

  it('tightens moves-per-color across the campaign', () => {
    const early = getLevelDifficulty(1);
    const late = getLevelDifficulty(300);
    const earlyRatio = early.moveLimit / early.colorCount;
    const lateRatio = late.moveLimit / late.colorCount;
    expect(lateRatio).toBeLessThan(earlyRatio);
  });

  it('increases scramble strictness from 0 → 1', () => {
    expect(getLevelDifficulty(1).scrambleStrictness).toBe(0);
    expect(getLevelDifficulty(300).scrambleStrictness).toBe(1);
    expect(getLevelDifficulty(150).scrambleStrictness).toBeGreaterThan(0.4);
  });

  it('assigns rising tiers', () => {
    expect(getLevelDifficulty(5).tier).toBe('beginner');
    expect(getLevelDifficulty(30).tier).toBe('easy');
    expect(getLevelDifficulty(80).tier).toBe('normal');
    expect(getLevelDifficulty(120).tier).toBe('hard');
    expect(getLevelDifficulty(180).tier).toBe('expert');
    expect(getLevelDifficulty(240).tier).toBe('master');
    expect(getLevelDifficulty(290).tier).toBe('legend');
  });

  it('marks campaign complete only at/after 300', () => {
    expect(isCampaignComplete(299)).toBe(false);
    expect(isCampaignComplete(300)).toBe(true);
  });

  it('sample curve is monotonically non-decreasing in colors', () => {
    const samples = sampleDifficultyCurve();
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].colorCount).toBeGreaterThanOrEqual(samples[i - 1].colorCount);
    }
  });

  it('can generate boards for milestone levels', () => {
    for (const level of [1, 50, 100, 200, 300]) {
      const engine = WaterSortEngine.createDefaultLevel(level);
      const diff = getLevelDifficulty(level);
      expect(engine.getTubes()).toHaveLength(diff.colorCount + diff.emptyTubes);
      expect(engine.isWon()).toBe(false);
    }
  });
});
