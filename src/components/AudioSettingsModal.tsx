import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { DialogCloseX } from './DialogCloseX';
import { useAudioPrefs } from '../hooks/useAudioPrefs';
import { getAudioManager } from '../services/audio/AudioManager';
import { APP_NAME } from '../constants/brand';
import { BOBA, FONTS } from '../theme/boba';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Shop-styled audio settings: independent BGM / SFX volume + mute.
 * Wired to AudioManager (persists via AsyncStorage).
 */
export function AudioSettingsModal({ visible, onClose }: Props) {
  const prefs = useAudioPrefs();
  const audio = getAudioManager();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <DialogCloseX onPress={onClose} />
          <Text style={styles.eyebrow}>{APP_NAME}</Text>
          <Text style={styles.title}>Audio</Text>
          <Text style={styles.sub}>Tune the shop speakers. Prefs save automatically.</Text>

          <BusRow
            label="Music (BGM)"
            volume={prefs.bgmVolume}
            muted={prefs.bgmMuted}
            onMute={() => {
              audio.playSfx('tap');
              audio.toggleBgmMute();
            }}
            onVolume={(v) => audio.setBgmVolume(v)}
          />

          <BusRow
            label="Effects (SFX)"
            volume={prefs.sfxVolume}
            muted={prefs.sfxMuted}
            onMute={() => {
              const nextMuted = !prefs.sfxMuted;
              audio.setSfxMuted(nextMuted);
              if (!nextMuted) audio.playSfx('tap');
            }}
            onVolume={(v) => {
              audio.setSfxVolume(v);
              audio.playSfx('tap');
            }}
          />

          <Pressable
            style={styles.done}
            onPress={() => {
              audio.playSfx('tap');
              onClose();
            }}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function BusRow({
  label,
  volume,
  muted,
  onMute,
  onVolume,
}: {
  label: string;
  volume: number;
  muted: boolean;
  onMute: () => void;
  onVolume: (v: number) => void;
}) {
  const pct = Math.round(volume * 100);

  return (
    <View style={styles.bus}>
      <View style={styles.busHeader}>
        <Text style={styles.busLabel}>{label}</Text>
        <Pressable
          style={[styles.muteChip, muted && styles.muteChipOn]}
          onPress={onMute}
          accessibilityRole="button"
          accessibilityState={{ selected: muted }}
          accessibilityLabel={muted ? `Unmute ${label}` : `Mute ${label}`}
        >
          <Text style={[styles.muteText, muted && styles.muteTextOn]}>
            {muted ? 'Muted' : 'On'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.sliderRow}>
        <Pressable
          style={styles.step}
          onPress={() => onVolume(Math.max(0, volume - 0.1))}
          accessibilityLabel={`Lower ${label} volume`}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${pct}%`,
                opacity: muted ? 0.25 : 1,
              },
            ]}
          />
        </View>

        <Pressable
          style={styles.step}
          onPress={() => onVolume(Math.min(1, volume + 0.1))}
          accessibilityLabel={`Raise ${label} volume`}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>

        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 20, 24, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    padding: 22,
    paddingTop: 28,
    backgroundColor: BOBA.cream,
  },
  eyebrow: {
    color: BOBA.straw,
    fontFamily: FONTS.uiBlack,
    letterSpacing: 2,
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    color: BOBA.ink,
    fontFamily: FONTS.display,
    fontSize: 28,
    textAlign: 'center',
    marginTop: 4,
  },
  sub: {
    color: 'rgba(74,34,28,0.68)',
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 18,
  },
  bus: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff6ee',
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  busLabel: {
    color: BOBA.ink,
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  muteChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BOBA.woodInset,
  },
  muteChipOn: {
    backgroundColor: 'rgba(242, 92, 120, 0.22)',
  },
  muteText: {
    color: BOBA.ink,
    fontFamily: FONTS.uiBlack,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  muteTextOn: {
    color: BOBA.strawDeep,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BOBA.cream,
    shadowColor: BOBA.peach,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  stepText: {
    color: BOBA.ink,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: BOBA.woodInset,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: BOBA.straw,
  },
  pct: {
    width: 40,
    textAlign: 'right',
    color: BOBA.ink,
    fontFamily: FONTS.ui,
    fontSize: 12,
  },
  done: {
    marginTop: 6,
    backgroundColor: BOBA.straw,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneText: {
    color: BOBA.cream,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
});
