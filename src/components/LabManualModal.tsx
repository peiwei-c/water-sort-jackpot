import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { COLORS, LAB } from '../theme/colors';
import { DialogCloseX } from './DialogCloseX';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LabManualModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.helpBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.helpCard}>
          <DialogCloseX onPress={onClose} />
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.helpScroll}
          >
            <Text style={styles.helpTitle}>Lab Manual</Text>

            <Text style={styles.helpHeading}>Goal</Text>
            <Text style={styles.helpBody}>
              Sort the colored reagents so every vial is either empty or filled
              with one color only.
            </Text>

            <Text style={styles.helpHeading}>Pouring</Text>
            <Text style={styles.helpBody}>
              1. Tap a vial to pick it up.{'\n'}
              2. Tap another vial to pour.{'\n'}
              You can pour into any vial that still has space. Matching colors
              aren’t required. Contiguous top segments of the same color pour
              together until the target is full.
            </Text>

            <Text style={styles.helpHeading}>Moves</Text>
            <Text style={styles.helpBody}>
              Each successful pour costs 1 move. Run out of moves and you’ll need
              to retry or watch an ad for more.
            </Text>

            <Text style={styles.helpHeading}>Lives</Text>
            <Text style={styles.helpBody}>
              You start with 5 lives. Starting or retrying a station costs 1 life.
              Continuing a saved mid-puzzle run does not. Lives refill one every
              30 minutes, or watch an ad for +1 life when you’re out.
            </Text>

            <Text style={styles.helpHeading}>Missions</Text>
            <Text style={styles.helpBody}>
              Open Missions from the path for daily and weekly tasks. Clear
              stations, spin the Centrifuge, or watch a rewarded ad to fill the
              bars — then claim coins, lives, undos, vials, and free spins.
            </Text>

            <Text style={styles.helpHeading}>Saving</Text>
            <Text style={styles.helpBody}>
              Mid-puzzle progress is saved when you leave for Path or when the
              app goes to the background — kill the app and you’ll pick up at the
              same flask.
            </Text>

            <Text style={styles.helpHeading}>Controls</Text>
            <Text style={styles.helpBody}>
              Path (top) — return to the reagent path.{'\n'}
              Undo — reverse your last pour (uses an undo item, or watch an
              ad).{'\n'}
              Hint — watch an ad to highlight a valid pour.{'\n'}
              +🧪 — add an empty vial from your inventory. If you’re out, watch
              an ad or win tubes from the Centrifuge.{'\n'}
              Centrifuge — spend coins on the lab spinner.{'\n'}
              Reset — restart the current station (costs 1 life; clears saved
              progress).
            </Text>

            <Text style={styles.helpHeading}>Coins</Text>
            <Text style={styles.helpBody}>
              Clear a station to earn coins. Coins power the Centrifuge — bet
              them on paylines to win more coins and items. The Store sells
              liquid color themes, vial cosmetics, and exclusive harder paths
              (fewer moves). You can always play the free Standard Lab path and
              Classic Reagents theme.
            </Text>

            <Pressable style={styles.helpClose} onPress={onClose} hitSlop={8}>
              <Text style={styles.helpCloseText}>Got it</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  helpBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 24, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  helpCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 20,
    backgroundColor: LAB.benchMid,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.32)',
    overflow: 'hidden',
  },
  helpScroll: {
    padding: 20,
    paddingTop: 28,
  },
  helpTitle: {
    color: LAB.reagent,
    fontWeight: '800',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
    paddingHorizontal: 28,
  },
  helpHeading: {
    color: LAB.glassBright,
    fontWeight: '800',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  helpBody: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.92,
  },
  helpClose: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: LAB.glassBright,
  },
  helpCloseText: {
    color: '#062018',
    fontWeight: '800',
    fontSize: 14,
  },
});
