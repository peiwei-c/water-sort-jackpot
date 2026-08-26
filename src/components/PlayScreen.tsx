import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { TubeBoard } from './TubeBoard';
import { GameHUD, GameControls } from './GameHUD';
import { useGameStore } from '../store/gameStore';
import { BobaScene, WoodCounter } from './BobaScene';
import { BOBA, FONTS } from '../theme/boba';

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
  const movesLeft = useGameStore((s) => s.movesLeft);
  const tubesCount = tubes.length;

  return (
    <BobaScene>
      <View style={styles.playRoot}>
        <GameHUD />
        <View style={styles.stage}>
          <WoodCounter
            overflowVisible
            menu={`Now serving · ${tubesCount} drinks · ${movesLeft} pours`}
          >
            <TubeBoard
              tubes={tubes}
              capacity={capacity}
              selectedTube={selectedTube}
              vialSkinId={equippedVialId}
              paletteId={equippedPaletteId}
              rareSkin={rareSkinUnlocked}
              onSelect={selectTube}
            />
          </WoodCounter>
          <Text style={styles.hint}>
            {lastMessage || 'Pour to finish the ticket'}
          </Text>
        </View>
        <GameControls />
      </View>
    </BobaScene>
  );
}

const styles = StyleSheet.create({
  playRoot: {
    flex: 1,
  },
  stage: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 10,
    minHeight: 0,
  },
  hint: {
    textAlign: 'center',
    color: BOBA.ink,
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 8,
    minHeight: 18,
  },
});
