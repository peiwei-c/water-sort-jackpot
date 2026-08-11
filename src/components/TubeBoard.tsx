import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Tube, SEGMENT_H, TUBE_GLASS_PAD } from './Tube';
import type { Tube as TubeData } from '../engines/WaterSortEngine';
import { waterColor, PALETTE_DEFAULT } from '../engines/StoreCatalog';
import { useGameStore, POUR_ANIM_MS } from '../store/gameStore';

type Layout = { x: number; y: number; width: number; height: number };

type Props = {
  tubes: TubeData[];
  capacity: number;
  selectedTube: number | null;
  vialSkinId?: string;
  paletteId?: string;
  rareSkin?: boolean;
  onSelect: (index: number) => void;
};

function mouthPoint(layout: Layout, capacity: number, fillCount: number) {
  const rimH = 10;
  const glassTop = layout.y + rimH - 3;
  const glassH = capacity * SEGMENT_H + TUBE_GLASS_PAD;
  const waterTop = glassTop + glassH - fillCount * SEGMENT_H;
  return {
    x: layout.x + layout.width / 2,
    y: Math.min(waterTop + 4, glassTop + 12),
  };
}

export function TubeBoard({
  tubes,
  capacity,
  selectedTube,
  vialSkinId,
  paletteId = PALETTE_DEFAULT,
  rareSkin,
  onSelect,
}: Props) {
  const pourAnim = useGameStore((s) => s.pourAnim);
  const hintHighlight = useGameStore((s) => s.hintHighlight);
  const completePourAnim = useGameStore((s) => s.completePourAnim);
  const layouts = useRef<Record<number, Layout>>({});

  const [displayTubes, setDisplayTubes] = useState(tubes);
  const [stream, setStream] = useState<{
    midX: number;
    midY: number;
    length: number;
    angle: number;
    color: string;
    dx: number;
    dy: number;
    startX: number;
    startY: number;
  } | null>(null);

  const ribbon = useRef(new Animated.Value(0)).current;
  const droplet = useRef(new Animated.Value(0)).current;
  const animToken = useRef(0);

  useEffect(() => {
    if (!pourAnim) {
      setDisplayTubes(tubes);
      setStream(null);
      return;
    }

    const token = ++animToken.current;
    setDisplayTubes(pourAnim.before.map((t) => [...t]));
    ribbon.setValue(0);
    droplet.setValue(0);

    const fromL = layouts.current[pourAnim.fromIndex];
    const toL = layouts.current[pourAnim.toIndex];
    if (fromL && toL) {
      const a = mouthPoint(
        fromL,
        capacity,
        pourAnim.before[pourAnim.fromIndex].length,
      );
      const b = mouthPoint(
        toL,
        capacity,
        pourAnim.before[pourAnim.toIndex].length,
      );
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.max(28, Math.sqrt(dx * dx + dy * dy));
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      setStream({
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
        length,
        angle,
        color: waterColor(paletteId, pourAnim.color),
        dx,
        dy,
        startX: a.x,
        startY: a.y,
      });
    }

    Animated.parallel([
      Animated.timing(ribbon, {
        toValue: 1,
        duration: POUR_ANIM_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(droplet, {
        toValue: 1,
        duration: POUR_ANIM_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // Single end-of-pour update (avoid per-unit React remounts on the JS thread).
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        if (animToken.current !== token) return;
        setDisplayTubes(pourAnim.after.map((t) => [...t]));
        setStream(null);
        completePourAnim();
      }, POUR_ANIM_MS + 50),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [pourAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pourAnim) setDisplayTubes(tubes);
  }, [tubes, pourAnim]);

  const tiltFor = (index: number): -1 | 0 | 1 => {
    if (!pourAnim || index !== pourAnim.fromIndex) return 0;
    return pourAnim.toIndex > pourAnim.fromIndex ? 1 : -1;
  };

  const ribbonOpacity = ribbon.interpolate({
    inputRange: [0, 0.12, 0.8, 1],
    outputRange: [0, 0.95, 0.95, 0],
  });
  const ribbonScaleX = ribbon.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0.15, 1, 1, 0.2],
  });

  return (
    <View style={styles.board}>
      {displayTubes.map((tube, index) => (
        <Tube
          key={`tube-${index}`}
          tube={tube}
          capacity={capacity}
          selected={selectedTube === index && !pourAnim}
          hinted={
            !!hintHighlight &&
            (hintHighlight.fromIndex === index ||
              hintHighlight.toIndex === index)
          }
          rareSkin={rareSkin}
          vialSkinId={vialSkinId}
          paletteId={paletteId}
          tiltDir={tiltFor(index)}
          disabled={!!pourAnim}
          onPress={() => onSelect(index)}
          onLayout={(layout) => {
            layouts.current[index] = layout;
          }}
        />
      ))}

      {stream && pourAnim ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={{
              position: 'absolute',
              left: stream.midX - stream.length / 2,
              top: stream.midY - 4,
              width: stream.length,
              height: 8,
              borderRadius: 4,
              backgroundColor: stream.color,
              opacity: ribbonOpacity,
              transform: [
                { rotate: `${stream.angle}deg` },
                { scaleX: ribbonScaleX },
              ],
              shadowColor: stream.color,
              shadowOpacity: 0.8,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              left: stream.startX - 7,
              top: stream.startY - 7,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: stream.color,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.35)',
              opacity: droplet.interpolate({
                inputRange: [0, 0.08, 0.85, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: droplet.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, stream.dx],
                  }),
                },
                {
                  translateY: droplet.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, stream.dy],
                  }),
                },
                {
                  scale: droplet.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.55, 1.2, 0.65],
                  }),
                },
              ],
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 28,
    gap: 4,
    position: 'relative',
    overflow: 'visible',
  },
});
