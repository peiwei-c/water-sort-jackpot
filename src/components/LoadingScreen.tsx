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
import { BobaScene } from './BobaScene';
import { APP_NAME, APP_TAGLINE } from '../constants/brand';
import { BOBA, FONTS } from '../theme/boba';
import { ANDROID_TOP_INSET } from '../theme/androidTopInset';

function BootCup() {
  return (
    <View style={styles.cup} accessibilityElementsHidden>
      <View style={styles.straw} />
      <View style={styles.lid}>
        <View style={styles.lidHole} />
      </View>
      <View style={styles.rim} />
      <View style={styles.body}>
        <View style={styles.bodyShine} />
        <View style={[styles.layer, { backgroundColor: BOBA.straw, flex: 1 }]} />
        <View style={[styles.layer, { backgroundColor: BOBA.mango, height: 32 }]} />
        <View style={styles.pearls} pointerEvents="none">
          <View style={[styles.pearl, styles.pearlDark]} />
          <View style={[styles.pearl, styles.pearlLg]} />
          <View style={[styles.pearl, styles.pearlLight]} />
          <View style={[styles.pearl, styles.pearlDark]} />
          <View style={[styles.pearl, styles.pearlLg, styles.pearlLight]} />
        </View>
      </View>
    </View>
  );
}

/**
 * Shop boot screen while persistence and fonts hydrate.
 */
export function LoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(12)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const reveal = Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 640,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 640,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]);

    const fill = Animated.timing(barWidth, {
      toValue: 1,
      duration: 2200,
      delay: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    pulseLoop.start();
    reveal.start();
    fill.start();

    return () => {
      pulseLoop.stop();
      brandOpacity.stopAnimation();
      brandY.stopAnimation();
      tagOpacity.stopAnimation();
      barWidth.stopAnimation();
    };
  }, [pulse, brandOpacity, brandY, tagOpacity, barWidth]);

  const barW = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 168],
  });

  return (
    <BobaScene>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View
          style={styles.stage}
          accessibilityRole="progressbar"
          accessibilityLabel={`Loading ${APP_NAME}`}
        >
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <BootCup />
          </Animated.View>

          <Animated.Text
            style={[
              styles.sign,
              {
                opacity: brandOpacity,
                transform: [{ translateY: brandY }],
              },
            ]}
          >
            {APP_TAGLINE}
          </Animated.Text>
          <Animated.Text
            style={[
              styles.brand,
              {
                opacity: brandOpacity,
                transform: [{ translateY: brandY }],
              },
            ]}
          >
            {APP_NAME}
          </Animated.Text>
          <Animated.Text style={[styles.kicker, { opacity: tagOpacity }]}>
            Opening the shop…
          </Animated.Text>

          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { width: barW }]} />
          </View>
        </View>
      </SafeAreaView>
    </BobaScene>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: ANDROID_TOP_INSET,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  cup: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 10,
  },
  straw: {
    position: 'absolute',
    top: 0,
    width: 11,
    height: 28,
    borderRadius: 4,
    backgroundColor: BOBA.matcha,
    transform: [{ rotate: '8deg' }],
    zIndex: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  lid: {
    width: 86,
    height: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#dfe6ee',
    marginBottom: -5,
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
  },
  lidHole: {
    width: 12,
    height: 7,
    borderRadius: 3,
    backgroundColor: BOBA.ink,
  },
  rim: {
    width: 82,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8eef4',
    zIndex: 4,
    marginBottom: -2,
  },
  body: {
    width: 78,
    height: 108,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,248,240,0.35)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bodyShine: {
    position: 'absolute',
    top: 10,
    left: 8,
    width: 10,
    height: 46,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
    zIndex: 2,
  },
  layer: {
    width: '100%',
  },
  pearls: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 3,
  },
  pearl: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5a3218',
  },
  pearlLg: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginBottom: 2,
  },
  pearlDark: {
    backgroundColor: '#3a1c10',
  },
  pearlLight: {
    backgroundColor: '#7a4a28',
  },
  sign: {
    textAlign: 'center',
    fontFamily: FONTS.uiBlack,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: BOBA.sign,
  },
  brand: {
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: 40,
    lineHeight: 44,
    color: BOBA.cream,
    marginTop: 6,
  },
  kicker: {
    textAlign: 'center',
    fontFamily: FONTS.body,
    fontSize: 15,
    color: 'rgba(255,248,240,0.78)',
    marginTop: 8,
  },
  barTrack: {
    width: 168,
    height: 8,
    marginTop: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(255,248,240,0.22)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BOBA.straw,
  },
});
