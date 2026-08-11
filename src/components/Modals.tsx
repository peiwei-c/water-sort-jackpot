import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  useGameStore,
  LEVEL_COIN_REWARD,
  EXTRA_MOVES_FROM_AD,
  MAX_LEVEL,
  MAX_LIVES,
  SKIP_AFTER_FAILS,
  msUntilNextLife,
  formatRegenCountdown,
} from '../store/gameStore';
import { COLORS, LAB } from '../theme/colors';

export function LevelCompleteModal() {
  const modal = useGameStore((s) => s.modal);
  const level = useGameStore((s) => s.level);
  const unlockedLevel = useGameStore((s) => s.unlockedLevel);
  const lastClearCoinReward = useGameStore((s) => s.lastClearCoinReward);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const nextLevel = useGameStore((s) => s.nextLevel);

  const isFinal = level >= MAX_LEVEL;
  const firstClear = lastClearCoinReward === LEVEL_COIN_REWARD;
  const nextUnlocked = firstClear && !isFinal && unlockedLevel >= level + 1;
  const coinLabel =
    lastClearCoinReward === 1
      ? '+1 coin earned'
      : `+${lastClearCoinReward} coins earned`;

  return (
    <Modal
      visible={modal === 'level_complete'}
      transparent
      animationType="fade"
      onRequestClose={() => void nextLevel({ goHome: true })}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>STATION {level}</Text>
          <Text style={styles.title}>Sorted!</Text>
          <Text style={styles.sub}>
            {coinLabel}
            {nextUnlocked ? `\nStation ${level + 1} unlocked` : ''}
            {!firstClear ? '\nReplay bonus' : ''}
          </Text>
          {isAdLoading ? (
            <View style={styles.col}>
              <ActivityIndicator
                color={LAB.glassBright}
                style={{ marginVertical: 8 }}
              />
              <Text style={styles.sub}>Loading ad…</Text>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => void nextLevel({ goHome: true })}
              >
                <Text style={styles.btnGhostText}>Back to Path</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.col}>
              {!isFinal ? (
                <Pressable
                  style={[styles.btn, styles.btnMain]}
                  onPress={() => void nextLevel({ openJackpot: false })}
                >
                  <Text style={styles.btnMainText}>Next Station</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.btn, isFinal ? styles.btnMain : styles.btnGhost]}
                onPress={() => void nextLevel({ openJackpot: true })}
              >
                <Text style={isFinal ? styles.btnMainText : styles.btnGhostText}>
                  {isFinal ? 'Spin Centrifuge' : 'Next · Centrifuge'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => void nextLevel({ goHome: true })}
              >
                <Text style={styles.btnGhostText}>Back to Path</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function CampaignCompleteModal() {
  const modal = useGameStore((s) => s.modal);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const openSlotMachine = useGameStore((s) => s.openSlotMachine);
  const goHome = useGameStore((s) => s.goHome);

  return (
    <Modal
      visible={modal === 'campaign_complete'}
      transparent
      animationType="fade"
      onRequestClose={goHome}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>LAB CLEAR</Text>
          <Text style={styles.title}>All {MAX_LEVEL} Stations!</Text>
          <Text style={styles.sub}>
            You beat every tier from Beginner to Legend. Spin the Centrifuge or
            return to the path to replay.
          </Text>
          {isAdLoading ? (
            <View style={styles.col}>
              <ActivityIndicator
                color={LAB.glassBright}
                style={{ marginVertical: 8 }}
              />
              <Text style={styles.sub}>Loading ad…</Text>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={goHome}>
                <Text style={styles.btnGhostText}>Back to Path</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.col}>
              <Pressable
                style={[styles.btn, styles.btnMain]}
                onPress={openSlotMachine}
              >
                <Text style={styles.btnMainText}>Spin Centrifuge</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={goHome}>
                <Text style={styles.btnGhostText}>Back to Path</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function OutOfLivesModal() {
  const modal = useGameStore((s) => s.modal);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const adsReady = useGameStore((s) => s.adsReady);
  const lives = useGameStore((s) => s.lives);
  const nextLifeAt = useGameStore((s) => s.nextLifeAt);
  const closeModal = useGameStore((s) => s.closeModal);
  const watchAd = useGameStore((s) => s.watchAd);
  const refreshLives = useGameStore((s) => s.refreshLives);
  const goHome = useGameStore((s) => s.goHome);

  const regenMs =
    lives < MAX_LIVES ? msUntilNextLife({ lives, nextLifeAt }) : null;
  const regenLabel =
    regenMs != null ? formatRegenCountdown(regenMs) : null;

  React.useEffect(() => {
    if (modal !== 'out_of_lives' || lives >= MAX_LIVES) return;
    const id = setInterval(() => refreshLives(), 1000);
    return () => clearInterval(id);
  }, [modal, lives, refreshLives]);

  React.useEffect(() => {
    if (modal === 'out_of_lives' && lives > 0) {
      closeModal();
    }
  }, [modal, lives, closeModal]);

  return (
    <Modal
      visible={modal === 'out_of_lives'}
      transparent
      animationType="fade"
      onRequestClose={() => {
        closeModal();
        goHome();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>NO LIVES LEFT</Text>
          <Text style={styles.title}>Lab sealed!</Text>
          <Text style={styles.sub}>
            You need a life to start or retry a station.
            {regenLabel
              ? ` Next life in ${regenLabel}.`
              : ' Watch a short ad for +1 life.'}
          </Text>
          {isAdLoading ? (
            <ActivityIndicator
              color={LAB.glassBright}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <View style={styles.col}>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnMain,
                  !adsReady && styles.btnDisabled,
                ]}
                disabled={!adsReady}
                onPress={() => void watchAd('rewarded_life')}
              >
                <Text style={styles.btnMainText}>
                  {adsReady ? 'Watch Ad · +1 Life' : 'Ad Unavailable'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={() => {
                  closeModal();
                  goHome();
                }}
              >
                <Text style={styles.btnGhostText}>Back to Path</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function ExtraTubeAdModal() {
  const modal = useGameStore((s) => s.modal);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const adsReady = useGameStore((s) => s.adsReady);
  const closeModal = useGameStore((s) => s.closeModal);
  const watchAd = useGameStore((s) => s.watchAd);

  return (
    <Modal
      visible={modal === 'ad_extra_tube'}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Need a vial?</Text>
          <Text style={styles.sub}>
            You’re out of empty vials. Watch a short ad for +1 vial, or earn more
            from the Centrifuge.
          </Text>
          {isAdLoading ? (
            <ActivityIndicator
              color={LAB.glassBright}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnRow, styles.btnGhost]}
                onPress={closeModal}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnRow,
                  styles.btnMain,
                  !adsReady && styles.btnDisabled,
                ]}
                disabled={!adsReady}
                onPress={() => void watchAd('rewarded_extra_tube')}
              >
                <Text style={styles.btnMainText}>
                  {adsReady ? 'Watch Ad' : 'Ad Unavailable'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function UndoAdModal() {
  const modal = useGameStore((s) => s.modal);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const adsReady = useGameStore((s) => s.adsReady);
  const closeModal = useGameStore((s) => s.closeModal);
  const watchAd = useGameStore((s) => s.watchAd);

  return (
    <Modal
      visible={modal === 'ad_undo'}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Undo pours?</Text>
          <Text style={styles.sub}>
            You’re out of undo items. Watch an ad to reverse your last 1–3 pours
            (based on how many you can undo).
          </Text>
          {isAdLoading ? (
            <ActivityIndicator color={LAB.glassBright} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnRow, styles.btnGhost]}
                onPress={closeModal}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnRow,
                  styles.btnMain,
                  !adsReady && styles.btnDisabled,
                ]}
                disabled={!adsReady}
                onPress={() => void watchAd('rewarded_undo')}
              >
                <Text style={styles.btnMainText}>
                  {adsReady ? 'Watch Ad' : 'Ad Unavailable'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function OutOfMovesModal() {
  const modal = useGameStore((s) => s.modal);
  const isAdLoading = useGameStore((s) => s.isAdLoading);
  const adsReady = useGameStore((s) => s.adsReady);
  const consecutiveFailCount = useGameStore((s) => s.consecutiveFailCount);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const watchAd = useGameStore((s) => s.watchAd);
  const requestMoreMoves = useGameStore((s) => s.requestMoreMoves);
  const skipLevel = useGameStore((s) => s.skipLevel);
  const goHome = useGameStore((s) => s.goHome);

  const showExtraMovesAd = modal === 'ad_extra_moves';
  const visible = modal === 'out_of_moves' || showExtraMovesAd;
  const canSkip = consecutiveFailCount >= SKIP_AFTER_FAILS;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={goHome}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>NO MOVES LEFT</Text>
          <Text style={styles.title}>Reagents stalled!</Text>
          <Text style={styles.sub}>
            {showExtraMovesAd
              ? `Watch an ad for +${EXTRA_MOVES_FROM_AD} moves, or restart the station.`
              : canSkip
                ? 'Retry, get more moves, or skip this station (unlocks the next). Progress is saved if you return to the path.'
                : 'Retry the station, watch an ad for extra moves, or return to the path (progress is saved).'}
          </Text>
          {isAdLoading ? (
            <ActivityIndicator
              color={LAB.glassBright}
              style={{ marginVertical: 16 }}
            />
          ) : (
            <View style={styles.col}>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnMain,
                  showExtraMovesAd && !adsReady && styles.btnDisabled,
                ]}
                disabled={showExtraMovesAd && !adsReady}
                onPress={() =>
                  showExtraMovesAd
                    ? void watchAd('rewarded_extra_moves')
                    : requestMoreMoves()
                }
              >
                <Text style={styles.btnMainText}>
                  {showExtraMovesAd
                    ? adsReady
                      ? `Watch Ad · +${EXTRA_MOVES_FROM_AD} Moves`
                      : 'Ad Unavailable'
                    : 'Get More Moves'}
                </Text>
              </Pressable>
              {canSkip && !showExtraMovesAd ? (
                <Pressable
                  style={[
                    styles.btn,
                    styles.btnMain,
                    !adsReady && styles.btnDisabled,
                  ]}
                  disabled={!adsReady}
                  onPress={() => void skipLevel()}
                >
                  <Text style={styles.btnMainText}>
                    {adsReady ? 'Watch Ad · Skip Station' : 'Skip Unavailable'}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={restartLevel}
              >
                <Text style={styles.btnGhostText}>Retry Station</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={goHome}>
                <Text style={styles.btnGhostText}>Back to Path</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 18, 24, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 22,
    backgroundColor: LAB.benchDeep,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.32)',
  },
  eyebrow: {
    color: LAB.label,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 11,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 4,
  },
  sub: {
    marginTop: 8,
    marginBottom: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    gap: 10,
  },
  btnRow: {
    flex: 1,
  },
  btnGhost: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.22)',
    flexGrow: 1,
  },
  btnMain: {
    backgroundColor: LAB.reagent,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 150, 0.35)',
    flexGrow: 1,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnGhostText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  btnMainText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
});
