import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradientFallback } from './LinearGradientFallback';
import { LAB, COLORS } from '../theme/colors';

/**
 * Branded boot screen (prototype Variant A — Liquid Path).
 * Shown while the game store hydrates from persistence.
 */
export function LoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(12)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const meshA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const meshLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(meshA, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(meshA, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const reveal = Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    // Progress bar uses layout width — not native driver
    const fill = Animated.timing(barWidth, {
      toValue: 1,
      duration: 2200,
      delay: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    pulseLoop.start();
    spinLoop.start();
    meshLoop.start();
    reveal.start();
    fill.start();

    return () => {
      pulseLoop.stop();
      spinLoop.stop();
      meshLoop.stop();
      brandOpacity.stopAnimation();
      brandY.stopAnimation();
      tagOpacity.stopAnimation();
      barWidth.stopAnimation();
    };
  }, [
    pulse,
    spin,
    brandOpacity,
    brandY,
    tagOpacity,
    barWidth,
    meshA,
  ]);

  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const meshShift = meshA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  const barW = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <LinearGradientFallback
      colors={[LAB.benchDeep, LAB.benchMid]}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.stage} accessibilityRole="progressbar" accessibilityLabel="Loading lab">
          <Animated.View
            pointerEvents="none"
            style={[
              styles.meshBlob,
              styles.meshTeal,
              { transform: [{ translateX: meshShift }, { translateY: meshShift }] },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.meshBlob,
              styles.meshGold,
              {
                transform: [
                  {
                    translateX: meshA.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -14],
                    }),
                  },
                ],
              },
            ]}
          />

          <Animated.View style={[styles.orb, { transform: [{ scale: pulse }] }]}>
            <View style={styles.orbInner} />
            <Animated.View
              style={[styles.orbRing, { transform: [{ rotate: spinRotate }] }]}
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.brand,
              {
                opacity: brandOpacity,
                transform: [{ translateY: brandY }],
              },
            ]}
          >
            AquaSort
          </Animated.Text>
          <Animated.Text style={[styles.tag, { opacity: tagOpacity }]}>
            HYDROLOGY LAB
          </Animated.Text>

          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { width: barW }]} />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradientFallback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  meshBlob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.35,
  },
  meshTeal: {
    top: '12%',
    left: '-18%',
    backgroundColor: LAB.glassBright,
  },
  meshGold: {
    bottom: '18%',
    right: '-22%',
    backgroundColor: LAB.reagent,
    opacity: 0.18,
  },
  orb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    backgroundColor: '#1a9e92',
    shadowColor: LAB.glassBright,
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  orbInner: {
    ...StyleSheet.absoluteFill,
    borderRadius: 70,
    backgroundColor: 'rgba(126, 227, 214, 0.45)',
  },
  orbRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderTopColor: 'transparent',
  },
  brand: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  tag: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3.2,
  },
  barTrack: {
    width: 160,
    height: 4,
    marginTop: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: LAB.glassBright,
  },
});
