import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGAL } from '../constants/legal';
import { LAB } from '../theme/colors';

const STORAGE_KEY = '@aquasort/age_gate_v1';

type Props = {
  onResolved: (accepted: boolean) => void;
};

/**
 * One-time 17+ acknowledgment for ads + simulated Centrifuge gambling theme.
 */
export function AgeGateModal({ onResolved }: Props) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'accepted') {
          onResolved(true);
          setReady(true);
          return;
        }
        setVisible(true);
        setReady(true);
      } catch {
        setVisible(true);
        setReady(true);
      }
    })();
  }, [onResolved]);

  if (!ready) return null;

  const accept = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
    onResolved(true);
  };

  const openPrivacy = () => {
    void Linking.openURL(LEGAL.privacyUrl);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ACCESS PROTOCOL</Text>
          <Text style={styles.title}>{LEGAL.minimumAge}+ only</Text>
          <Text style={styles.body}>
            AquaSort Lab includes ads and a fictional Centrifuge reward game.
            No real-money gambling. By continuing you confirm you are at least{' '}
            {LEGAL.minimumAge} and agree to our Privacy Policy.
          </Text>
          <Pressable onPress={openPrivacy} accessibilityRole="link">
            <Text style={styles.link}>Read Privacy Policy</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => void accept()}>
            <Text style={styles.btnText}>I am {LEGAL.minimumAge}+ — Enter lab</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0A222A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.35)',
    padding: 22,
  },
  eyebrow: {
    color: LAB.label,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: LAB.glassBright,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
  },
  body: {
    color: 'rgba(244,247,251,0.82)',
    lineHeight: 22,
    marginBottom: 14,
  },
  link: {
    color: LAB.reagent,
    fontWeight: '700',
    marginBottom: 18,
    textDecorationLine: 'underline',
  },
  btn: {
    backgroundColor: LAB.glassBright,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#06141C',
    fontWeight: '900',
  },
});
