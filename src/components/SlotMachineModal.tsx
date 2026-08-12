import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  ScrollingReelColumn,
  PaylineOverlay,
  LineRail,
  REEL_GAP,
  REEL_WINDOW_W,
  CELL,
  visibleRowsForLines,
  reelWindowHeight,
} from './SlotReel';
import {
  emptyGrid,
  spinCost,
  isFreeSpinBet,
  type SlotGrid,
  type SlotSymbol,
} from '../engines/JackpotEngine';
import { useGameStore } from '../store/gameStore';
import { COLORS, LAB } from '../theme/colors';
import { DialogCloseX } from './DialogCloseX';

const IDLE: SlotGrid = emptyGrid();
const SPIN_ANIM_MS = 1600;

export function SlotMachineModal() {
  const modal = useGameStore((s) => s.modal);
  const coins = useGameStore((s) => s.coins);
  const freeSpins = useGameStore((s) => s.freeSpins);
  const lastSpin = useGameStore((s) => s.lastSpin);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const betPerLine = useGameStore((s) => s.betPerLine);
  const activeLines = useGameStore((s) => s.activeLines);
  const spin = useGameStore((s) => s.spin);
  const closeModal = useGameStore((s) => s.closeModal);
  const watchAd = useGameStore((s) => s.watchAd);
  const claimPendingPayout = useGameStore((s) => s.claimPendingPayout);
  const cycleBet = useGameStore((s) => s.cycleBet);
  const cycleLines = useGameStore((s) => s.cycleLines);

  const visible =
    modal === 'slot_machine' ||
    modal === 'spin_result' ||
    modal === 'ad_free_spins' ||
    modal === 'ad_2x_payout';

  const [spinning, setSpinning] = useState(false);
  const [displayGrid, setDisplayGrid] = useState<SlotGrid>(IDLE);
  /** Clear win glow when the player changes line count mid-result. */
  const [suppressWins, setSuppressWins] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);

  const cost = spinCost(betPerLine, activeLines);
  const usingFreeSpin = freeSpins > 0 && isFreeSpinBet(betPerLine);
  const canAffordSpin = usingFreeSpin || coins >= cost;
  const rowCount = visibleRowsForLines(activeLines);
  const windowH = reelWindowHeight(rowCount);

  const winningLineIds = useMemo(() => {
    const set = new Set<number>();
    if (spinning || suppressWins) return set;
    for (const w of lastSpin?.payout.lineWins ?? []) {
      // Only highlight wins that are still within the selected line count
      if (w.lineId <= activeLines) set.add(w.lineId);
    }
    return set;
  }, [lastSpin, spinning, suppressWins, activeLines]);

  useEffect(() => {
    if (!visible) setShowPaytable(false);
  }, [visible]);

  useEffect(() => {
    if (lastSpin?.grid && !spinning) {
      setDisplayGrid(lastSpin.grid);
    }
  }, [lastSpin, spinning]);

  const columns: [SlotSymbol, SlotSymbol, SlotSymbol][] = [
    [displayGrid[0][0], displayGrid[1][0], displayGrid[2][0]],
    [displayGrid[0][1], displayGrid[1][1], displayGrid[2][1]],
    [displayGrid[0][2], displayGrid[1][2], displayGrid[2][2]],
  ];

  const onSpin = async () => {
    if (spinning || isAdLoading) return;
    setSuppressWins(false);
    setSpinning(true);
    try {
      await spin();
      const result = useGameStore.getState().lastSpin;
      if (result?.grid) {
        setDisplayGrid(result.grid);
      }
      await new Promise((r) => setTimeout(r, SPIN_ANIM_MS));
    } finally {
      setSpinning(false);
    }
  };

  const onCycleLines = (direction: 1 | -1) => {
    setSuppressWins(true);
    cycleLines(direction);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (showPaytable) {
          setShowPaytable(false);
          return;
        }
        closeModal();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.titleRow}>
              <Text style={styles.labEyebrow}>HYDROLOGY LAB</Text>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Centrifuge</Text>
              <Pressable
                style={styles.infoBtn}
                onPress={() => setShowPaytable(true)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Reagent chart"
              >
                <Text style={styles.infoBtnText}>i</Text>
              </Pressable>
            </View>

            <Text style={styles.sub}>
              Dial reagent lines to open more chamber rows. Spin the drum to
              extract coins and lab supplies.
            </Text>

            <View style={styles.wallet}>
              <View style={styles.balancePill}>
                <Text style={styles.balanceLabel}>Reagents</Text>
                <Text style={styles.walletText}>🪙 {coins}</Text>
              </View>
              {freeSpins > 0 ? (
                <View style={styles.balancePill}>
                  <Text style={styles.balanceLabel}>Free runs</Text>
                  <Text style={styles.walletText}>×{freeSpins}</Text>
                </View>
              ) : null}
            </View>

            {/* Centrifuge chamber */}
            <View style={styles.cabinet}>
              <View style={styles.cabinetTop}>
                <View style={styles.hazardBar} />
                <Text style={styles.cabinetBadge}>CENTRIFUGE CHAMBER</Text>
                <View style={styles.hazardBar} />
              </View>

              <View style={styles.machineRow}>
                <LineRail
                  side="left"
                  activeLines={activeLines}
                  winningLineIds={winningLineIds}
                />

                <View style={[styles.reelWindow, { height: windowH }]}>
                  <View style={styles.chamberGlow} />
                  <View style={styles.reelRow}>
                    {columns.map((col, i) => (
                      <View
                        key={`col-${i}-${rowCount}`}
                        style={[styles.reelWrap, i < 2 && { marginRight: REEL_GAP }]}
                      >
                        <ScrollingReelColumn
                          symbols={col}
                          rowCount={rowCount}
                          spinning={spinning}
                          stopDelayMs={i * 220}
                          spinMs={900}
                        />
                      </View>
                    ))}
                  </View>

                  <View pointerEvents="none" style={styles.rowGuides}>
                    {Array.from({ length: rowCount - 1 }, (_, n) => (
                      <View
                        key={n}
                        style={[styles.rowGuide, { top: CELL * (n + 1) }]}
                      />
                    ))}
                  </View>

                  <PaylineOverlay
                    key={`overlay-${activeLines}-${rowCount}`}
                    activeLines={activeLines}
                    winningLineIds={winningLineIds}
                    rowCount={rowCount}
                  />
                </View>

                <LineRail
                  side="right"
                  activeLines={activeLines}
                  winningLineIds={winningLineIds}
                />
              </View>

              <View style={styles.cabinetBottom}>
                <View style={styles.cabinetBolt} />
                <View style={styles.cabinetBolt} />
                <View style={styles.cabinetBolt} />
              </View>
            </View>

            {(modal === 'slot_machine' || modal === 'spin_result') && (
              <View style={styles.controls}>
                <View style={styles.controlBlock}>
                  <Text style={styles.controlLabel}>Dose / line</Text>
                  <View style={styles.stepper}>
                    <Pressable style={styles.stepBtn} onPress={() => cycleBet(-1)}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>{betPerLine}🪙</Text>
                    <Pressable style={styles.stepBtn} onPress={() => cycleBet(1)}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.controlBlock}>
                  <Text style={styles.controlLabel}>Reagent lines</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => onCycleLines(-1)}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>{activeLines}</Text>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => onCycleLines(1)}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.cost}>
              {usingFreeSpin
                ? `Free run · dose ${betPerLine} × ${activeLines} lines (1 / 5 / 10 only)`
                : freeSpins > 0 && !isFreeSpinBet(betPerLine)
                  ? `Free runs need dose 1 / 5 / 10 — or pay ${cost}🪙 at dose 25`
                  : canAffordSpin
                    ? `This run costs ${cost}🪙  (${betPerLine} dose × ${activeLines} lines)`
                    : `Need ${cost}🪙 — balance ${coins}🪙 is too low. Watch an ad for free runs.`}
            </Text>

            {lastMessage && !spinning ? (
              <Text style={styles.message}>{lastMessage}</Text>
            ) : null}

            {lastSpin?.payout.lineWins?.length && !spinning ? (
              <Text style={styles.winsDetail}>
                Hit:{' '}
                {lastSpin.payout.lineWins
                  .map((w) => `${w.lineName}`)
                  .join(' · ')}
              </Text>
            ) : null}

            {isAdLoading ? (
              <ActivityIndicator
                color={LAB.glassBright}
                style={{ marginVertical: 12 }}
              />
            ) : null}

            {modal === 'ad_2x_payout' && !spinning ? (
              <View style={styles.row}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => claimPendingPayout()}
                >
                  <Text style={styles.btnGhostText}>Collect</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnAccent]}
                  onPress={() => watchAd('rewarded_2x_payout')}
                >
                  <Text style={styles.btnWarmText}>Watch Ad · 2×</Text>
                </Pressable>
              </View>
            ) : null}

            {modal === 'ad_free_spins' ? (
              <View style={styles.row}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => closeModal()}
                >
                  <Text style={styles.btnGhostText}>Maybe Later</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnAccent]}
                  onPress={() => watchAd('rewarded_free_spins')}
                >
                  <Text style={styles.btnWarmText}>Watch Ad · 3 Runs</Text>
                </Pressable>
              </View>
            ) : null}

            {(modal === 'slot_machine' || modal === 'spin_result') && (
              <View style={styles.row}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={closeModal}
                  disabled={spinning}
                >
                  <Text style={styles.btnGhostText}>Leave Chamber</Text>
                </Pressable>
                {canAffordSpin ? (
                  <Pressable
                    style={[styles.btn, styles.btnWarm]}
                    onPress={onSpin}
                    disabled={spinning || isAdLoading}
                  >
                    <Text style={styles.btnWarmText}>
                      {spinning
                        ? 'Spinning…'
                        : usingFreeSpin
                          ? `Free Run (×${freeSpins})`
                          : `RUN (−${cost}🪙)`}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.btn, styles.btnAccent]}
                    onPress={() => watchAd('rewarded_free_spins')}
                    disabled={spinning || isAdLoading}
                  >
                    <Text style={styles.btnWarmText}>Watch Ad · 3 Runs</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Overlay dialog inside the same Modal — nested Modals break on iOS/Expo */}
        {showPaytable ? (
          <View style={styles.paytableBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowPaytable(false)}
            />
            <View style={styles.paytableCard}>
              <DialogCloseX onPress={() => setShowPaytable(false)} />
              <Text style={styles.paytableTitle}>Reagent Chart</Text>
              <Text style={styles.paytableRow}>👑👑👑  →  50×</Text>
              <Text style={styles.paytableRow}>🪙🪙🪙  →  8×</Text>
              <Text style={styles.paytableRow}>
                🔄🔄🔄  →  3× + Undo items
              </Text>
              <Text style={styles.paytableRow}>
                🧪🧪🧪  →  3× + Extra Tube
              </Text>
              <Text style={styles.paytableRow}>💧💧💧  →  +1🪙</Text>
              <Text style={styles.paytableRow}>Any pair (not 💧)  →  1×</Text>
              <Text style={styles.paytableNote}>
                × means times your dose per line. Run cost = dose × lines.
              </Text>
              <Pressable
                style={styles.paytableClose}
                onPress={() => setShowPaytable(false)}
                hitSlop={8}
              >
                <Text style={styles.paytableCloseText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 24, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '94%',
    borderRadius: 22,
    backgroundColor: LAB.benchDeep,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    overflow: 'hidden',
  },
  scroll: {
    padding: 18,
  },
  labEyebrow: {
    color: LAB.label,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  infoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LAB.glassBright,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LAB.glassDim,
  },
  infoBtnText: {
    color: LAB.glassBright,
    fontWeight: '800',
    fontSize: 14,
    fontStyle: 'italic',
  },
  paytableBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 18, 24, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  paytableCard: {
    width: '100%',
    maxWidth: 340,
    padding: 20,
    paddingTop: 36,
    borderRadius: 18,
    backgroundColor: LAB.benchMid,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.35)',
    zIndex: 21,
  },
  paytableTitle: {
    color: LAB.reagent,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 1,
    paddingHorizontal: 28,
  },
  paytableRow: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  paytableNote: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 17,
  },
  paytableClose: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: LAB.glassBright,
  },
  paytableCloseText: {
    color: '#062018',
    fontWeight: '800',
    fontSize: 14,
  },
  sub: {
    marginTop: 6,
    marginBottom: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  wallet: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  balanceLabel: {
    color: LAB.label,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  walletText: {
    color: LAB.reagent,
    fontWeight: '800',
    fontSize: 16,
  },
  cabinet: {
    backgroundColor: LAB.benchMid,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.4)',
    marginBottom: 12,
  },
  cabinetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  hazardBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: LAB.hazard,
    opacity: 0.7,
  },
  cabinetBadge: {
    color: LAB.reagent,
    fontWeight: '900',
    letterSpacing: 1.8,
    fontSize: 11,
  },
  machineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelWindow: {
    width: REEL_WINDOW_W,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: LAB.glassBright,
    backgroundColor: '#041018',
    position: 'relative',
  },
  chamberGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(126, 227, 214, 0.06)',
    zIndex: 0,
  },
  reelRow: {
    flexDirection: 'row',
    zIndex: 1,
  },
  reelWrap: {
    overflow: 'hidden',
  },
  rowGuides: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  rowGuide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(126, 227, 214, 0.22)',
  },
  cabinetBottom: {
    marginTop: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(8, 28, 34, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  cabinetBolt: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LAB.glassBright,
    opacity: 0.45,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  controlBlock: {
    flex: 1,
    backgroundColor: LAB.glassDim,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.22)',
  },
  controlLabel: {
    color: LAB.label,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(126, 227, 214, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  stepValue: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 16,
    minWidth: 48,
    textAlign: 'center',
  },
  cost: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  message: {
    color: LAB.reagent,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '600',
  },
  winsDetail: {
    textAlign: 'center',
    color: LAB.glassBright,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnGhost: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.22)',
  },
  btnAccent: {
    backgroundColor: LAB.glassBright,
  },
  btnWarm: {
    backgroundColor: LAB.reagent,
  },
  btnGhostText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  btnWarmText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 14,
  },
});
