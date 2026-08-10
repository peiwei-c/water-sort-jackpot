import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { COLORS, LAB } from '../theme/colors';
import { LabManualModal } from './LabManualModal';

export function GameHUD() {
  const level = useGameStore((s) => s.level);
  const coins = useGameStore((s) => s.coins);
  const undoItems = useGameStore((s) => s.undoItems);
  const extraTubeItems = useGameStore((s) => s.extraTubeItems);
  const freeSpins = useGameStore((s) => s.freeSpins);
  const rareSkinUnlocked = useGameStore((s) => s.rareSkinUnlocked);
  const tierLabel = useGameStore((s) => s.tierLabel);
  const goHome = useGameStore((s) => s.goHome);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <View style={styles.hud}>
        <View>
          <Text style={styles.labEyebrow}>HYDROLOGY LAB</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>AquaSort Lab</Text>
            <Pressable
              style={styles.infoBtn}
              onPress={() => setShowHelp(true)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="How to play"
            >
              <Text style={styles.infoBtnText}>i</Text>
            </Pressable>
          </View>
          <Text style={styles.level}>
            Station {level} · {tierLabel}
          </Text>
        </View>
        <View style={styles.hudRight}>
          <Pressable
            style={styles.pathBtn}
            onPress={goHome}
            accessibilityRole="button"
            accessibilityLabel="Back to path"
          >
            <Text style={styles.pathBtnText}>Path</Text>
          </Pressable>
          <View style={styles.stats}>
            <Stat label="🪙" value={coins} />
            <Stat label="↺" value={undoItems} />
            <Stat label="🧪" value={extraTubeItems} />
            {freeSpins > 0 ? <Stat label="🎰" value={freeSpins} /> : null}
            {rareSkinUnlocked ? <Text style={styles.skin}>👑</Text> : null}
          </View>
        </View>
      </View>

      <LabManualModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <View style={[styles.stat, warn && styles.statWarn]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, warn && styles.statValueWarn]}>{value}</Text>
    </View>
  );
}

export function GameControls() {
  const undo = useGameStore((s) => s.undo);
  const useExtraTube = useGameStore((s) => s.useExtraTube);
  const requestHint = useGameStore((s) => s.requestHint);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const openSlotMachine = useGameStore((s) => s.openSlotMachine);
  const extraTubeItems = useGameStore((s) => s.extraTubeItems);
  const movesLeft = useGameStore((s) => s.movesLeft);
  const moveLimit = useGameStore((s) => s.moveLimit);
  const adsReady = useGameStore((s) => s.adsReady);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const isNoAdsPurchased = useGameStore((s) => s.isNoAdsPurchased);
  const outOfTubes = extraTubeItems <= 0;
  const movesLow = movesLeft <= 3;
  const hintDisabled = !adsReady || isAdLoading;
  const [confirmReset, setConfirmReset] = useState(false);

  const onHintPress = () => {
    if (hintDisabled) {
      useGameStore.setState({
        lastMessage: !adsReady ? 'Ads loading…' : 'Ad in progress…',
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
      <View style={[styles.movesBar, movesLow && styles.movesBarWarn]}>
        <Text style={styles.movesLabel}>Moves left</Text>
        <Text style={[styles.movesValue, movesLow && styles.movesValueWarn]}>
          {movesLeft}
          <Text style={styles.movesLimit}> / {moveLimit}</Text>
        </Text>
      </View>
      <View style={styles.controls}>
        <ControlBtn label="Undo" onPress={undo} />
        <ControlBtn
          label="Hint"
          onPress={onHintPress}
          disabled={false}
          dimmed={hintDisabled}
        />
        <View style={styles.tubeBtnCol}>
          {outOfTubes ? (
            <Text style={styles.tubeHint}>
              Earn tubes in Centrifuge or watch an ad
            </Text>
          ) : null}
          <ControlBtn
            label="+🧪"
            onPress={useExtraTube}
            accessibilityLabel="Add tube"
          />
        </View>
        <ControlBtn label="Centrifuge" onPress={openSlotMachine} accent />
        <ControlBtn label="Reset" onPress={() => setConfirmReset(true)} />
      </View>

      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReset(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Restart station?</Text>
            <Text style={styles.confirmBody}>
              Mid-puzzle progress for this station will be cleared.
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

function ControlBtn({
  label,
  onPress,
  accent,
  disabled,
  dimmed,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        accent && styles.btnAccent,
        (disabled || dimmed) && styles.btnDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text
        style={[
          styles.btnText,
          accent && styles.btnTextDark,
          (disabled || dimmed) && styles.btnTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 2,
  },
  labEyebrow: {
    color: LAB.label,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  infoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: LAB.glassBright,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LAB.glassDim,
  },
  infoBtnText: {
    color: LAB.glassBright,
    fontWeight: '800',
    fontSize: 13,
    fontStyle: 'italic',
  },
  level: {
    color: LAB.label,
    marginTop: 2,
    fontWeight: '600',
    fontSize: 13,
  },
  hudRight: {
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '55%',
  },
  pathBtn: {
    backgroundColor: LAB.reagent,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 150, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pathBtnText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 13,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  stat: {
    backgroundColor: LAB.glassDim,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
  },
  statWarn: {
    backgroundColor: 'rgba(232, 93, 76, 0.22)',
    borderColor: LAB.hazard,
  },
  statLabel: {
    fontSize: 13,
    color: LAB.label,
    fontWeight: '600',
  },
  statValue: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  statValueWarn: {
    color: '#FF8A94',
  },
  skin: {
    fontSize: 18,
  },
  controlsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
    zIndex: 2,
  },
  controlsWrapBanner: {
    paddingBottom: 12,
  },
  movesBar: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  movesBarWarn: {
    backgroundColor: 'rgba(232, 93, 76, 0.22)',
    borderColor: LAB.hazard,
  },
  movesLabel: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  movesValue: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 20,
  },
  movesValueWarn: {
    color: '#FF8A94',
  },
  movesLimit: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
  },
  tubeBtnCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    maxWidth: 120,
  },
  tubeHint: {
    color: LAB.reagent,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  btn: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 72,
    alignItems: 'center',
  },
  btnAccent: {
    backgroundColor: LAB.reagent,
    borderColor: 'rgba(255, 230, 150, 0.4)',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  btnTextDark: {
    color: '#1A1200',
  },
  btnTextDisabled: {
    color: LAB.label,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 24, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 22,
    backgroundColor: LAB.benchDeep,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.32)',
  },
  confirmTitle: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 22,
    textAlign: 'center',
  },
  confirmBody: {
    color: COLORS.textMuted,
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
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.22)',
  },
  confirmMain: {
    backgroundColor: LAB.hazard,
  },
  confirmGhostText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  confirmMainText: {
    color: '#FFF8F6',
    fontWeight: '800',
    fontSize: 15,
  },
});
