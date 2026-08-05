import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SlotSymbol, SLOT_SYMBOLS } from '../engines/JackpotEngine';
import { LAB, SYMBOL_EMOJI } from '../theme/colors';

export const CELL = 58;
export const REEL_GAP = 8;
export const REEL_WINDOW_W = CELL * 3 + REEL_GAP * 2;

export const LINE_COLORS: Record<number, string> = {
  1: '#E85D4C',
  2: '#7EE3D6',
  3: '#F0B429',
  4: '#5B9BD5',
  5: '#F4A261',
};

export const LINE_NAMES: Record<number, string> = {
  1: 'Top',
  2: 'Mid',
  3: 'Bot',
  4: 'Diag ↘',
  5: 'Diag ↗',
};

export const LINE_CELL_MAP: Record<number, [number, number][]> = {
  1: [[0, 0], [0, 1], [0, 2]],
  2: [[1, 0], [1, 1], [1, 2]],
  3: [[2, 0], [2, 1], [2, 2]],
  4: [[0, 0], [1, 1], [2, 2]],
  5: [[2, 0], [1, 1], [0, 2]],
};

/**
 * How many reel rows to show for the current line count.
 * L1 → top only · L1–2 → top+mid · L3+ (bot/diags) → full 3×3
 */
export function visibleRowsForLines(activeLines: number): 1 | 2 | 3 {
  if (activeLines <= 1) return 1;
  if (activeLines === 2) return 2;
  return 3;
}

export function reelWindowHeight(rows: number): number {
  return CELL * rows;
}

type ColumnProps = {
  /** Full column top→mid→bot; only the first `rowCount` are shown. */
  symbols: [SlotSymbol, SlotSymbol, SlotSymbol];
  rowCount: 1 | 2 | 3;
  spinning: boolean;
  stopDelayMs?: number;
  spinMs?: number;
};

function buildStrip(final: SlotSymbol[]): SlotSymbol[] {
  const pad: SlotSymbol[] = [];
  for (let i = 0; i < 20; i++) {
    pad.push(SLOT_SYMBOLS[i % SLOT_SYMBOLS.length]);
  }
  return [...pad, ...final];
}

/**
 * One vertical reel column with a continuous scrolling strip.
 * Window height matches `rowCount` so unused rows stay hidden.
 */
export function ScrollingReelColumn({
  symbols,
  rowCount,
  spinning,
  stopDelayMs = 0,
  spinMs = 850,
}: ColumnProps) {
  const visible = useMemo(
    () => symbols.slice(0, rowCount) as SlotSymbol[],
    [symbols, rowCount],
  );
  const offset = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const strip = useMemo(() => buildStrip(visible), [visible]);
  const finalOffset = (strip.length - rowCount) * CELL;
  const windowH = reelWindowHeight(rowCount);

  useEffect(() => {
    if (!spinning) {
      loopRef.current?.stop();
      offset.setValue(-finalOffset);
      return;
    }

    offset.setValue(0);
    const loop = Animated.loop(
      Animated.timing(offset, {
        toValue: -CELL * SLOT_SYMBOLS.length * 2,
        duration: 320,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loopRef.current = loop;
    loop.start();

    const stopTimer = setTimeout(() => {
      loop.stop();
      offset.stopAnimation((current) => {
        const start = typeof current === 'number' ? current : 0;
        const cycle = CELL * SLOT_SYMBOLS.length;
        const aligned = -(((Math.abs(start) % cycle) + cycle) % cycle);
        offset.setValue(aligned);
        Animated.timing(offset, {
          toValue: -finalOffset,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }, spinMs + stopDelayMs);

    return () => {
      clearTimeout(stopTimer);
      loop.stop();
    };
  }, [spinning, visible, finalOffset, offset, spinMs, stopDelayMs, rowCount]);

  return (
    <View style={[styles.column, { height: windowH }]}>
      <Animated.View style={{ transform: [{ translateY: offset }] }}>
        {strip.map((sym, i) => (
          <View key={`s-${i}`} style={styles.cell}>
            <Text style={styles.emoji}>{SYMBOL_EMOJI[sym]}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

type OverlayProps = {
  activeLines: number;
  winningLineIds: Set<number>;
  rowCount: 1 | 2 | 3;
};

/**
 * Payline strokes — only over the visible rows for the current selection.
 */
export function PaylineOverlay({
  activeLines,
  winningLineIds,
  rowCount,
}: OverlayProps) {
  const colPitch = CELL + REEL_GAP;
  const windowH = reelWindowHeight(rowCount);
  const cx = (c: number) => c * colPitch + CELL / 2;
  const cy = (r: number) => r * CELL + CELL / 2;

  const visibleIds = [1, 2, 3, 4, 5].filter((id) => {
    if (id > activeLines) return false;
    // Skip lines that need rows we aren't showing
    const cells = LINE_CELL_MAP[id];
    return cells.every(([r]) => r < rowCount);
  });

  return (
    <View
      pointerEvents="none"
      key={`paylines-${activeLines}-${rowCount}`}
      style={[styles.overlay, { width: REEL_WINDOW_W, height: windowH }]}
    >
      {visibleIds.map((id) => {
        const isWin = winningLineIds.has(id);
        const cells = LINE_CELL_MAP[id];
        const color = LINE_COLORS[id];
        const thickness = isWin ? 4.5 : 3;
        const opacity = isWin ? 1 : 0.8;

        return (
          <View key={`line-${id}`}>
            {cells.slice(0, -1).map((_, i) => {
              const [r1, c1] = cells[i];
              const [r2, c2] = cells[i + 1];
              const x1 = cx(c1);
              const y1 = cy(r1);
              const x2 = cx(c2);
              const y2 = cy(r2);
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy) || 1;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <View
                  key={`seg-${id}-${i}`}
                  style={{
                    position: 'absolute',
                    left: midX - length / 2,
                    top: midY - thickness / 2,
                    width: length,
                    height: thickness,
                    borderRadius: thickness,
                    backgroundColor: color,
                    opacity,
                    transform: [{ rotate: `${angle}deg` }],
                  }}
                />
              );
            })}
            {cells.map(([r, c]) => (
              <View
                key={`dot-${id}-${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: cx(c) - 5,
                  top: cy(r) - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: color,
                  opacity,
                  borderWidth: 1.5,
                  borderColor: '#071018',
                }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

/** Side rail — only chips for currently selected lines. */
export function LineRail({
  side,
  activeLines,
  winningLineIds,
}: {
  side: 'left' | 'right';
  activeLines: number;
  winningLineIds: Set<number>;
}) {
  const order = (side === 'left' ? [1, 2, 3] : [4, 5]).filter(
    (id) => id <= activeLines,
  );

  if (order.length === 0) {
    return <View style={[styles.rail, side === 'left' ? styles.railLeft : styles.railRight]} />;
  }

  return (
    <View style={[styles.rail, side === 'left' ? styles.railLeft : styles.railRight]}>
      {order.map((id) => {
        const win = winningLineIds.has(id);
        return (
          <View
            key={id}
            style={[
              styles.railChip,
              { borderColor: LINE_COLORS[id], backgroundColor: LINE_COLORS[id] },
              win && styles.railChipWin,
            ]}
          >
            <Text style={[styles.railText, styles.railTextOn]}>{id}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: CELL,
    overflow: 'hidden',
    backgroundColor: LAB.benchDeep,
  },
  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(126, 227, 214, 0.12)',
  },
  emoji: {
    fontSize: 30,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 6,
  },
  rail: {
    justifyContent: 'space-evenly',
    paddingVertical: 4,
    minWidth: 26,
  },
  railLeft: {
    marginRight: 6,
  },
  railRight: {
    marginLeft: 6,
  },
  railChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  railChipWin: {
    transform: [{ scale: 1.12 }],
  },
  railText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '800',
    fontSize: 12,
  },
  railTextOn: {
    color: '#062018',
  },
});
