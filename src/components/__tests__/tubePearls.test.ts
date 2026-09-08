import { segmentShowsPearls } from '../tubePearls';

describe('segmentShowsPearls', () => {
  it('shows pearls on every layer when colors are unmerged', () => {
    const display = [3, 2, 1];
    expect(segmentShowsPearls(display, 0)).toBe(true);
    expect(segmentShowsPearls(display, 1)).toBe(true);
    expect(segmentShowsPearls(display, 2)).toBe(true);
  });

  it('hides pearls on upper layers of a merged same-color run', () => {
    // top → bottom: green, then two reds stacked
    const display = [4, 1, 1];
    expect(segmentShowsPearls(display, 0)).toBe(true);
    expect(segmentShowsPearls(display, 1)).toBe(false);
    expect(segmentShowsPearls(display, 2)).toBe(true);
  });

  it('shows one pearl cluster for a fully merged cup', () => {
    const display = [2, 2, 2, 2];
    expect(segmentShowsPearls(display, 0)).toBe(false);
    expect(segmentShowsPearls(display, 1)).toBe(false);
    expect(segmentShowsPearls(display, 2)).toBe(false);
    expect(segmentShowsPearls(display, 3)).toBe(true);
  });
});
