import React, { useEffect, useMemo, useRef, memo } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import type { Tube as TubeData } from '../engines/WaterSortEngine';
import {
  getVialTheme,
  VIAL_DEFAULT,
  PALETTE_DEFAULT,
  waterColor,
} from '../engines/StoreCatalog';
import { WATER_COLOR_LABELS } from '../theme/colors';
import { BOBA } from '../theme/boba';

export const SEGMENT_H = 28;
export const TUBE_W = 52;
export const TUBE_GLASS_PAD = 16;
export const CUP_STRAW_H = 16;
export const CUP_CAP_H = 14;

type Props = {
  tube: TubeData;
  capacity: number;
  index?: number;
  selected: boolean;
  hinted?: boolean;
  vialSkinId?: string;
  paletteId?: string;
  rareSkin?: boolean;
  tiltDir?: -1 | 0 | 1;
  hideTopSegments?: number;
  disabled?: boolean;
  onSelect: (index: number) => void;
  onLayoutTube?: (
    index: number,
    layout: { x: number; y: number; width: number; height: number },
  ) => void;
};

function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  if (n.length !== 6) return hex;
  const num = parseInt(n, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r + amount)));
  g = Math.max(0, Math.min(255, Math.round(g + amount)));
  b = Math.max(0, Math.min(255, Math.round(b + amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function tubeAccessibilityLabel(
  index: number | undefined,
  tube: TubeData,
  selected: boolean,
  hinted: boolean | undefined,
): string {
  const cup = index != null ? `Cup ${index + 1}` : 'Cup';
  if (tube.length === 0) {
    return `${cup}, empty${selected ? ', selected' : ''}${hinted ? ', hinted' : ''}`;
  }
  const top = tube[tube.length - 1];
  const topName = WATER_COLOR_LABELS[top] ?? `color ${top}`;
  const layers = `${tube.length} layer${tube.length === 1 ? '' : 's'}`;
  return `${cup}, ${layers}, top ${topName}${selected ? ', selected' : ''}${hinted ? ', hinted' : ''}`;
}

function TubeComponent({
  tube,
  capacity,
  index = 0,
  selected,
  hinted,
  vialSkinId = VIAL_DEFAULT,
  paletteId = PALETTE_DEFAULT,
  rareSkin,
  tiltDir = 0,
  hideTopSegments = 0,
  disabled,
  onSelect,
  onLayoutTube,
}: Props) {
  const lift = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const levelPulse = useRef(new Animated.Value(1)).current;
  const theme = getVialTheme(vialSkinId);
  const gold = vialSkinId === 'vial_crown' || rareSkin;

  const visibleTube = useMemo(() => {
    if (hideTopSegments <= 0) return tube;
    return tube.slice(0, Math.max(0, tube.length - hideTopSegments));
  }, [tube, hideTopSegments]);

  useEffect(() => {
    Animated.spring(lift, {
      toValue: selected ? -12 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  }, [selected, lift]);

  useEffect(() => {
    Animated.timing(tilt, {
      toValue: tiltDir * 34,
      duration: tiltDir === 0 ? 220 : 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tiltDir, tilt]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(levelPulse, {
        toValue: 1.03,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(levelPulse, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visibleTube.length, levelPulse]);

  const emptySlots = capacity - visibleTube.length;
  const glassH = capacity * SEGMENT_H + TUBE_GLASS_PAD;
  const a11yLabel = tubeAccessibilityLabel(index, tube, selected, hinted);
  const sealed = visibleTube.length === capacity && new Set(visibleTube).size === 1;

  return (
    <Pressable
      onPress={() => onSelect(index)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onLayout={(e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayoutTube?.(index, { x, y, width, height });
      }}
    >
      <Animated.View
        style={[
          styles.wrap,
          hinted && !selected && styles.hinted,
          {
            transform: [
              { translateY: lift },
              {
                rotate: tilt.interpolate({
                  inputRange: [-34, 0, 34],
                  outputRange: ['-34deg', '0deg', '34deg'],
                }),
              },
              { scale: selected ? 1.04 : levelPulse },
            ],
          },
        ]}
      >
        <View style={styles.straw} />
        <View style={[styles.cap, gold && styles.capGold, sealed && styles.capDone]}>
          <View style={[styles.capHole, gold && styles.capHoleGold]} />
        </View>
        <View
          style={[
            styles.rim,
            gold && styles.rimGold,
            { borderColor: theme.rimBorder },
          ]}
        />

        <View
          style={[
            styles.glass,
            {
              height: glassH,
              borderColor: gold ? 'rgba(240,200,80,0.75)' : 'rgba(255,255,255,0.55)',
            },
            selected && { borderColor: theme.selectGlow },
          ]}
        >
          <View style={styles.glassShine} />
          <View style={styles.inner}>
            {Array.from({ length: emptySlots }).map((_, i) => (
              <View key={`e-${i}`} style={styles.emptySegment} />
            ))}
            {[...visibleTube].reverse().map((colorId, i) => {
              const isTop = i === 0;
              const isBottom = i === visibleTube.length - 1;
              const base = waterColor(paletteId, colorId);
              return (
                <View
                  key={`c-${visibleTube.length - 1 - i}-${colorId}`}
                  style={[
                    styles.segment,
                    { height: SEGMENT_H },
                    isBottom && styles.segmentBottom,
                  ]}
                >
                  <View
                    style={[
                      styles.segmentFill,
                      {
                        backgroundColor: base,
                        borderTopLeftRadius: isTop ? 6 : 0,
                        borderTopRightRadius: isTop ? 6 : 0,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.segmentShine,
                      { backgroundColor: shade(base, 55) },
                    ]}
                  />
                  {isBottom ? (
                    <View style={styles.pearls} pointerEvents="none">
                      <View style={[styles.pearl, styles.pearlDark, { marginBottom: 1 }]} />
                      <View style={[styles.pearl, styles.pearlDark, styles.pearlLg]} />
                      <View style={[styles.pearl, styles.pearlLight, { marginBottom: 4 }]} />
                      <View style={[styles.pearl, styles.pearlDark]} />
                      <View style={[styles.pearl, styles.pearlLight, styles.pearlLg]} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.cupShadow} />
      </Animated.View>
    </Pressable>
  );
}

export const Tube = memo(TubeComponent, (prev, next) => {
  if (
    prev.capacity !== next.capacity ||
    prev.index !== next.index ||
    prev.selected !== next.selected ||
    prev.hinted !== next.hinted ||
    prev.vialSkinId !== next.vialSkinId ||
    prev.paletteId !== next.paletteId ||
    prev.rareSkin !== next.rareSkin ||
    prev.tiltDir !== next.tiltDir ||
    prev.hideTopSegments !== next.hideTopSegments ||
    prev.disabled !== next.disabled ||
    prev.onSelect !== next.onSelect ||
    prev.onLayoutTube !== next.onLayoutTube
  ) {
    return false;
  }
  if (prev.tube.length !== next.tube.length) return false;
  for (let i = 0; i < prev.tube.length; i++) {
    if (prev.tube[i] !== next.tube[i]) return false;
  }
  return true;
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginHorizontal: 4,
    paddingTop: CUP_STRAW_H * 0.35,
  },
  hinted: {
    shadowColor: BOBA.mango,
    shadowOpacity: 0.95,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  straw: {
    position: 'absolute',
    top: 0,
    width: 9,
    height: CUP_STRAW_H + 8,
    borderRadius: 3,
    backgroundColor: BOBA.matcha,
    transform: [{ rotate: '7deg' }],
    zIndex: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cap: {
    width: TUBE_W + 6,
    height: CUP_CAP_H,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#d5dee8',
    marginBottom: -4,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  capGold: {
    backgroundColor: '#e8b84a',
  },
  capDone: {
    backgroundColor: '#8fd18a',
  },
  capHole: {
    width: 10,
    height: 6,
    borderRadius: 2,
    backgroundColor: BOBA.ink,
  },
  capHoleGold: {
    borderWidth: 1,
    borderColor: '#f0d070',
  },
  rim: {
    width: TUBE_W + 4,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d8e0e8',
    zIndex: 4,
    marginBottom: -1,
  },
  rimGold: {
    backgroundColor: '#d4a017',
  },
  glass: {
    width: TUBE_W,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,248,240,0.12)',
  },
  glassShine: {
    position: 'absolute',
    left: 7,
    top: 8,
    bottom: 16,
    width: 7,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
    zIndex: 4,
  },
  inner: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
    paddingHorizontal: 3,
    paddingBottom: 4,
  },
  emptySegment: {
    height: SEGMENT_H,
  },
  segment: {
    width: '100%',
    overflow: 'hidden',
  },
  segmentBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  segmentFill: {
    ...StyleSheet.absoluteFill,
    opacity: 0.94,
  },
  segmentShine: {
    position: 'absolute',
    left: 6,
    top: 2,
    bottom: 2,
    width: 6,
    borderRadius: 4,
    opacity: 0.32,
  },
  pearls: {
    position: 'absolute',
    left: 4,
    right: 4,
    bottom: 2,
    height: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    zIndex: 3,
  },
  pearl: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pearlLg: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pearlDark: {
    backgroundColor: '#1a1008',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pearlLight: {
    backgroundColor: '#f3eee6',
    borderWidth: 0.5,
    borderColor: 'rgba(90,70,50,0.2)',
  },
  cupShadow: {
    width: TUBE_W * 0.72,
    height: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(50,24,10,0.28)',
    marginTop: 2,
  },
});
