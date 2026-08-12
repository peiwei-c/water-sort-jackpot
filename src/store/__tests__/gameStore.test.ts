/**
 * Integration coverage for store monetization / jackpot seams.
 */

jest.mock('../../services/audio/AudioManager', () => ({
  getAudioManager: () => ({
    initialize: jest.fn(async () => undefined),
    playSfx: jest.fn(),
    playBgm: jest.fn(),
    handleAppBackground: jest.fn(),
    handleAppForeground: jest.fn(),
  }),
}));

jest.mock('../../services/persistence', () => ({
  loadPersistedGame: jest.fn(async () => null),
  savePersistedGame: jest.fn(async () => undefined),
}));

import { useGameStore } from '../gameStore';
import { resetAdService } from '../../services/AdService';
import { resetAdManager } from '../../services/AdManager';
import type { Payout } from '../../engines/JackpotEngine';

describe('gameStore orchestration', () => {
  const prevProvider = process.env.EXPO_PUBLIC_AD_PROVIDER;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_AD_PROVIDER = 'mock';
    resetAdService();
    resetAdManager();
    useGameStore.setState({
      pendingPayout: null,
      modal: 'none',
      coins: 100,
      screen: 'home',
      lastMessage: null,
      levelsCompletedSinceAd: 0,
      isNoAdsPurchased: false,
      hydrated: true,
    });
  });

  afterEach(() => {
    if (prevProvider === undefined) {
      delete process.env.EXPO_PUBLIC_AD_PROVIDER;
    } else {
      process.env.EXPO_PUBLIC_AD_PROVIDER = prevProvider;
    }
  });

  const samplePayout = (): Payout => ({
    kind: 'line_win',
    coins: 25,
    undoItems: 0,
    extraTubeItems: 0,
    unlockRareSkin: false,
    label: 'Test win +25',
    lineWins: [],
    linesPlayed: 5,
    betPerLine: 1,
  });

  it('collects pending payout when opening store (does not drop coins)', () => {
    useGameStore.setState({
      pendingPayout: samplePayout(),
      modal: 'ad_2x_payout',
      coins: 50,
    });
    useGameStore.getState().openStore();
    const s = useGameStore.getState();
    expect(s.pendingPayout).toBeNull();
    expect(s.coins).toBe(75);
    expect(s.screen).toBe('store');
    expect(s.modal).toBe('none');
  });

  it('flushSession settleJackpot grants 1× and clears ad_2x modal', () => {
    useGameStore.setState({
      pendingPayout: samplePayout(),
      modal: 'ad_2x_payout',
      coins: 10,
    });
    useGameStore.getState().flushSession({ settleJackpot: true });
    const s = useGameStore.getState();
    expect(s.pendingPayout).toBeNull();
    expect(s.coins).toBe(35);
    expect(s.modal).toBe('spin_result');
  });

  it('flushSession without settleJackpot preserves pending 2× offer', () => {
    const payout = samplePayout();
    useGameStore.setState({
      pendingPayout: payout,
      modal: 'ad_2x_payout',
      coins: 10,
    });
    useGameStore.getState().flushSession({ settleJackpot: false });
    const s = useGameStore.getState();
    expect(s.pendingPayout).toEqual(payout);
    expect(s.coins).toBe(10);
    expect(s.modal).toBe('ad_2x_payout');
  });

  it('goHome collects pending payout', () => {
    useGameStore.setState({
      pendingPayout: samplePayout(),
      modal: 'ad_2x_payout',
      coins: 0,
      screen: 'play',
    });
    useGameStore.getState().goHome();
    const s = useGameStore.getState();
    expect(s.pendingPayout).toBeNull();
    expect(s.coins).toBe(25);
    expect(s.screen).toBe('home');
    expect(s.modal).toBe('none');
  });

  it('opens Centrifuge from openSlotMachine', () => {
    useGameStore.setState({ modal: 'none', pendingPayout: null });
    useGameStore.getState().openSlotMachine();
    expect(useGameStore.getState().modal).toBe('slot_machine');
  });
});
