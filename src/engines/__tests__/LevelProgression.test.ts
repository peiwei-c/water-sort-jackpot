import {
  getLevelDifficulty,
  MAX_LEVEL,
  MAX_COLOR_COUNT,
  START_TOTAL_TUBES,
  LEVELS_PER_TUBE_STEP,
  MID_TIER_LEVELS_PER_COLOR,
  EASY_ONBOARDING_END_LEVEL,
  COLOR_RAMP_END_LEVEL,
  isCampaignComplete,
  sampleDifficultyCurve,
} from '../LevelProgression';
import { WaterSortEngine } from '../WaterSortEngine';

describe('LevelProgression (3650-level campaign, 50/100 color bands)', () => {
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

  it('holds Beginner/Easy for 50 and Normal/Hard/Expert for 100 per color', () => {
    expect(LEVELS_PER_TUBE_STEP).toBe(50);
    expect(MID_TIER_LEVELS_PER_COLOR).toBe(100);
    expect(EASY_ONBOARDING_END_LEVEL).toBe(50);
    expect(COLOR_RAMP_END_LEVEL).toBe(701);

    // Beginner 1–50: 4 colors
    expect(getLevelDifficulty(1).colorCount).toBe(4);
    expect(getLevelDifficulty(50).colorCount).toBe(4);
    expect(getLevelDifficulty(50).tier).toBe('beginner');

    // Easy 51–100: 5 colors
    expect(getLevelDifficulty(51).colorCount).toBe(5);
    expect(getLevelDifficulty(100).colorCount).toBe(5);
    expect(getLevelDifficulty(51).tier).toBe('easy');

    // Normal 101–200: 6 colors
    expect(getLevelDifficulty(101).colorCount).toBe(6);
    expect(getLevelDifficulty(200).colorCount).toBe(6);
    expect(getLevelDifficulty(101).tier).toBe('normal');

    // Normal 201–300: 7 colors
    expect(getLevelDifficulty(201).colorCount).toBe(7);
    expect(getLevelDifficulty(300).colorCount).toBe(7);

    // Hard 301–400: 8 colors
    expect(getLevelDifficulty(301).colorCount).toBe(8);
    expect(getLevelDifficulty(400).colorCount).toBe(8);
    expect(getLevelDifficulty(301).tier).toBe('hard');

    // Hard 401–500: 9 colors
    expect(getLevelDifficulty(401).colorCount).toBe(9);
    expect(getLevelDifficulty(500).colorCount).toBe(9);

    // Expert 501–600: 10 colors
    expect(getLevelDifficulty(501).colorCount).toBe(10);
    expect(getLevelDifficulty(600).colorCount).toBe(10);
    expect(getLevelDifficulty(501).tier).toBe('expert');

    // Expert 601–700: 11 colors
    expect(getLevelDifficulty(601).colorCount).toBe(11);
    expect(getLevelDifficulty(700).colorCount).toBe(11);

    // 701+: 12-color cap
    expect(getLevelDifficulty(701).colorCount).toBe(MAX_COLOR_COUNT);
    expect(getLevelDifficulty(3650).colorCount).toBe(MAX_COLOR_COUNT);
  });

  it('starts every level with exactly 1 empty tube', () => {
    expect(getLevelDifficulty(1).emptyTubes).toBe(1);
    expect(getLevelDifficulty(200).emptyTubes).toBe(1);
    expect(getLevelDifficulty(3650).emptyTubes).toBe(1);
  });

  it('scales move budget with puzzle size rather than crushing early levels', () => {
    const small = getLevelDifficulty(1);
    const bigger = getLevelDifficulty(150);
    expect(bigger.moveLimit).toBeGreaterThan(small.moveLimit);
    expect(bigger.colorCount).toBeGreaterThan(small.colorCount);
  });

  it('ramps scramble strictness with tube stages (not only campaign end)', () => {
    const l1 = getLevelDifficulty(1).scrambleStrictness;
    const l51 = getLevelDifficulty(51).scrambleStrictness;
    const l151 = getLevelDifficulty(151).scrambleStrictness;
    const late = getLevelDifficulty(3650).scrambleStrictness;
    expect(l1).toBeGreaterThanOrEqual(0);
    expect(l51).toBeGreaterThan(l1);
    expect(l151).toBeGreaterThan(l51);
    expect(late).toBe(1);
  });

  it('assigns rising tiers', () => {
    expect(getLevelDifficulty(5).tier).toBe('beginner');
    expect(getLevelDifficulty(75).tier).toBe('easy');
    expect(getLevelDifficulty(125).tier).toBe('normal');
    expect(getLevelDifficulty(250).tier).toBe('normal');
    expect(getLevelDifficulty(350).tier).toBe('hard');
    expect(getLevelDifficulty(450).tier).toBe('hard');
    expect(getLevelDifficulty(550).tier).toBe('expert');
    expect(getLevelDifficulty(650).tier).toBe('expert');
    expect(getLevelDifficulty(701).tier).toBe('master');
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
    for (const level of [1, 50, 51, 300, 701, 3650]) {
      const engine = WaterSortEngine.createDefaultLevel(level);
      const diff = getLevelDifficulty(level);
      expect(engine.getTubes()).toHaveLength(diff.colorCount + diff.emptyTubes);
      expect(engine.isWon()).toBe(false);
    }
  });
});
