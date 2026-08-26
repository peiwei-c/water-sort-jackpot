import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { BOBA } from '../theme/boba';

/** Top-right × control for shop dialogs. */
export function DialogCloseX({
  onPress,
  accessibilityLabel = 'Close',
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={styles.btn}
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.text}>×</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BOBA.cream,
    shadowColor: BOBA.peach,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  text: {
    color: BOBA.ink,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -1,
  },
});
