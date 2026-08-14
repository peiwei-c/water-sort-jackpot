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
import {
  emptyGrid,
  SlotSymbol,
  type Payout,
  type SpinResult,
} from '../../engines/JackpotEngine';

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
    jest.restoreAllMocks();
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

  function winSpin(payoutCoins: number, tokensSpent: number): SpinResult {
    return {
      reels: [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Coin],
      grid: emptyGrid(),
      payout: {
        kind: 'line_win',
        coins: payoutCoins,
        undoItems: 0,
        extraTubeItems: 0,
        unlockRareSkin: false,
        label: `Win +${payoutCoins}`,
        lineWins: [],
        linesPlayed: 5,
        betPerLine: 5,
      },
      tokensSpent,
      betPerLine: 5,
      linesPlayed: 5,
    };
  }

  function stubCentrifuge(result: SpinResult) {
    const engine = useGameStore.getState()._jackpot;
    jest.spyOn(engine, 'spin').mockReturnValue(result);
    jest.spyOn(engine, 'freeSpin').mockReturnValue({
      ...result,
      tokensSpent: 0,
    });
  }

  it('auto-collects a winning spin when coins still cover the next run', async () => {
    stubCentrifuge(winSpin(25, 25));
    useGameStore.setState({
      coins: 100,
      betPerLine: 5,
      activeLines: 5,
      freeSpins: 0,
      undoItems: 2,
      extraTubeItems: 1,
      spinInFlight: false,
    });

    await useGameStore.getState().spin();
    const s = useGameStore.getState();
    expect(s.coins).toBe(100);
    expect(s.pendingPayout).toBeNull();
    expect(s.modal).toBe('spin_result');
  });

  it('offers 2× ad after a win only when coins cannot cover the next run', async () => {
    stubCentrifuge(winSpin(5, 25));
    useGameStore.setState({
      coins: 25,
      betPerLine: 5,
      activeLines: 5,
      freeSpins: 0,
      spinInFlight: false,
    });

    await useGameStore.getState().spin();
    const s = useGameStore.getState();
    expect(s.coins).toBe(0);
    expect(s.pendingPayout?.coins).toBe(5);
    expect(s.modal).toBe('ad_2x_payout');
  });

  it('asks to watch an ad for free runs only when the player cannot afford the bet', async () => {
    useGameStore.setState({
      coins: 10,
      betPerLine: 5,
      activeLines: 5,
      freeSpins: 0,
      spinInFlight: false,
      lastSpin: null,
    });

    await useGameStore.getState().spin();
    const s = useGameStore.getState();
    expect(s.coins).toBe(10);
    expect(s.lastSpin).toBeNull();
    expect(s.modal).toBe('ad_free_spins');
  });

  it('auto-collects the last free-spin win when coins still cover a paid run', async () => {
    stubCentrifuge(winSpin(25, 0));
    useGameStore.setState({
      coins: 40,
      betPerLine: 5,
      activeLines: 5,
      freeSpins: 1,
      spinInFlight: false,
    });

    await useGameStore.getState().spin();
    const s = useGameStore.getState();
    expect(s.freeSpins).toBe(0);
    expect(s.coins).toBe(65);
    expect(s.pendingPayout).toBeNull();
    expect(s.modal).toBe('spin_result');
  });
});
