/**
 * Perceptual color distance helpers for liquid palettes.
 * Pure math — used to keep in-game colors easy to tell apart.
 */

/** CIE76 ΔE below this is hard to spot on the sorting bench. */
export const MIN_WATER_COLOR_DELTA_E = 28;

/** Too-dark liquids disappear on the lab bench background. */
export const MIN_WATER_LIGHTNESS = 35;

export function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '').trim();
  if (n.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const v = parseInt(n, 16);
  if (!Number.isFinite(v)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return [
    R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    R * 0.2126729 + G * 0.7151522 + B * 0.072175,
    R * 0.0193339 + G * 0.119192 + B * 0.9503041,
  ];
}

function labF(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

/** CIE L*a*b* (D65). */
export function rgbToLab(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  const fx = labF(x / 0.95047);
  const fy = labF(y / 1);
  const fz = labF(z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function hexToLab(hex: string): [number, number, number] {
  return rgbToLab(...hexToRgb(hex));
}

/** CIE76 ΔE — good enough for “can you tell these apart?” gates. */
export function deltaE76(a: string, b: string): number {
  const A = hexToLab(a);
  const B = hexToLab(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

export type PaletteDistinctness = {
  minDeltaE: number;
  minLightness: number;
  closestPair: [number, number] | null;
  tooClose: Array<[number, number, number]>;
  tooDark: number[];
};

/** Analyze a 1…N id → hex palette for gameplay readability. */
export function analyzePaletteDistinctness(
  palette: Record<number, string>,
  minDeltaE: number = MIN_WATER_COLOR_DELTA_E,
  minLightness: number = MIN_WATER_LIGHTNESS,
): PaletteDistinctness {
  const ids = Object.keys(palette)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);

  let minDelta = Infinity;
  let closestPair: [number, number] | null = null;
  const tooClose: Array<[number, number, number]> = [];
  const tooDark: number[] = [];

  for (const id of ids) {
    const L = hexToLab(palette[id])[0];
    if (L < minLightness) tooDark.push(id);
  }

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const d = deltaE76(palette[a], palette[b]);
      if (d < minDelta) {
        minDelta = d;
        closestPair = [a, b];
      }
      if (d < minDeltaE) {
        tooClose.push([a, b, d]);
      }
    }
  }

  if (!Number.isFinite(minDelta)) minDelta = Infinity;

  const lightnesses = ids.map((id) => hexToLab(palette[id])[0]);
  return {
    minDeltaE: minDelta,
    minLightness: lightnesses.length ? Math.min(...lightnesses) : Infinity,
    closestPair,
    tooClose,
    tooDark,
  };
}

export function isPaletteDistinct(
  palette: Record<number, string>,
  minDeltaE: number = MIN_WATER_COLOR_DELTA_E,
  minLightness: number = MIN_WATER_LIGHTNESS,
): boolean {
  const report = analyzePaletteDistinctness(palette, minDeltaE, minLightness);
  return report.tooClose.length === 0 && report.tooDark.length === 0;
}
