import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TubeBoard } from './TubeBoard';
import { GameHUD, GameControls } from './GameHUD';
import { useGameStore } from '../store/gameStore';
import { LAB } from '../theme/colors';

/**
 * Play screen owns tube/selection subscriptions so home/store/missions
 * are not re-rendered on every pour.
 */
export function PlayScreen() {
  const tubes = useGameStore((s) => s.tubes);
  const capacity = useGameStore((s) => s.capacity);
  const selectedTube = useGameStore((s) => s.selectedTube);
  const rareSkinUnlocked = useGameStore((s) => s.rareSkinUnlocked);
  const equippedVialId = useGameStore((s) => s.equippedVialId);
  const equippedPaletteId = useGameStore((s) => s.equippedPaletteId);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const selectTube = useGameStore((s) => s.selectTube);

  return (
    <View style={styles.playRoot}>
      <View pointerEvents="none" style={styles.labGrid}>
        {Array.from({ length: 10 }, (_, i) => (
          <View key={`h-${i}`} style={[styles.gridH, { top: 24 + i * 72 }]} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={`v-${i}`}
            style={[styles.gridV, { left: `${12 + i * 15}%` }]}
          />
        ))}
        <View style={styles.glowOrb} />
      </View>

      <GameHUD />
      <View style={styles.stage}>
        <Text style={styles.hint}>
          Select a vial, then pour · Moves are limited
        </Text>
        <View style={styles.bench}>
          <View style={styles.benchHeader}>
            <View style={styles.hazard} />
            <Text style={styles.benchLabel}>SORTING BENCH</Text>
            <View style={styles.hazard} />
          </View>
          <TubeBoard
            tubes={tubes}
            capacity={capacity}
            selectedTube={selectedTube}
            vialSkinId={equippedVialId}
            paletteId={equippedPaletteId}
            rareSkin={rareSkinUnlocked}
            onSelect={selectTube}
          />
          <View style={styles.benchFoot} />
        </View>
        {lastMessage ? (
          <Text style={styles.toast}>{lastMessage}</Text>
        ) : (
          <Text style={styles.toastPlaceholder}> </Text>
        )}
      </View>
      <GameControls />
    </View>
  );
}

const styles = StyleSheet.create({
  playRoot: {
    flex: 1,
  },
  labGrid: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: LAB.grid,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: LAB.grid,
  },
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: LAB.glassBright,
    opacity: 0.07,
    top: 80,
    right: -70,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 12,
  },
  hint: {
    textAlign: 'center',
    color: LAB.label,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  bench: {
    backgroundColor: 'rgba(8, 32, 40, 0.78)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.32)',
    paddingTop: 10,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  benchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  hazard: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: LAB.hazard,
    opacity: 0.65,
  },
  benchLabel: {
    color: LAB.reagent,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.8,
  },
  benchFoot: {
    height: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(126, 227, 214, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.18)',
  },
  toast: {
    textAlign: 'center',
    color: LAB.reagent,
    fontWeight: '700',
    minHeight: 22,
    marginTop: 8,
  },
  toastPlaceholder: {
    minHeight: 22,
    marginTop: 8,
  },
});
