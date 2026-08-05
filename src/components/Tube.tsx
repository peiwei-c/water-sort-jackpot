import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import type { Tube as TubeData } from '../engines/WaterSortEngine';
import { LAB, WATER_PALETTE } from '../theme/colors';

export const SEGMENT_H = 30;
export const TUBE_W = 54;
export const TUBE_GLASS_PAD = 14;

type Props = {
  tube: TubeData;
  capacity: number;
  selected: boolean;
  rareSkin?: boolean;
  /** Tilt direction while pouring: -1 left, 1 right, 0 none */
  tiltDir?: -1 | 0 | 1;
  /** Hide top N segments during pour (already streamed out) */
  hideTopSegments?: number;
  disabled?: boolean;
  onPress: () => void;
  onLayout?: (layout: { x: number; y: number; width: number; height: number }) => void;
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

export function Tube({
  tube,
  capacity,
  selected,
  rareSkin,
  tiltDir = 0,
  hideTopSegments = 0,
  disabled,
  onPress,
  onLayout,
}: Props) {
  const lift = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const levelPulse = useRef(new Animated.Value(1)).current;

  const visibleTube = useMemo(() => {
    if (hideTopSegments <= 0) return tube;
    return tube.slice(0, Math.max(0, tube.length - hideTopSegments));
  }, [tube, hideTopSegments]);

  useEffect(() => {
    Animated.spring(lift, {
      toValue: selected ? -18 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start();
  }, [selected, lift]);

  useEffect(() => {
    Animated.timing(tilt, {
      toValue: tiltDir * 28,
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

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      onLayout={(e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        onLayout?.({ x, y, width, height });
      }}
    >
      <Animated.View
        style={[
          styles.wrap,
          rareSkin && styles.rareSkin,
          selected && styles.selected,
          {
            transform: [
              { translateY: lift },
              { rotate: tilt.interpolate({
                  inputRange: [-28, 0, 28],
                  outputRange: ['-28deg', '0deg', '28deg'],
                }) },
              { scale: levelPulse },
            ],
          },
        ]}
      >
        {/* Rim / lip */}
        <View style={styles.rimOuter}>
          <View style={styles.rimInner} />
          <View style={styles.rimHighlight} />
        </View>

        {/* Glass body */}
        <View style={[styles.glass, { height: glassH }]}>
          {/* Left shadow for cylinder depth */}
          <View style={styles.glassShadowL} />
          {/* Right highlight edge */}
          <View style={styles.glassShadowR} />
          {/* Specular streak */}
          <View style={styles.specular} />

          <View style={styles.inner}>
            {Array.from({ length: emptySlots }).map((_, i) => (
              <View key={`e-${i}`} style={styles.emptySegment} />
            ))}
            {[...visibleTube].reverse().map((colorId, i) => {
              const isTop = i === 0;
              const base = WATER_PALETTE[colorId] ?? '#888';
              return (
                <View
                  key={`c-${visibleTube.length - 1 - i}-${colorId}`}
                  style={[styles.segment, { height: SEGMENT_H }]}
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
                  {/* Liquid highlight band */}
                  <View
                    style={[
                      styles.segmentShine,
                      { backgroundColor: shade(base, 55) },
                    ]}
                  />
                  {/* Darker right edge */}
                  <View
                    style={[
                      styles.segmentShade,
                      { backgroundColor: shade(base, -40) },
                    ]}
                  />
                  {isTop ? (
                    <View
                      style={[
                        styles.meniscus,
                        { backgroundColor: shade(base, 30) },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Bottom glass curve shading */}
          <View style={styles.glassBottomShade} />
        </View>

        {/* Base foot */}
        <View style={styles.base}>
          <View style={styles.baseHighlight} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  selected: {
    shadowColor: LAB.glassBright,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  rareSkin: {
    borderRadius: 8,
  },
  rimOuter: {
    width: TUBE_W + 12,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(126, 227, 214, 0.45)',
    marginBottom: -3,
    zIndex: 3,
    borderWidth: 1,
    borderColor: 'rgba(200, 255, 245, 0.55)',
    overflow: 'hidden',
  },
  rimInner: {
    ...StyleSheet.absoluteFill,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(6, 28, 34, 0.45)',
  },
  rimHighlight: {
    position: 'absolute',
    top: 1,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  glass: {
    width: TUBE_W,
    borderWidth: 2,
    borderColor: 'rgba(126, 227, 214, 0.55)',
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: 'rgba(126, 227, 214, 0.08)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  glassShadowL: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(0,20,40,0.22)',
    zIndex: 2,
  },
  glassShadowR: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.14)',
    zIndex: 2,
  },
  specular: {
    position: 'absolute',
    left: 11,
    top: 8,
    bottom: 18,
    width: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.28)',
    zIndex: 4,
  },
  glassBottomShade: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 0,
    height: 16,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: 'rgba(0,15,30,0.18)',
    zIndex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  emptySegment: {
    height: SEGMENT_H,
  },
  segment: {
    width: '100%',
    overflow: 'hidden',
  },
  segmentFill: {
    ...StyleSheet.absoluteFill,
    opacity: 0.92,
  },
  segmentShine: {
    position: 'absolute',
    left: 8,
    top: 3,
    bottom: 3,
    width: 7,
    borderRadius: 4,
    opacity: 0.35,
  },
  segmentShade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 8,
    opacity: 0.28,
  },
  meniscus: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 0,
    height: 4,
    borderRadius: 2,
    opacity: 0.55,
  },
  base: {
    width: TUBE_W + 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(126, 227, 214, 0.22)',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(200, 255, 245, 0.3)',
    overflow: 'hidden',
  },
  baseHighlight: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
