import {
  getLevelDifficulty,
  MAX_LEVEL,
  MAX_COLOR_COUNT,
  START_TOTAL_TUBES,
  LEVELS_PER_TUBE_STEP,
  NORMAL_LEVELS_PER_COLOR,
  HARD_LEVELS_PER_COLOR,
  EXPERT_LEVELS_PER_COLOR,
  COLOR_RAMP_END_LEVEL,
  isCampaignComplete,
  sampleDifficultyCurve,
} from '../LevelProgression';
import { WaterSortEngine } from '../WaterSortEngine';

describe('LevelProgression (3650-level campaign, variable color dwell)', () => {
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

  it('holds Normal 20, Hard 30, and Expert 40 levels per color', () => {
    expect(LEVELS_PER_TUBE_STEP).toBe(10);
    expect(NORMAL_LEVELS_PER_COLOR).toBe(20);
    expect(HARD_LEVELS_PER_COLOR).toBe(30);
    expect(EXPERT_LEVELS_PER_COLOR).toBe(40);
    expect(COLOR_RAMP_END_LEVEL).toBe(201);

    // Beginner 1–10: 4 colors
    expect(getLevelDifficulty(1).colorCount).toBe(4);
    expect(getLevelDifficulty(10).colorCount).toBe(4);

    // Easy 11–20: 5 colors
    expect(getLevelDifficulty(11).colorCount).toBe(5);
    expect(getLevelDifficulty(20).colorCount).toBe(5);

    // Normal 21–40: 6 colors (20 levels)
    expect(getLevelDifficulty(21).colorCount).toBe(6);
    expect(getLevelDifficulty(40).colorCount).toBe(6);
    expect(getLevelDifficulty(21).tier).toBe('normal');

    // Normal 41–60: 7 colors (20 levels)
    expect(getLevelDifficulty(41).colorCount).toBe(7);
    expect(getLevelDifficulty(60).colorCount).toBe(7);

    // Hard 61–90: 8 colors (30 levels)
    expect(getLevelDifficulty(61).colorCount).toBe(8);
    expect(getLevelDifficulty(90).colorCount).toBe(8);
    expect(getLevelDifficulty(61).tier).toBe('hard');

    // Hard 91–120: 9 colors (30 levels)
    expect(getLevelDifficulty(91).colorCount).toBe(9);
    expect(getLevelDifficulty(120).colorCount).toBe(9);

    // Expert 121–160: 10 colors (40 levels)
    expect(getLevelDifficulty(121).colorCount).toBe(10);
    expect(getLevelDifficulty(160).colorCount).toBe(10);
    expect(getLevelDifficulty(121).tier).toBe('expert');

    // Expert 161–200: 11 colors (40 levels)
    expect(getLevelDifficulty(161).colorCount).toBe(11);
    expect(getLevelDifficulty(200).colorCount).toBe(11);

    // 201+: 12-color cap
    expect(getLevelDifficulty(201).colorCount).toBe(MAX_COLOR_COUNT);
    expect(getLevelDifficulty(3650).colorCount).toBe(MAX_COLOR_COUNT);
  });

  it('starts every level with exactly 1 empty tube', () => {
    expect(getLevelDifficulty(1).emptyTubes).toBe(1);
    expect(getLevelDifficulty(200).emptyTubes).toBe(1);
    expect(getLevelDifficulty(3650).emptyTubes).toBe(1);
  });

  it('scales move budget with puzzle size rather than crushing early levels', () => {
    const small = getLevelDifficulty(1);
    const bigger = getLevelDifficulty(40);
    expect(bigger.moveLimit).toBeGreaterThan(small.moveLimit);
    expect(bigger.colorCount).toBeGreaterThan(small.colorCount);
  });

  it('ramps scramble strictness with tube stages (not only campaign end)', () => {
    const l1 = getLevelDifficulty(1).scrambleStrictness;
    const l11 = getLevelDifficulty(11).scrambleStrictness;
    const l41 = getLevelDifficulty(41).scrambleStrictness;
    const late = getLevelDifficulty(3650).scrambleStrictness;
    expect(l1).toBeGreaterThanOrEqual(0);
    expect(l11).toBeGreaterThan(l1);
    expect(l41).toBeGreaterThan(l11);
    expect(late).toBe(1);
  });

  it('assigns rising tiers', () => {
    expect(getLevelDifficulty(5).tier).toBe('beginner');
    expect(getLevelDifficulty(15).tier).toBe('easy');
    expect(getLevelDifficulty(30).tier).toBe('normal');
    expect(getLevelDifficulty(50).tier).toBe('normal');
    expect(getLevelDifficulty(70).tier).toBe('hard');
    expect(getLevelDifficulty(100).tier).toBe('hard');
    expect(getLevelDifficulty(125).tier).toBe('expert');
    expect(getLevelDifficulty(180).tier).toBe('expert');
    expect(getLevelDifficulty(201).tier).toBe('master');
    expect(getLevelDifficulty(1500).tier).toBe('master');
    expect(getLevelDifficulty(1501).tier).toBe('legend');
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
    for (const level of [1, 10, 20, 40, 90, 201, 3650]) {
      const engine = WaterSortEngine.createDefaultLevel(level);
      const diff = getLevelDifficulty(level);
      expect(engine.getTubes()).toHaveLength(diff.colorCount + diff.emptyTubes);
      expect(engine.isWon()).toBe(false);
    }
  });
});
