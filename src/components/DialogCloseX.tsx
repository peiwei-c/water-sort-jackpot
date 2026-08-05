import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { LAB } from '../theme/colors';

/** Top-right × control for lab info dialogs. */
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
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.35)',
  },
  text: {
    color: LAB.glassBright,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -1,
  },
});
