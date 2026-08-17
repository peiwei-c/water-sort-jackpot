import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  SafeAreaView,
  AppState,
  BackHandler,
  type AppStateStatus,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradientFallback } from './src/components/LinearGradientFallback';
import { PlayScreen } from './src/components/PlayScreen';
import { HomeScreen } from './src/components/HomeScreen';
import { LoadingScreen } from './src/components/LoadingScreen';
import { MIN_BOOT_MS, shouldShowBoot } from './src/components/bootGate';
import { StoreScreen } from './src/components/StoreScreen';
import { MissionsScreen } from './src/components/MissionsScreen';
import { SlotMachineModal } from './src/components/SlotMachineModal';
import {
  LevelCompleteModal,
  ExtraTubeAdModal,
  UndoAdModal,
  OutOfMovesModal,
  OutOfLivesModal,
  CampaignCompleteModal,
} from './src/components/Modals';
import { AdBanner } from './src/components/AdBanner';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useGameStore } from './src/store/gameStore';
import { bootstrapAds } from './src/services/adsBootstrap';
import { getAudioManager } from './src/services/audio/AudioManager';
import { LAB } from './src/theme/colors';
import { ANDROID_TOP_INSET } from './src/theme/androidTopInset';

void SplashScreen.preventAutoHideAsync();

function AppShell() {
  const screen = useGameStore((s) => s.screen);
  const hydrated = useGameStore((s) => s.hydrated);
  const modal = useGameStore((s) => s.modal);
  const lastMessage = useGameStore((s) => s.lastMessage);
  const dismissMessage = useGameStore((s) => s.dismissMessage);
  const hydrate = useGameStore((s) => s.hydrate);
  const flushSession = useGameStore((s) => s.flushSession);
  const refreshLives = useGameStore((s) => s.refreshLives);
  const refreshMissions = useGameStore((s) => s.refreshMissions);
  const markAdsReady = useGameStore((s) => s.markAdsReady);
  const [splashElapsed, setSplashElapsed] = useState(false);

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
  const showOutOfLives = modal === 'out_of_lives';

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
    void bootstrapAds().then((result) => {
      console.log('[App] Ads bootstrap', result);
      if (result.adsReady) {
        markAdsReady();
      }
    });
  }, [markAdsReady]);

  // BGM: home/store share menu bed; play uses bench bed (crossfades).
  useEffect(() => {
    if (shouldShowBoot(hydrated, splashElapsed)) return;
    const track = screen === 'play' ? 'play' : 'home';
    void getAudioManager().playBgm(track);
  }, [screen, hydrated, splashElapsed]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background') {
        // True background / kill path — settle jackpot so payouts aren't lost.
        flushSession({ settleJackpot: true });
        void getAudioManager().handleAppBackground();
      } else if (next === 'inactive') {
        // iOS Control Center etc. — save puzzle, keep Collect / 2× offer intact.
        flushSession({ settleJackpot: false });
        void getAudioManager().handleAppBackground();
      } else if (next === 'active') {
        refreshLives();
        refreshMissions();
        void getAudioManager().handleAppForeground();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [flushSession, refreshLives, refreshMissions]);

  useEffect(() => {
    const onBackPress = () => {
      const { screen, modal, closeModal, goHome } = useGameStore.getState();
      if (modal !== 'none') {
        closeModal();
        return true;
      }
      if (screen !== 'home') {
        goHome();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

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
        ) : screen === 'missions' ? (
          <MissionsScreen />
        ) : (
          <PlayScreen />
        )}

        {showLevelComplete ? <LevelCompleteModal /> : null}
        {showCampaignComplete ? <CampaignCompleteModal /> : null}
        {showExtraTube ? <ExtraTubeAdModal /> : null}
        {showUndoAd ? <UndoAdModal /> : null}
        {showOutOfMoves ? <OutOfMovesModal /> : null}
        {showOutOfLives ? <OutOfLivesModal /> : null}
        {showSlots ? <SlotMachineModal /> : null}
        <AdBanner />
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
    paddingTop: ANDROID_TOP_INSET,
  },
});
