import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { BANNER_HEIGHT } from '../services/AdManager';
import { LAB } from '../theme/colors';

/**
 * Persistent bottom banner. Hidden when Remove Ads is purchased.
 * Mock renders a placeholder; swap for SDK BannerAd view later.
 */
export function BannerAd() {
  const isNoAdsPurchased = useGameStore((s) => s.isNoAdsPurchased);
  const adsReady = useGameStore((s) => s.adsReady);

  if (isNoAdsPurchased || !adsReady) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.banner}>
        <Text style={styles.label}>AD</Text>
        <Text style={styles.copy}>Banner placeholder · mock</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BANNER_HEIGHT,
    zIndex: 20,
    backgroundColor: 'rgba(4, 18, 24, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(126, 227, 214, 0.25)',
  },
  banner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  label: {
    color: LAB.reagent,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.2,
    borderWidth: 1,
    borderColor: LAB.reagent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  copy: {
    color: LAB.label,
    fontSize: 12,
    fontWeight: '600',
  },
});
