import {
  deltaE76,
  analyzePaletteDistinctness,
  isPaletteDistinct,
  MIN_WATER_COLOR_DELTA_E,
  MIN_WATER_LIGHTNESS,
} from '../colorDistinctness';

describe('colorDistinctness', () => {
  it('scores near-identical reds as too close', () => {
    expect(deltaE76('#FF0000', '#FE0101')).toBeLessThan(5);
    const report = analyzePaletteDistinctness({
      1: '#FF0000',
      2: '#FE0101',
      3: '#00FF00',
    });
    expect(report.tooClose.length).toBeGreaterThan(0);
    expect(isPaletteDistinct({ 1: '#FF0000', 2: '#FE0101', 3: '#00FF00' })).toBe(
      false,
    );
  });

  it('accepts a well-spaced trio', () => {
    const palette = { 1: '#E03C06', 2: '#1FF91F', 3: '#1F56F9' };
    const report = analyzePaletteDistinctness(palette);
    expect(report.minDeltaE).toBeGreaterThanOrEqual(MIN_WATER_COLOR_DELTA_E);
    expect(report.minLightness).toBeGreaterThanOrEqual(MIN_WATER_LIGHTNESS);
    expect(isPaletteDistinct(palette)).toBe(true);
  });

  it('flags liquids that are too dark for the bench', () => {
    const palette = {
      1: '#050505',
      2: '#1FF91F',
      3: '#1F56F9',
    };
    const report = analyzePaletteDistinctness(palette);
    expect(report.tooDark).toContain(1);
    expect(isPaletteDistinct(palette)).toBe(false);
  });
});
