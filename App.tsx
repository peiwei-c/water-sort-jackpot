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
import { useFonts } from 'expo-font';
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
import { ANDROID_TOP_INSET } from './src/theme/androidTopInset';
import { BOBA } from './src/theme/boba';
import { BOBA_FONT_MAP } from './src/theme/loadBobaFonts';

void SplashScreen.preventAutoHideAsync();

function AppShell() {
  const [fontsLoaded, fontError] = useFonts(BOBA_FONT_MAP);
  const fontsReady = fontsLoaded || !!fontError;
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
    if (!hydrated || !fontsReady) return;
    void SplashScreen.hideAsync();
  }, [hydrated, fontsReady]);

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

  useEffect(() => {
    if (shouldShowBoot(hydrated, splashElapsed, fontsReady)) return;
    const track = screen === 'play' ? 'play' : 'home';
    void getAudioManager().playBgm(track);
  }, [screen, hydrated, splashElapsed, fontsReady]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background') {
        flushSession({ settleJackpot: true });
        void getAudioManager().handleAppBackground();
      } else if (next === 'inactive') {
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
      const { screen, modal, closeModal, goHome, nextLevel } =
        useGameStore.getState();
      // Hardware back must match each modal's onRequestClose. A blanket
      // closeModal() on a sealed ticket leaves the player on a won board.
      if (modal === 'level_complete') {
        void nextLevel({ goHome: true });
        return true;
      }
      if (
        modal === 'campaign_complete' ||
        modal === 'out_of_lives' ||
        modal === 'out_of_moves' ||
        modal === 'ad_extra_moves'
      ) {
        goHome();
        return true;
      }
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

  if (shouldShowBoot(hydrated, splashElapsed, fontsReady)) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.root}>
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
    </View>
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
    backgroundColor: BOBA.skyTop,
  },
  safe: {
    flex: 1,
    paddingTop: ANDROID_TOP_INSET,
  },
});
