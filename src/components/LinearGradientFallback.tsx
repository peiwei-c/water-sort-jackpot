import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';

/**
 * Lightweight gradient stand-in so we don't require expo-linear-gradient.
 * Uses layered translucent overlays over the base color.
 */
type Props = {
  colors: string[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function LinearGradientFallback({ colors, style, children }: Props) {
  const base = colors[0] ?? '#0B1F33';
  const top = colors[1] ?? colors[0];

  return (
    <View style={[styles.root, { backgroundColor: base }, style]}>
      <View
        pointerEvents="none"
        style={[styles.wash, { backgroundColor: top, opacity: 0.55 }]}
      />
      <View
        pointerEvents="none"
        style={[styles.blob, { backgroundColor: colors[0], opacity: 0.35 }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  wash: {
    ...StyleSheet.absoluteFill,
    top: '35%',
  },
  blob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -60,
    right: -40,
  },
});
