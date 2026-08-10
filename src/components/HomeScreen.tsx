import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  Linking,
  type ListRenderItemInfo,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { getLevelDifficulty, MAX_LEVEL } from '../engines/LevelProgression';
import { getPathTheme } from '../engines/StoreCatalog';
import { LEGAL } from '../constants/legal';
import { COLORS, LAB } from '../theme/colors';
import { AudioSettingsModal } from './AudioSettingsModal';
import { LabManualModal } from './LabManualModal';
import { getAudioManager } from '../services/audio/AudioManager';

const { width: SCREEN_W } = Dimensions.get('window');
const ROW_H = 108;
const FLASK = 64;
const PATH_PAD = 28;

type PathRow = {
  level: number;
  tierLabel: string;
  /** 0…1 horizontal position along the lab pipe */
  x: number;
};

/** Winding glass-pipe route (sine + slight drift). */
function pathX(level: number): number {
  const t = (level - 1) * 0.55;
  const wave = Math.sin(t) * 0.32;
  const drift = Math.sin(t * 0.35) * 0.08;
  return 0.5 + wave + drift;
}

function buildPath(): PathRow[] {
  const rows: PathRow[] = [];
  for (let level = 1; level <= MAX_LEVEL; level++) {
    const diff = getLevelDifficulty(level);
    rows.push({
      level,
      tierLabel: diff.tierLabel,
      x: pathX(level),
    });
  }
  return rows;
}

const PATH = buildPath();

function LabBackdrop({
  glowColor,
  reagentColor,
}: {
  glowColor: string;
  reagentColor: string;
}) {
  const bubbleA = useRef(new Animated.Value(0)).current;
  const bubbleB = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

    const a = loop(bubbleA, 4200, 0);
    const b = loop(bubbleB, 5600, 800);
    const g = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.7,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    b.start();
    g.start();
    return () => {
      a.stop();
      b.stop();
      g.stop();
    };
  }, [bubbleA, bubbleB, glowAnim]);

  const rise = (v: Animated.Value, from: number, to: number) => ({
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [from, to],
        }),
      },
    ],
    opacity: v.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.55, 0.55, 0],
    }),
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.labWash} />
      <Animated.View
        style={[
          styles.glowOrb,
          { opacity: glowAnim, backgroundColor: glowColor },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrbAmber,
          { opacity: glowAnim, backgroundColor: reagentColor },
        ]}
      />

      {Array.from({ length: 14 }, (_, i) => (
        <View
          key={`h-${i}`}
          style={[styles.gridH, { top: 40 + i * 56 }]}
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <View
          key={`v-${i}`}
          style={[styles.gridV, { left: 16 + i * ((SCREEN_W - 32) / 7) }]}
        />
      ))}

      <Animated.View
        style={[
          styles.bubble,
          styles.bubble1,
          { borderColor: glowColor },
          rise(bubbleA, 80, -40),
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          styles.bubble2,
          { borderColor: glowColor },
          rise(bubbleB, 120, -20),
        ]}
      />
      <Animated.View
        style={[
          styles.bubble,
          styles.bubble3,
          { borderColor: glowColor },
          rise(bubbleA, 60, -70),
        ]}
      />

      <View style={styles.shelf} />
      <View style={[styles.shelfEdge, { backgroundColor: glowColor }]} />
    </View>
  );
}

function LabTraveler({
  side,
  accent,
}: {
  side: 'left' | 'right';
  accent: string;
}) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [bob]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.traveler,
        side === 'left' ? styles.travelerLeft : styles.travelerRight,
        {
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5],
              }),
            },
          ],
        },
      ]}
    >
      {/* Goggles / visor */}
      <View style={styles.travelerGoggles}>
        <View style={[styles.travelerLens, { borderColor: accent }]} />
        <View style={[styles.travelerLens, { borderColor: accent }]} />
      </View>
      <View style={styles.travelerHead} />
      <View style={[styles.travelerCoat, { borderColor: accent }]}>
        <View style={[styles.travelerBadge, { backgroundColor: accent }]} />
      </View>
      <View style={styles.travelerLegs}>
        <View style={styles.travelerLeg} />
        <View style={styles.travelerLeg} />
      </View>
      <Text style={[styles.travelerTag, { color: accent }]}>YOU</Text>
    </Animated.View>
  );
}

function FlaskNode({
  level,
  locked,
  cleared,
  current,
  onPress,
  flaskBorder,
  flaskFill,
  reagent,
}: {
  level: number;
  locked: boolean;
  cleared: boolean;
  current: boolean;
  onPress: () => void;
  flaskBorder: string;
  flaskFill: string;
  reagent: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!current) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [current, pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable
        disabled={locked}
        onPress={onPress}
        style={[
          styles.flask,
          { borderColor: locked ? 'rgba(255,255,255,0.16)' : flaskBorder },
          cleared && { borderColor: flaskBorder },
          current && {
            borderColor: reagent,
            shadowColor: reagent,
            shadowOpacity: 0.55,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          },
          locked && styles.flaskLocked,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
        accessibilityLabel={
          locked
            ? `Level ${level} locked`
            : cleared
              ? `Replay level ${level}`
              : `Play level ${level}`
        }
      >
        <View
          style={[
            styles.flaskNeck,
            locked && styles.flaskNeckLocked,
            !locked && { borderColor: flaskBorder },
          ]}
        />
        {!locked ? (
          <View
            style={[
              styles.flaskLiquid,
              { backgroundColor: flaskFill },
              cleared && { height: '72%', opacity: 0.9 },
              current && { height: '85%', backgroundColor: reagent, opacity: 0.88 },
            ]}
          />
        ) : null}
        <Text
          style={[
            styles.flaskText,
            locked && styles.flaskTextLocked,
          ]}
        >
          {locked ? '∅' : cleared ? '✓' : level}
        </Text>
        {current ? (
          <View style={[styles.flaskRing, { borderColor: reagent }]} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function HomeScreen() {
  const coins = useGameStore((s) => s.coins);
  const undoItems = useGameStore((s) => s.undoItems);
  const extraTubeItems = useGameStore((s) => s.extraTubeItems);
  const freeSpins = useGameStore((s) => s.freeSpins);
  const unlockedLevel = useGameStore((s) => s.unlockedLevel);
  const highestCompleted = useGameStore((s) => s.highestCompleted);
  const session = useGameStore((s) => s.session);
  const equippedPathId = useGameStore((s) => s.equippedPathId);
  const hasSeenLabManual = useGameStore((s) => s.hasSeenLabManual);
  const hydrated = useGameStore((s) => s.hydrated);
  const startLevel = useGameStore((s) => s.startLevel);
  const openSlotMachine = useGameStore((s) => s.openSlotMachine);
  const openStore = useGameStore((s) => s.openStore);
  const markLabManualSeen = useGameStore((s) => s.markLabManualSeen);
  const listRef = useRef<FlatList<PathRow>>(null);
  const [audioOpen, setAudioOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const pathTheme = useMemo(
    () => getPathTheme(equippedPathId),
    [equippedPathId],
  );

  const focusIndex = useMemo(() => {
    if (session?.level) return Math.max(0, session.level - 1);
    return Math.max(0, unlockedLevel - 1);
  }, [unlockedLevel, session]);

  useEffect(() => {
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: focusIndex,
        animated: true,
        viewPosition: 0.35,
      });
    }, 120);
    return () => clearTimeout(t);
  }, [focusIndex]);

  useEffect(() => {
    if (!hydrated || hasSeenLabManual) return;
    setManualOpen(true);
  }, [hydrated, hasSeenLabManual]);

  const closeManual = () => {
    setManualOpen(false);
    markLabManualSeen();
  };

  const usableW = SCREEN_W - PATH_PAD * 2 - FLASK;

  const renderItem = ({ item, index }: ListRenderItemInfo<PathRow>) => {
    const locked = item.level > unlockedLevel;
    const cleared = item.level <= highestCompleted;
    const current =
      item.level === unlockedLevel && highestCompleted < MAX_LEVEL;
    const inProgress = session?.level === item.level;
    const showTier =
      index === 0 || PATH[index - 1].tierLabel !== item.tierLabel;

    const left = PATH_PAD + item.x * usableW;
    const prev = index > 0 ? PATH[index - 1] : null;
    const prevLeft = prev ? PATH_PAD + prev.x * usableW : left;
    const pipeLeft = Math.min(left, prevLeft) + FLASK / 2;
    const pipeWidth = Math.abs(left - prevLeft) + 4;

    return (
      <View style={styles.row}>
        {showTier ? (
          <View style={styles.stationBanner}>
            <View
              style={[styles.stationStripe, { backgroundColor: pathTheme.hazard }]}
            />
            <Text style={[styles.stationText, { color: pathTheme.reagent }]}>
              STATION · {item.tierLabel.toUpperCase()}
            </Text>
            <View
              style={[styles.stationStripe, { backgroundColor: pathTheme.hazard }]}
            />
          </View>
        ) : null}

        {/* Glass pipe segment from previous flask */}
        {prev ? (
          <View
            style={[
              styles.pipe,
              {
                left: pipeLeft,
                width: Math.max(pipeWidth, 8),
                backgroundColor: locked ? LAB.pipeLocked : pathTheme.pipe,
                borderColor: locked
                  ? 'rgba(255,255,255,0.08)'
                  : pathTheme.glassBright,
              },
            ]}
          >
            <View style={[styles.pipeShine, locked && { opacity: 0.15 }]} />
          </View>
        ) : null}

        <View style={[styles.nodeAnchor, { left }]}>
          <FlaskNode
            level={item.level}
            locked={locked}
            cleared={cleared}
            current={current || inProgress}
            onPress={() => startLevel(item.level)}
            flaskBorder={pathTheme.flaskBorder}
            flaskFill={pathTheme.flaskFill}
            reagent={pathTheme.reagent}
          />
          {current || inProgress ? (
            <LabTraveler
              side={item.x < 0.5 ? 'right' : 'left'}
              accent={pathTheme.reagent}
            />
          ) : null}
          <Text
            style={[
              styles.nodeCaption,
              { color: pathTheme.label },
              locked && styles.muted,
            ]}
          >
            {locked
              ? 'Sealed'
              : inProgress
                ? 'Continue'
                : cleared
                  ? 'Sampled'
                  : current
                    ? 'Active'
                    : 'Open'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <LabBackdrop
        glowColor={pathTheme.glow}
        reagentColor={pathTheme.reagent}
      />

      <View style={styles.hero}>
        <Text style={[styles.labEyebrow, { color: pathTheme.label }]}>
          HYDROLOGY LAB
        </Text>
        <Text style={styles.brand}>AquaSort Lab</Text>
        <Text style={styles.tagline}>
          Trace the glass line. Clear each flask. Unlock the next reagent station.
        </Text>

        <View style={styles.wallet}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🪙 {coins}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>↺ {undoItems}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🧪 {extraTubeItems}</Text>
          </View>
          {freeSpins > 0 ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>🎰 ×{freeSpins}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.heroActions}>
          <Pressable
            style={styles.audioBtn}
            onPress={() => {
              getAudioManager().playSfx('tap');
              setManualOpen(true);
            }}
            accessibilityLabel="Lab manual"
          >
            <Text style={styles.audioBtnText}>Help</Text>
          </Pressable>
          <Pressable
            style={styles.audioBtn}
            onPress={() => {
              getAudioManager().playSfx('tap');
              setAudioOpen(true);
            }}
            accessibilityLabel="Audio settings"
          >
            <Text style={styles.audioBtnText}>Audio</Text>
          </Pressable>
          <Pressable
            style={styles.storeBtn}
            onPress={() => {
              getAudioManager().playSfx('tap');
              openStore();
            }}
          >
            <Text style={styles.storeBtnText}>Store</Text>
          </Pressable>
          <Pressable
            style={styles.jackpotBtn}
            onPress={() => {
              getAudioManager().playSfx('tap');
              openSlotMachine();
            }}
          >
            <Text style={styles.jackpotText}>Centrifuge</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.pathHeader}>
        <Text style={[styles.pathHeading, { color: pathTheme.glassBright }]}>
          REAGENT PATH
        </Text>
        <Text style={[styles.pathMeta, { color: pathTheme.label }]}>
          {session
            ? `Lab tech at flask ${session.level}`
            : `Lab tech at flask ${Math.min(unlockedLevel, MAX_LEVEL)}`}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={PATH}
        keyExtractor={(row) => String(row.level)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ROW_H,
          offset: ROW_H * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.35,
            });
          }, 200);
        }}
        initialScrollIndex={Math.min(focusIndex, MAX_LEVEL - 1)}
      />

      <AudioSettingsModal
        visible={audioOpen}
        onClose={() => setAudioOpen(false)}
      />

      <View style={styles.legalRow}>
        <Pressable
          onPress={() => void Linking.openURL(LEGAL.privacyUrl)}
          accessibilityRole="link"
        >
          <Text style={styles.legalLink}>Privacy</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Pressable
          onPress={() => void Linking.openURL(LEGAL.termsUrl)}
          accessibilityRole="link"
        >
          <Text style={styles.legalLink}>Terms</Text>
        </Pressable>
        <Text style={styles.legalDot}>·</Text>
        <Text style={styles.legalMeta}>{LEGAL.minimumAge}+</Text>
      </View>

      <LabManualModal visible={manualOpen} onClose={closeManual} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LAB.benchDeep,
  },
  labWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: LAB.benchMid,
    opacity: 0.85,
  },
  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: LAB.glassBright,
    opacity: 0.12,
    top: -40,
    right: -60,
  },
  glowOrbAmber: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: LAB.reagent,
    opacity: 0.08,
    bottom: 120,
    left: -50,
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
  bubble: {
    position: 'absolute',
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.45)',
    backgroundColor: LAB.glass,
  },
  bubble1: { width: 18, height: 18, left: '18%', bottom: '22%' },
  bubble2: { width: 12, height: 12, left: '72%', bottom: '38%' },
  bubble3: { width: 22, height: 22, left: '58%', bottom: '12%' },
  shelf: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    backgroundColor: 'rgba(8, 28, 34, 0.9)',
  },
  shelfEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 28,
    height: 3,
    backgroundColor: LAB.glassBright,
    opacity: 0.25,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    zIndex: 2,
  },
  labEyebrow: {
    color: LAB.label,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  brand: {
    marginTop: 4,
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -1,
  },
  tagline: {
    marginTop: 8,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 300,
  },
  wallet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  audioBtn: {
    backgroundColor: LAB.glassDim,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.35)',
  },
  audioBtnText: {
    color: LAB.glassBright,
    fontWeight: '800',
    fontSize: 14,
  },
  storeBtn: {
    backgroundColor: LAB.glassDim,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.35)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  storeBtnText: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  jackpotBtn: {
    backgroundColor: LAB.reagent,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 150, 0.45)',
  },
  jackpotText: {
    color: '#1A1200',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  pathHeader: {
    paddingHorizontal: 20,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    zIndex: 2,
  },
  pathHeading: {
    color: LAB.glassBright,
    fontWeight: '800',
    letterSpacing: 1.6,
    fontSize: 11,
  },
  pathMeta: {
    color: LAB.label,
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 48,
    paddingTop: 6,
  },
  row: {
    height: ROW_H,
    justifyContent: 'center',
  },
  stationBanner: {
    position: 'absolute',
    top: 2,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 3,
  },
  stationStripe: {
    flex: 1,
    height: 2,
    backgroundColor: LAB.hazard,
    opacity: 0.55,
  },
  stationText: {
    color: LAB.reagent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pipe: {
    position: 'absolute',
    top: ROW_H / 2 - 5,
    height: 10,
    borderRadius: 5,
    backgroundColor: LAB.pipe,
    borderWidth: 1,
    borderColor: 'rgba(200, 255, 245, 0.35)',
    overflow: 'hidden',
  },
  pipeLocked: {
    backgroundColor: LAB.pipeLocked,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pipeShine: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  nodeAnchor: {
    position: 'absolute',
    top: (ROW_H - FLASK) / 2 - 4,
    width: FLASK,
    alignItems: 'center',
  },
  traveler: {
    position: 'absolute',
    top: 2,
    width: 36,
    alignItems: 'center',
    zIndex: 3,
  },
  travelerLeft: {
    right: FLASK + 4,
  },
  travelerRight: {
    left: FLASK + 4,
  },
  travelerGoggles: {
    flexDirection: 'row',
    gap: 2,
    zIndex: 2,
    marginBottom: -6,
  },
  travelerLens: {
    width: 10,
    height: 8,
    borderRadius: 3,
    borderWidth: 1.5,
    backgroundColor: 'rgba(126, 227, 214, 0.35)',
  },
  travelerHead: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8C4A8',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  travelerCoat: {
    marginTop: 2,
    width: 22,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#F4F7FB',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelerBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  travelerLegs: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 1,
  },
  travelerLeg: {
    width: 5,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#0C2A32',
  },
  travelerTag: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  flask: {
    width: FLASK,
    height: FLASK,
    borderRadius: FLASK * 0.38,
    backgroundColor: 'rgba(12, 40, 48, 0.92)',
    borderWidth: 2,
    borderColor: LAB.glassBright,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  flaskNeck: {
    position: 'absolute',
    top: 0,
    width: 18,
    height: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: LAB.glassDim,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: LAB.glassBright,
  },
  flaskNeckLocked: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  flaskLiquid: {
    width: '100%',
    height: '48%',
    backgroundColor: LAB.flaskFill,
  },
  flaskLiquidCleared: {
    height: '72%',
    backgroundColor: 'rgba(46, 196, 182, 0.75)',
  },
  flaskLiquidCurrent: {
    height: '85%',
    backgroundColor: LAB.reagent,
    opacity: 0.88,
  },
  flaskCleared: {
    borderColor: LAB.glassBright,
  },
  flaskCurrent: {
    borderColor: LAB.reagent,
    shadowColor: LAB.reagent,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  flaskLocked: {
    borderColor: 'rgba(255,255,255,0.16)',
    opacity: 0.72,
  },
  flaskRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: FLASK * 0.38,
    borderWidth: 2,
    borderColor: 'rgba(240, 180, 41, 0.5)',
  },
  flaskText: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: FLASK,
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 16,
  },
  flaskTextLocked: {
    color: COLORS.textMuted,
    fontSize: 18,
  },
  nodeCaption: {
    marginTop: 4,
    color: LAB.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  muted: {
    color: COLORS.textMuted,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingBottom: 14,
    zIndex: 2,
  },
  legalLink: {
    color: LAB.label,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  legalMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
