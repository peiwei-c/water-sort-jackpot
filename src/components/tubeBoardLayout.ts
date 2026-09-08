import {
  CUP_CAP_H,
  CUP_STRAW_H,
  SEGMENT_H,
  TUBE_GLASS_PAD,
  TUBE_W,
} from './tubeMetrics';

/** Horizontal space one cup occupies before row gaps. */
export const TUBE_COL_W = TUBE_W;
export const TUBE_GAP = 4;
export const BOARD_INSET = 16;
export const MIN_BOARD_SCALE = 0.7;
export const MAX_BOARD_SCALE = 1.85;

export type BoardLayout = {
  cols: number;
  rows: number;
  scale: number;
  contentW: number;
  contentH: number;
};

/** Prefer one row while the rack is small; split later tickets into even rows. */
export function tubeColumnCount(tubeCount: number): number {
  const n = Math.max(1, Math.floor(tubeCount));
  if (n <= 6) return n;
  if (n <= 8) return 4;
  if (n <= 10) return 5;
  if (n <= 12) return 6;
  return 7;
}

export function tubeVisualHeight(capacity: number): number {
  const layers = Math.max(1, capacity);
  return Math.ceil(
    CUP_STRAW_H * 0.35 +
      CUP_CAP_H +
      layers * SEGMENT_H +
      TUBE_GLASS_PAD +
      12,
  );
}

export function computeBoardLayout(
  tubeCount: number,
  capacity: number,
  availW: number,
  availH: number,
): BoardLayout {
  const cols = tubeColumnCount(tubeCount);
  const rows = Math.max(1, Math.ceil(Math.max(1, tubeCount) / cols));
  const contentW = cols * TUBE_COL_W + Math.max(0, cols - 1) * TUBE_GAP;
  const contentH = rows * tubeVisualHeight(capacity) + Math.max(0, rows - 1) * TUBE_GAP;

  if (availW < 8 || availH < 8) {
    return { cols, rows, scale: 1, contentW, contentH };
  }

  const scale = Math.min(
    (availW - BOARD_INSET) / contentW,
    (availH - BOARD_INSET) / contentH,
  );

  return {
    cols,
    rows,
    scale: Math.max(MIN_BOARD_SCALE, Math.min(MAX_BOARD_SCALE, scale)),
    contentW,
    contentH,
  };
}
