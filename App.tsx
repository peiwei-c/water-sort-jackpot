import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  SafeAreaView,
  AppState,
  type AppStateStatus,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradientFallback } from './src/components/LinearGradientFallback';
import { TubeBoard } from './src/components/TubeBoard';
import { GameHUD, GameControls } from './src/components/GameHUD';
import { HomeScreen } from './src/components/HomeScreen';
import { LoadingScreen } from './src/components/LoadingScreen';
import { MIN_BOOT_MS, shouldShowBoot } from './src/components/bootGate';
import { StoreScreen } from './src/components/StoreScreen';
import { SlotMachineModal } from './src/components/SlotMachineModal';
import {
  LevelCompleteModal,
  ExtraTubeAdModal,
  UndoAdModal,
  OutOfMovesModal,
  CampaignCompleteModal,
} from './src/components/Modals';
import { AdBanner } from './src/components/AdBanner';
import { AgeGateModal } from './src/components/AgeGateModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useGameStore } from './src/store/gameStore';
import { bootstrapAds } from './src/services/adsBootstrap';
import { getAudioManager } from './src/services/audio/AudioManager';
import { LAB } from './src/theme/colors';

void SplashScreen.preventAutoHideAsync();

function AppShell() {
  const screen = useGameStore((s) => s.screen);
  const hydrated = useGameStore((s) => s.hydrated);
  const tubes = useGameStore((s) => s.tubes);
  const capacity = useGameStore((s) => s.capacity);
  const selectedTube = useGameStore((s) => s.selectedTube);
  const rareSkinUnlocked = useGameStore((s) => s.rareSkinUnlocked);
  const equippedVialId = useGameStore((s) => s.equippedVialId);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const modal = useGameStore((s) => s.modal);
  const selectTube = useGameStore((s) => s.selectTube);
  const dismissMessage = useGameStore((s) => s.dismissMessage);
  const hydrate = useGameStore((s) => s.hydrate);
  const flushSession = useGameStore((s) => s.flushSession);
  const markAdsReady = useGameStore((s) => s.markAdsReady);
  const [splashElapsed, setSplashElapsed] = useState(false);
  const [ageOk, setAgeOk] = useState(false);

  const showSlots =
    modal === 'slot_machine' ||
    modal === 'spin_result' ||
    modal === 'ad_2x_payout' ||
    modal === 'ad_free_spins';
  const showLevelComplete = modal === 'level_complete';
  const showCampaignComplete = modal === 'campaign_complete';
  const showExtraTube = modal === 'ad_extra_tube';
  const showUndoAd = modal === 'ad_undo';
  const showOutOfMoves =
    modal === 'out_of_moves' || modal === 'ad_extra_moves';

  const onAgeResolved = useCallback((accepted: boolean) => {
    setAgeOk(accepted);
  }, []);

  useEffect(() => {
    void hydrate();
    void getAudioManager().initialize();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    void SplashScreen.hideAsync();
  }, [hydrated]);

  // Persistence finishes in ~ms; hold the branded boot so the animation can play.
  useEffect(() => {
    const t = setTimeout(() => setSplashElapsed(true), MIN_BOOT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ageOk) return;
    void bootstrapAds().then((result) => {
      console.log('[App] Ads bootstrap', result);
      if (result.adsReady) {
        markAdsReady();
      }
    });
  }, [ageOk, markAdsReady]);

  // BGM: home/store share menu bed; play uses bench bed (crossfades).
  useEffect(() => {
    if (shouldShowBoot(hydrated, splashElapsed)) return;
    const track = screen === 'play' ? 'play' : 'home';
    void getAudioManager().playBgm(track);
  }, [screen, hydrated, splashElapsed]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        flushSession();
        void getAudioManager().handleAppBackground();
      } else if (next === 'active') {
        void getAudioManager().handleAppForeground();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [flushSession]);

  useEffect(() => {
    if (!lastMessage) return;
    const t = setTimeout(dismissMessage, 2200);
    return () => clearTimeout(t);
  }, [lastMessage, dismissMessage]);

  if (shouldShowBoot(hydrated, splashElapsed)) {
    return <LoadingScreen />;
  }

  return (
    <LinearGradientFallback
      colors={[LAB.benchDeep, LAB.benchMid]}
      style={styles.root}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />

        {screen === 'home' ? (
          <HomeScreen />
        ) : screen === 'store' ? (
          <StoreScreen />
        ) : (
          <View style={styles.playRoot}>
            <View pointerEvents="none" style={styles.labGrid}>
              {Array.from({ length: 10 }, (_, i) => (
                <View key={`h-${i}`} style={[styles.gridH, { top: 24 + i * 72 }]} />
              ))}
              {Array.from({ length: 6 }, (_, i) => (
                <View
                  key={`v-${i}`}
                  style={[styles.gridV, { left: `${12 + i * 15}%` }]}
                />
              ))}
              <View style={styles.glowOrb} />
            </View>

            <GameHUD />
            <View style={styles.stage}>
              <Text style={styles.hint}>
                Select a vial, then pour · Moves are limited
              </Text>
              <View style={styles.bench}>
                <View style={styles.benchHeader}>
                  <View style={styles.hazard} />
                  <Text style={styles.benchLabel}>SORTING BENCH</Text>
                  <View style={styles.hazard} />
                </View>
                <TubeBoard
                  tubes={tubes}
                  capacity={capacity}
                  selectedTube={selectedTube}
                  vialSkinId={equippedVialId}
                  rareSkin={rareSkinUnlocked}
                  onSelect={selectTube}
                />
                <View style={styles.benchFoot} />
              </View>
              {lastMessage ? (
                <Text style={styles.toast}>{lastMessage}</Text>
              ) : (
                <Text style={styles.toastPlaceholder}> </Text>
              )}
            </View>
            <GameControls />
          </View>
        )}

        {showLevelComplete ? <LevelCompleteModal /> : null}
        {showCampaignComplete ? <CampaignCompleteModal /> : null}
        {showExtraTube ? <ExtraTubeAdModal /> : null}
        {showUndoAd ? <UndoAdModal /> : null}
        {showOutOfMoves ? <OutOfMovesModal /> : null}
        {showSlots ? <SlotMachineModal /> : null}
        {ageOk ? <AdBanner /> : null}
        <AgeGateModal onResolved={onAgeResolved} />
      </SafeAreaView>
    </LinearGradientFallback>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  playRoot: {
    flex: 1,
  },
  labGrid: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
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
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: LAB.glassBright,
    opacity: 0.07,
    top: 80,
    right: -70,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 12,
  },
  hint: {
    textAlign: 'center',
    color: LAB.label,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  bench: {
    backgroundColor: 'rgba(8, 32, 40, 0.78)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(126, 227, 214, 0.32)',
    paddingTop: 10,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  benchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  hazard: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: LAB.hazard,
    opacity: 0.65,
  },
  benchLabel: {
    color: LAB.reagent,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1.8,
  },
  benchFoot: {
    height: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(126, 227, 214, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(126, 227, 214, 0.18)',
  },
  toast: {
    textAlign: 'center',
    color: LAB.reagent,
    fontWeight: '700',
    minHeight: 22,
    marginTop: 8,
  },
  toastPlaceholder: {
    minHeight: 22,
    marginTop: 8,
  },
});
