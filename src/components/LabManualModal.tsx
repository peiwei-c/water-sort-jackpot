import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { DialogCloseX } from './DialogCloseX';
import { MAX_LIVES } from '../engines/LivesEngine';

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
            <Text style={styles.helpTitle}>How to play</Text>

            <Text style={styles.helpHeading}>Goal</Text>
            <Text style={styles.helpBody}>
              Sort the drinks so every cup is either empty or filled with one
              color only.
            </Text>

            <Text style={styles.helpHeading}>Pouring</Text>
            <Text style={styles.helpBody}>
              1. Tap a cup to pick it up.{'\n'}
              2. Tap another cup to pour.{'\n'}
              You can pour into any cup that still has space. Matching colors
              aren’t required. Contiguous top segments of the same color pour
              together until the target is full.
            </Text>

            <Text style={styles.helpHeading}>Pours</Text>
            <Text style={styles.helpBody}>
              Each successful pour costs 1 move. Run out of pours and you’ll need
              to retry or watch an ad for more.
            </Text>

            <Text style={styles.helpHeading}>Lives</Text>
            <Text style={styles.helpBody}>
              You start with {MAX_LIVES} lives. Starting or retrying a ticket costs 1 life.
              Continuing a saved run does not. Lives refill one every
              30 minutes, or watch an ad for +1 life when you’re out.
            </Text>

            <Text style={styles.helpHeading}>Missions</Text>
            <Text style={styles.helpBody}>
              Open Mission from home for daily and weekly tasks. Clear
              tickets, spin Lucky, or watch a rewarded ad to fill the
              bars — then claim coins, lives, undos, cups, and free spins.
            </Text>

            <Text style={styles.helpHeading}>Saving</Text>
            <Text style={styles.helpBody}>
              Mid-puzzle progress is saved when you go Home or when the
              app goes to the background — you’ll pick up at the same ticket.
            </Text>

            <Text style={styles.helpHeading}>Controls</Text>
            <Text style={styles.helpBody}>
              Home — back to the hub.{'\n'}
              Undo — reverse your last pour (uses an undo item, or watch an
              ad).{'\n'}
              Hint — watch an ad to highlight a valid pour.{'\n'}
              + Cup — add an empty cup from your inventory.{'\n'}
              Lucky — spend coins on the spinner.{'\n'}
              Reset — restart the current ticket (costs 1 life).
            </Text>

            <Text style={styles.helpHeading}>Coins</Text>
            <Text style={styles.helpBody}>
              Clear a ticket to earn coins. Coins power Lucky and the Store.
              The Store sells drink colors, cup cosmetics, and harder counters
              (fewer pours). Free house looks are always available.
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
    backgroundColor: 'rgba(42, 20, 24, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  helpCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: 20,
    backgroundColor: '#fff8f0',
    borderWidth: 0,
    overflow: 'hidden',
  },
  helpScroll: {
    padding: 20,
    paddingTop: 28,
  },
  helpTitle: {
    color: '#4A221C',
    fontWeight: '800',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
    paddingHorizontal: 28,
  },
  helpHeading: {
    color: '#F25C78',
    fontWeight: '800',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 4,
  },
  helpBody: {
    color: '#4A221C',
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
    backgroundColor: '#F25C78',
  },
  helpCloseText: {
    color: '#fff8f0',
    fontWeight: '800',
    fontSize: 14,
  },
});
