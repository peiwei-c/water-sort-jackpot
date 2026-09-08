import {
  computeBoardLayout,
  MAX_BOARD_SCALE,
  tubeColumnCount,
} from '../tubeBoardLayout';

describe('tubeBoardLayout', () => {
  it('keeps small racks on one row', () => {
    expect(tubeColumnCount(5)).toBe(5);
    expect(tubeColumnCount(6)).toBe(6);
  });

  it('splits larger racks into even rows', () => {
    expect(tubeColumnCount(7)).toBe(4);
    expect(tubeColumnCount(8)).toBe(4);
    expect(tubeColumnCount(11)).toBe(6);
    expect(tubeColumnCount(13)).toBe(7);
  });

  it('enlarges a 5-cup rack to fill a wide stage', () => {
    const layout = computeBoardLayout(5, 4, 720, 480);
    expect(layout.cols).toBe(5);
    expect(layout.rows).toBe(1);
    expect(layout.scale).toBeGreaterThan(1.3);
    expect(layout.scale).toBeLessThanOrEqual(MAX_BOARD_SCALE);
  });

  it('shrinks a 13-cup rack to fit a phone stage', () => {
    const layout = computeBoardLayout(13, 4, 360, 420);
    expect(layout.rows).toBe(2);
    expect(layout.scale).toBeLessThan(1);
    expect(layout.contentW * layout.scale).toBeLessThanOrEqual(360);
  });
});
