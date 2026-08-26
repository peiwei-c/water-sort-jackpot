import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import {
  useGameStore,
  MAX_LIVES,
  msUntilNextLife,
  formatRegenCountdown,
} from '../store/gameStore';
import { adsDisabled } from '../services/monetizationGate';
import { APP_NAME } from '../constants/brand';
import { LabManualModal } from './LabManualModal';
import { BobaPill, DockBtn } from './BobaScene';
import { BOBA, FONTS } from '../theme/boba';

export function GameHUD() {
  const level = useGameStore((s) => s.level);
  const coins = useGameStore((s) => s.coins);
  const lives = useGameStore((s) => s.lives);
  const nextLifeAt = useGameStore((s) => s.nextLifeAt);
  const tierLabel = useGameStore((s) => s.tierLabel);
  const refreshLives = useGameStore((s) => s.refreshLives);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (lives >= MAX_LIVES) return;
    const id = setInterval(() => refreshLives(), 1000);
    return () => clearInterval(id);
  }, [lives, refreshLives]);

  const regenMs =
    lives < MAX_LIVES ? msUntilNextLife({ lives, nextLifeAt }) : null;
  const livesLabel =
    regenMs != null
      ? `🧋 ${lives} · ${formatRegenCountdown(regenMs)}`
      : `🧋 ${lives}`;

  return (
    <>
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <Text style={styles.ticket}>Ticket {level}</Text>
          <Pressable
            onPress={() => setShowHelp(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="How to play"
          >
            <Text style={styles.brand}>{APP_NAME}</Text>
          </Pressable>
          <Text style={styles.sub}>{tierLabel}</Text>
        </View>
        <View style={styles.pills}>
          <BobaPill>{livesLabel}</BobaPill>
          <BobaPill mango>💰 {coins}</BobaPill>
        </View>
      </View>

      <LabManualModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

export function GameControls() {
  const undo = useGameStore((s) => s.undo);
  const useExtraTube = useGameStore((s) => s.useExtraTube);
  const requestHint = useGameStore((s) => s.requestHint);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const openSlotMachine = useGameStore((s) => s.openSlotMachine);
  const goHome = useGameStore((s) => s.goHome);
  const extraTubeItems = useGameStore((s) => s.extraTubeItems);
  const adsReady = useGameStore((s) => s.adsReady);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const isNoAdsPurchased = useGameStore((s) => s.isNoAdsPurchased);
  const hintDisabled = !adsReady || isAdLoading;
  const [confirmReset, setConfirmReset] = useState(false);

  const onHintPress = () => {
    if (hintDisabled) {
      useGameStore.setState({
        lastMessage: adsDisabled()
          ? 'Hint unavailable'
          : !adsReady
            ? 'Ads loading…'
            : 'Ad in progress…',
      });
      return;
    }
    void requestHint();
  };

  return (
    <View
      style={[
        styles.controlsWrap,
        !isNoAdsPurchased && styles.controlsWrapBanner,
      ]}
    >
      <View style={styles.dock}>
        <DockBtn emoji="🏠" label="Home" onPress={goHome} />
        <DockBtn emoji="↩️" label="Undo" onPress={undo} />
        <DockBtn
          emoji="💡"
          label="Hint"
          onPress={onHintPress}
          dimmed={hintDisabled}
        />
        <DockBtn
          emoji="🧋"
          label={extraTubeItems > 0 ? `+ Cup ×${extraTubeItems}` : '+ Cup'}
          onPress={useExtraTube}
        />
        <DockBtn emoji="🎰" label="Lucky" onPress={openSlotMachine} prize />
        <DockBtn emoji="🔁" label="Reset" onPress={() => setConfirmReset(true)} />
      </View>

      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReset(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Restart ticket?</Text>
            <Text style={styles.confirmBody}>
              This costs 1 life and clears mid-puzzle progress for this ticket.
            </Text>
            <View style={styles.confirmRow}>
              <Pressable
                style={[styles.confirmBtn, styles.confirmGhost]}
                onPress={() => setConfirmReset(false)}
              >
                <Text style={styles.confirmGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, styles.confirmMain]}
                onPress={() => {
                  setConfirmReset(false);
                  restartLevel();
                }}
              >
                <Text style={styles.confirmMainText}>Restart</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 4,
    zIndex: 2,
    gap: 8,
  },
  hudLeft: {
    flex: 1,
    minWidth: 0,
  },
  ticket: {
    fontFamily: FONTS.ui,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: BOBA.sign,
  },
  brand: {
    fontFamily: FONTS.displaySoft,
    fontSize: 22,
    color: BOBA.cream,
    marginTop: 2,
  },
  sub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,248,240,0.7)',
    marginTop: 2,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  controlsWrap: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    zIndex: 2,
  },
  controlsWrapBanner: {
    paddingBottom: 8,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 20, 24, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 22,
    backgroundColor: BOBA.cream,
  },
  confirmTitle: {
    color: BOBA.ink,
    fontFamily: FONTS.displaySoft,
    fontSize: 22,
    textAlign: 'center',
  },
  confirmBody: {
    color: 'rgba(74,34,28,0.7)',
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmGhost: {
    backgroundColor: '#fff6ee',
  },
  confirmMain: {
    backgroundColor: BOBA.straw,
  },
  confirmGhostText: {
    color: BOBA.ink,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  confirmMainText: {
    color: BOBA.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
});
