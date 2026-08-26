import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { BOBA, FONTS } from '../theme/boba';

export function BobaScene({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.root, style]}>
      <View pointerEvents="none" style={styles.sky} />
      <View pointerEvents="none" style={styles.wash} />
      <View pointerEvents="none" style={styles.blobA} />
      <View pointerEvents="none" style={styles.blobB} />
      <View pointerEvents="none" style={styles.tiles} />
      <View pointerEvents="none" style={[styles.spark, { left: '18%' }]} />
      <View pointerEvents="none" style={[styles.spark, { left: '50%', top: 18 }]} />
      <View pointerEvents="none" style={[styles.spark, { left: '82%' }]} />
      {children}
    </View>
  );
}

export function WoodCounter({
  menu,
  children,
  overflowVisible,
}: {
  menu: string;
  children: React.ReactNode;
  overflowVisible?: boolean;
}) {
  return (
    <View style={[styles.counter, overflowVisible && styles.counterOpen]}>
      <Text style={styles.menu}>{menu}</Text>
      <View style={styles.counterBody}>{children}</View>
    </View>
  );
}

export function BobaPill({
  children,
  mango,
}: {
  children: React.ReactNode;
  mango?: boolean;
}) {
  return (
    <View style={[styles.pill, mango && styles.pillMango]}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

export function HubTile({
  emoji,
  label,
  onPress,
  variant = 'cream',
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  variant?: 'cream' | 'counter' | 'lucky';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.hubBtn,
        variant === 'counter' && styles.hubCounter,
        variant === 'lucky' && styles.hubLucky,
        pressed && styles.hubPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.hubEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.hubLabel,
          variant === 'counter' && styles.hubLabelOnStraw,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function DockBtn({
  emoji,
  label,
  onPress,
  prize,
  dimmed,
  disabled,
}: {
  emoji?: string;
  label: string;
  onPress: () => void;
  prize?: boolean;
  dimmed?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.dockBtn,
        prize && styles.dockPrize,
        (dimmed || disabled) && styles.dockDim,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      {emoji ? <Text style={styles.dockEmoji}>{emoji}</Text> : null}
      <Text style={[styles.dockLabel, prize && styles.dockPrizeLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BOBA.skyTop,
    overflow: 'hidden',
  },
  sky: {
    ...StyleSheet.absoluteFill,
    backgroundColor: BOBA.skyMid,
  },
  wash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: BOBA.skyFloor,
  },
  blobA: {
    position: 'absolute',
    width: 260,
    height: 180,
    borderRadius: 130,
    backgroundColor: '#ffc078',
    opacity: 0.35,
    top: -20,
    right: -40,
  },
  blobB: {
    position: 'absolute',
    width: 200,
    height: 160,
    borderRadius: 100,
    backgroundColor: '#ff8aa0',
    opacity: 0.28,
    top: 40,
    left: -50,
  },
  tiles: {
    ...StyleSheet.absoluteFill,
    opacity: 0.12,
    backgroundColor: '#f6d2c0',
  },
  spark: {
    position: 'absolute',
    top: 28,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffe08a',
    shadowColor: '#ffb703',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  counter: {
    flex: 1,
    minHeight: 0,
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: BOBA.woodB,
    padding: 6,
    paddingBottom: 10,
    shadowColor: BOBA.woodShadow,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: 'hidden',
  },
  counterOpen: {
    overflow: 'visible',
  },
  menu: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: FONTS.ui,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: BOBA.menuText,
    marginHorizontal: 10,
    marginBottom: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: BOBA.menu,
    borderRadius: 8,
    overflow: 'hidden',
  },
  counterBody: {
    flex: 1,
    minHeight: 0,
  },
  pill: {
    backgroundColor: BOBA.cream,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: BOBA.peach,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  pillMango: {
    backgroundColor: BOBA.mango,
    shadowColor: BOBA.mangoDeep,
  },
  pillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: BOBA.ink,
  },
  hubBtn: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 118,
    borderRadius: 22,
    backgroundColor: BOBA.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8a5a28',
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  hubCounter: {
    backgroundColor: BOBA.straw,
    shadowColor: BOBA.strawDeep,
  },
  hubLucky: {
    backgroundColor: BOBA.mango,
    shadowColor: BOBA.mangoDeep,
  },
  hubPressed: {
    transform: [{ translateY: 3 }],
  },
  hubEmoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  hubLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: BOBA.ink,
  },
  hubLabelOnStraw: {
    color: BOBA.cream,
  },
  dockBtn: {
    flex: 1,
    backgroundColor: BOBA.cream,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: BOBA.peach,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  dockPrize: {
    flex: 1.2,
    backgroundColor: BOBA.straw,
    borderRadius: 18,
    shadowColor: BOBA.strawDeep,
  },
  dockDim: {
    opacity: 0.45,
  },
  dockEmoji: {
    fontSize: 15,
    lineHeight: 18,
  },
  dockLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: BOBA.ink,
  },
  dockPrizeLabel: {
    color: BOBA.cream,
    fontSize: 13,
  },
});
