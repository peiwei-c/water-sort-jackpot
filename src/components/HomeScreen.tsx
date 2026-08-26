import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import {
  useGameStore,
  MAX_LIVES,
  msUntilNextLife,
  formatRegenCountdown,
  countClaimableMissions,
} from '../store/gameStore';
import { MAX_LEVEL } from '../engines/LevelProgression';
import { LEGAL } from '../constants/legal';
import { APP_NAME, APP_TAGLINE, APP_PLAY_BUTTON } from '../constants/brand';
import { BOBA, FONTS } from '../theme/boba';
import { AudioSettingsModal } from './AudioSettingsModal';
import { LabManualModal } from './LabManualModal';
import { getAudioManager } from '../services/audio/AudioManager';
import { BobaScene, BobaPill, HubTile } from './BobaScene';

export function HomeScreen() {
  const coins = useGameStore((s) => s.coins);
  const lives = useGameStore((s) => s.lives);
  const nextLifeAt = useGameStore((s) => s.nextLifeAt);
  const unlockedLevel = useGameStore((s) => s.unlockedLevel);
  const session = useGameStore((s) => s.session);
  const missionBoard = useGameStore((s) => s.missionBoard);
  const startLevel = useGameStore((s) => s.startLevel);
  const openStore = useGameStore((s) => s.openStore);
  const openMissions = useGameStore((s) => s.openMissions);
  const openSlotMachine = useGameStore((s) => s.openSlotMachine);
  const markLabManualSeen = useGameStore((s) => s.markLabManualSeen);

  const [audioOpen, setAudioOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const ticket = session?.level ?? Math.min(unlockedLevel, MAX_LEVEL);
  const claimable = countClaimableMissions(missionBoard);
  const regenMs =
    lives < MAX_LIVES ? msUntilNextLife({ lives, nextLifeAt }) : null;
  const livesChip =
    regenMs != null
      ? `🧋 ${lives} · ${formatRegenCountdown(regenMs)}`
      : `🧋 ${lives}`;

  const tap = () => getAudioManager().playSfx('tap');

  return (
    <BobaScene>
      <View style={styles.root}>
        <View style={styles.wallet}>
          <BobaPill>{livesChip}</BobaPill>
          <BobaPill mango>💰 {coins}</BobaPill>
        </View>

        <View style={styles.hub}>
          <Text style={styles.sign}>{APP_TAGLINE}</Text>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.kicker}>
            Ticket {ticket}
            {session ? ' · in progress' : ' · pour to finish'}
          </Text>

          <View style={styles.grid}>
            <HubTile
              emoji="🧋"
              label={APP_PLAY_BUTTON}
              variant="counter"
              onPress={() => {
                tap();
                startLevel(ticket);
              }}
            />
            <HubTile
              emoji="🛍️"
              label="Store"
              onPress={() => {
                tap();
                openStore();
              }}
            />
            <HubTile
              emoji="🎰"
              label="Lucky"
              variant="lucky"
              onPress={() => {
                tap();
                openSlotMachine();
              }}
            />
            <HubTile
              emoji="📋"
              label={claimable > 0 ? `Mission · ${claimable}` : 'Mission'}
              onPress={() => {
                tap();
                openMissions();
              }}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              tap();
              setManualOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="How to play"
          >
            <Text style={styles.footLink}>How to play</Text>
          </Pressable>
          <Text style={styles.footDot}>·</Text>
          <Pressable
            onPress={() => {
              tap();
              setAudioOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Audio settings"
          >
            <Text style={styles.footLink}>Audio</Text>
          </Pressable>
          <Text style={styles.footDot}>·</Text>
          <Pressable
            onPress={() => void Linking.openURL(LEGAL.privacyUrl)}
            accessibilityRole="link"
          >
            <Text style={styles.footLink}>Privacy</Text>
          </Pressable>
          <Text style={styles.footDot}>·</Text>
          <Pressable
            onPress={() => void Linking.openURL(LEGAL.termsUrl)}
            accessibilityRole="link"
          >
            <Text style={styles.footLink}>Terms</Text>
          </Pressable>
        </View>
      </View>

      <AudioSettingsModal visible={audioOpen} onClose={() => setAudioOpen(false)} />
      <LabManualModal
        visible={manualOpen}
        onClose={() => {
          setManualOpen(false);
          markLabManualSeen();
        }}
      />
    </BobaScene>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  wallet: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    zIndex: 2,
  },
  hub: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  sign: {
    textAlign: 'center',
    fontFamily: FONTS.uiBlack,
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: BOBA.sign,
  },
  brand: {
    textAlign: 'center',
    fontFamily: FONTS.display,
    fontSize: 34,
    lineHeight: 38,
    color: BOBA.cream,
    marginTop: 6,
  },
  kicker: {
    textAlign: 'center',
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255,248,240,0.78)',
    marginTop: 6,
    marginBottom: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingBottom: 4,
  },
  footLink: {
    fontFamily: FONTS.ui,
    fontSize: 12,
    color: 'rgba(255,248,240,0.72)',
  },
  footDot: {
    color: 'rgba(255,248,240,0.4)',
  },
});
