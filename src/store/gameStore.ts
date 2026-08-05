import { create } from 'zustand';
import {
  WaterSortEngine,
  getLevelDifficulty,
  MAX_LEVEL,
  isCampaignComplete,
  type Tube,
} from '../engines/WaterSortEngine';
import {
  JackpotEngine,
  SPIN_COST,
  LEVEL_COIN_REWARD,
  DEFAULT_BET,
  DEFAULT_LINES,
  BET_OPTIONS,
  spinCost,
  clampBet,
  clampLines,
  isFreeSpinBet,
  applyPayoutMultiplier,
  type SpinResult,
  type Payout,
  type SlotSymbol,
  type BetOption,
} from '../engines/JackpotEngine';
import {
  getAdService,
  INTERSTITIAL_EVERY_N_LEVELS,
  type AdPlacement,
} from '../services/AdService';
import {
  loadPersistedGame,
  savePersistedGame,
  type PuzzleSession,
  type PersistedGame,
} from '../services/persistence';

export const EXTRA_MOVES_FROM_AD = 5;
export const POUR_ANIM_MS = 520;

export type PourAnim = {
  fromIndex: number;
  toIndex: number;
  color: number;
  amount: number;
  before: Tube[];
  after: Tube[];
  nextMoves: number;
  pendingModal: ModalKind;
  pendingMessage: string | null;
  pendingCoins?: number;
  pendingLevelsSinceAd?: number;
};

export type ModalKind =
  | 'none'
  | 'level_complete'
  | 'campaign_complete'
  | 'out_of_moves'
  | 'slot_machine'
  | 'ad_extra_tube'
  | 'ad_extra_moves'
  | 'ad_free_spins'
  | 'ad_2x_payout'
  | 'spin_result';

type GameStore = {
  screen: 'home' | 'play';
  level: number;
  /** Highest level the player may open (1…MAX_LEVEL). */
  unlockedLevel: number;
  /** Highest level cleared at least once. */
  highestCompleted: number;
  coins: number;
  undoItems: number;
  extraTubeItems: number;
  freeSpins: number;
  rareSkinUnlocked: boolean;
  tubes: Tube[];
  capacity: number;
  moveLimit: number;
  movesLeft: number;
  tierLabel: string;
  betPerLine: BetOption;
  activeLines: number;
  selectedTube: number | null;
  pourAnim: PourAnim | null;
  levelsCompletedSinceAd: number;
  modal: ModalKind;
  lastSpin: SpinResult | null;
  pendingPayout: Payout | null;
  isAdLoading: boolean;
  lastMessage: string | null;
  /** Saved mid-puzzle run (null when none / cleared). */
  session: PuzzleSession | null;
  hydrated: boolean;

  _puzzle: WaterSortEngine;
  _jackpot: JackpotEngine;

  hydrate: () => Promise<void>;
  /** Persist mid-puzzle without leaving the play screen. */
  flushSession: () => void;
  selectTube: (index: number) => void;
  clearSelection: () => void;
  completePourAnim: () => void;
  undo: () => void;
  useExtraTube: () => void;
  restartLevel: () => void;
  startLevel: (level: number) => void;
  goHome: () => void;
  nextLevel: (opts?: { openJackpot?: boolean; goHome?: boolean }) => void;
  openSlotMachine: () => void;
  closeModal: () => void;
  setBetPerLine: (bet: number) => void;
  setActiveLines: (lines: number) => void;
  cycleBet: (direction: 1 | -1) => void;
  cycleLines: (direction: 1 | -1) => void;
  spin: () => Promise<void>;
  claimPendingPayout: (multiplier: number) => void;
  watchAd: (placement: AdPlacement) => Promise<boolean>;
  requestMoreMoves: () => void;
  dismissMessage: () => void;
};

function syncFromPuzzle(puzzle: WaterSortEngine): Pick<GameStore, 'tubes' | 'capacity'> {
  const state = puzzle.getState();
  return { tubes: state.tubes, capacity: state.capacity };
}

function createPuzzle(level: number): WaterSortEngine {
  return WaterSortEngine.createDefaultLevel(level);
}

function moveBudget(level: number): { moveLimit: number; movesLeft: number } {
  const { moveLimit } = getLevelDifficulty(level);
  return { moveLimit, movesLeft: moveLimit };
}

function progressAfterClear(
  completedLevel: number,
  highestCompleted: number,
  unlockedLevel: number,
): { highestCompleted: number; unlockedLevel: number } {
  const nextHighest = Math.max(highestCompleted, completedLevel);
  const nextUnlocked = Math.min(
    MAX_LEVEL,
    Math.max(
      unlockedLevel,
      completedLevel >= MAX_LEVEL ? MAX_LEVEL : completedLevel + 1,
    ),
  );
  return { highestCompleted: nextHighest, unlockedLevel: nextUnlocked };
}

function captureSession(state: {
  level: number;
  movesLeft: number;
  moveLimit: number;
  modal: ModalKind;
  _puzzle: WaterSortEngine;
}): PuzzleSession | null {
  if (
    state.modal === 'level_complete' ||
    state.modal === 'campaign_complete'
  ) {
    return null;
  }
  if (state._puzzle.isWon()) return null;
  const snap = state._puzzle.getSnapshot();
  return {
    level: state.level,
    tubes: snap.tubes,
    capacity: snap.capacity,
    history: snap.history,
    movesLeft: state.movesLeft,
    moveLimit: state.moveLimit,
  };
}

function buildPersistPayload(state: GameStore): PersistedGame {
  return {
    unlockedLevel: state.unlockedLevel,
    highestCompleted: state.highestCompleted,
    coins: state.coins,
    undoItems: state.undoItems,
    extraTubeItems: state.extraTubeItems,
    freeSpins: state.freeSpins,
    rareSkinUnlocked: state.rareSkinUnlocked,
    betPerLine: state.betPerLine,
    activeLines: state.activeLines,
    session: state.session,
  };
}

/** Assigned after store creation — safe to call from actions. */
let persistSoon: () => void = () => {};

export const useGameStore = create<GameStore>((set, get) => {
  const puzzle = createPuzzle(1);
  const jackpot = new JackpotEngine();
  const budget = moveBudget(1);
  const startDiff = getLevelDifficulty(1);

  return {
    screen: 'home',
    level: 1,
    unlockedLevel: 1,
    highestCompleted: 0,
    coins: 50,
    undoItems: 2,
    extraTubeItems: 1,
    freeSpins: 0,
    rareSkinUnlocked: false,
    ...syncFromPuzzle(puzzle),
    ...budget,
    tierLabel: startDiff.tierLabel,
    betPerLine: DEFAULT_BET,
    activeLines: DEFAULT_LINES,
    selectedTube: null,
    pourAnim: null,
    levelsCompletedSinceAd: 0,
    modal: 'none',
    lastSpin: null,
    pendingPayout: null,
    isAdLoading: false,
    lastMessage: null,
    session: null,
    hydrated: false,
    _puzzle: puzzle,
    _jackpot: jackpot,

    hydrate: async () => {
      if (get().hydrated) return;
      const data = await loadPersistedGame();
      if (!data) {
        set({ hydrated: true });
        return;
      }
      const updates: Partial<GameStore> = {
        hydrated: true,
        unlockedLevel: data.unlockedLevel,
        highestCompleted: data.highestCompleted,
        coins: data.coins,
        undoItems: data.undoItems,
        extraTubeItems: data.extraTubeItems,
        freeSpins: data.freeSpins,
        rareSkinUnlocked: data.rareSkinUnlocked,
        betPerLine: clampBet(data.betPerLine),
        activeLines: clampLines(data.activeLines),
        session: data.session,
        screen: 'home',
      };
      set(updates as GameStore);
    },

    flushSession: () => {
      const state = get();
      if (state.screen !== 'play') {
        persistSoon();
        return;
      }
      const session = captureSession(state);
      set({ session });
      persistSoon();
    },

    selectTube: (index: number) => {
      const { selectedTube, _puzzle, modal, movesLeft, pourAnim } = get();
      if (modal !== 'none' || pourAnim) return;

      if (selectedTube === null) {
        if (_puzzle.getTubes()[index]?.length === 0) return;
        set({ selectedTube: index });
        return;
      }

      if (selectedTube === index) {
        set({ selectedTube: null });
        return;
      }

      if (movesLeft <= 0) {
        set({ modal: 'out_of_moves', selectedTube: null, lastMessage: 'Out of moves!' });
        return;
      }

      const before = _puzzle.getTubes();
      const result = _puzzle.pour(selectedTube, index);
      if (!result.success || result.color === null) {
        if (_puzzle.getTubes()[index]?.length) {
          set({ selectedTube: index });
        } else {
          set({ selectedTube: null });
        }
        return;
      }

      const after = _puzzle.getTubes();
      const nextMoves = movesLeft - 1;
      let pendingModal: ModalKind = 'none';
      let pendingMessage: string | null = null;
      let pendingCoins: number | undefined;
      let pendingLevelsSinceAd: number | undefined;

      if (_puzzle.isWon()) {
        pendingCoins = get().coins + LEVEL_COIN_REWARD;
        pendingLevelsSinceAd = get().levelsCompletedSinceAd + 1;
        const currentLevel = get().level;
        pendingModal = isCampaignComplete(currentLevel)
          ? 'campaign_complete'
          : 'level_complete';
        pendingMessage = isCampaignComplete(currentLevel)
          ? `Campaign complete! All ${MAX_LEVEL} levels cleared`
          : `Level complete! +${LEVEL_COIN_REWARD} coins`;
      } else if (nextMoves <= 0) {
        pendingModal = 'out_of_moves';
        pendingMessage = 'Out of moves!';
      }

      set({
        // Keep pre-pour visuals while the pour animation plays
        tubes: before,
        selectedTube: null,
        pourAnim: {
          fromIndex: selectedTube,
          toIndex: index,
          color: result.color,
          amount: result.amount,
          before,
          after,
          nextMoves,
          pendingModal,
          pendingMessage,
          pendingCoins,
          pendingLevelsSinceAd,
        },
      });
    },

    clearSelection: () => set({ selectedTube: null }),

    completePourAnim: () => {
      const { pourAnim, _puzzle } = get();
      if (!pourAnim) return;

      const updates: Partial<GameStore> = {
        tubes: pourAnim.after,
        capacity: _puzzle.capacity,
        pourAnim: null,
        movesLeft: pourAnim.nextMoves,
        selectedTube: null,
        modal: pourAnim.pendingModal,
        lastMessage: pourAnim.pendingMessage,
      };
      if (pourAnim.pendingCoins !== undefined) {
        updates.coins = pourAnim.pendingCoins;
      }
      if (pourAnim.pendingLevelsSinceAd !== undefined) {
        updates.levelsCompletedSinceAd = pourAnim.pendingLevelsSinceAd;
      }
      if (
        pourAnim.pendingModal === 'level_complete' ||
        pourAnim.pendingModal === 'campaign_complete'
      ) {
        Object.assign(
          updates,
          progressAfterClear(
            get().level,
            get().highestCompleted,
            get().unlockedLevel,
          ),
        );
      }

      set(updates as GameStore);

      if (
        pourAnim.pendingModal === 'level_complete' ||
        pourAnim.pendingModal === 'campaign_complete'
      ) {
        set({ session: null });
        persistSoon();
        const since = get().levelsCompletedSinceAd;
        if (since >= INTERSTITIAL_EVERY_N_LEVELS) {
          void (async () => {
            set({ isAdLoading: true });
            await getAdService().showInterstitial('interstitial_level');
            set({ isAdLoading: false, levelsCompletedSinceAd: 0 });
            persistSoon();
          })();
        }
      } else {
        // Keep mid-puzzle progress warm for Path / app kill
        const session = captureSession(get());
        set({ session });
        persistSoon();
      }
    },

    undo: () => {
      const { undoItems, _puzzle, movesLeft, moveLimit, modal, pourAnim } = get();
      if (pourAnim || modal === 'level_complete') return;
      if (undoItems <= 0 || !_puzzle.canUndo()) {
        set({ lastMessage: 'No undos available' });
        return;
      }
      _puzzle.undo();
      set({
        undoItems: undoItems - 1,
        movesLeft: Math.min(moveLimit, movesLeft + 1),
        ...syncFromPuzzle(_puzzle),
        selectedTube: null,
        modal: modal === 'out_of_moves' ? 'none' : modal,
        lastMessage: 'Move undone',
        session: captureSession({
          level: get().level,
          movesLeft: Math.min(moveLimit, movesLeft + 1),
          moveLimit,
          modal: modal === 'out_of_moves' ? 'none' : modal,
          _puzzle,
        }),
      });
      persistSoon();
    },

    useExtraTube: () => {
      const { extraTubeItems, _puzzle, modal, pourAnim } = get();
      if (pourAnim || modal === 'out_of_moves' || modal === 'level_complete') return;
      if (extraTubeItems <= 0) {
        set({ modal: 'ad_extra_tube', lastMessage: 'Watch an ad for an extra tube?' });
        return;
      }
      _puzzle.addEmptyTube();
      set({
        extraTubeItems: extraTubeItems - 1,
        ...syncFromPuzzle(_puzzle),
        lastMessage: 'Extra tube added',
        session: captureSession(get()),
      });
      persistSoon();
    },

    startLevel: (level) => {
      const { unlockedLevel, session } = get();
      const safe = Math.floor(level);
      if (safe < 1 || safe > unlockedLevel || safe > MAX_LEVEL) {
        set({ lastMessage: 'Level locked' });
        return;
      }
      const diff = getLevelDifficulty(safe);

      if (session && session.level === safe) {
        const next = WaterSortEngine.fromSnapshot(session);
        set({
          screen: 'play',
          level: safe,
          _puzzle: next,
          ...syncFromPuzzle(next),
          movesLeft: session.movesLeft,
          moveLimit: session.moveLimit,
          tierLabel: diff.tierLabel,
          selectedTube: null,
          pourAnim: null,
          modal: 'none',
          lastMessage: 'Continuing station…',
        });
        return;
      }

      const next = createPuzzle(safe);
      set({
        screen: 'play',
        level: safe,
        _puzzle: next,
        ...syncFromPuzzle(next),
        ...moveBudget(safe),
        tierLabel: diff.tierLabel,
        selectedTube: null,
        pourAnim: null,
        modal: 'none',
        lastMessage: null,
        session: null,
      });
      persistSoon();
    },

    goHome: () => {
      if (get().pourAnim) return;
      const session = captureSession(get());
      set({
        screen: 'home',
        selectedTube: null,
        pourAnim: null,
        modal: 'none',
        pendingPayout: null,
        lastMessage: session ? 'Progress saved — tap the flask to continue' : null,
        session,
      });
      persistSoon();
    },

    restartLevel: () => {
      const level = get().level;
      const next = createPuzzle(level);
      const diff = getLevelDifficulty(level);
      set({
        _puzzle: next,
        ...syncFromPuzzle(next),
        ...moveBudget(level),
        tierLabel: diff.tierLabel,
        selectedTube: null,
        pourAnim: null,
        modal: 'none',
        lastMessage: 'Level restarted',
        session: null,
      });
      persistSoon();
    },

    nextLevel: (opts) => {
      const current = get().level;

      if (opts?.goHome) {
        set({
          screen: 'home',
          selectedTube: null,
          pourAnim: null,
          modal: 'none',
          pendingPayout: null,
          lastMessage: null,
          session: null,
        });
        persistSoon();
        return;
      }

      if (isCampaignComplete(current)) {
        set({
          screen: opts?.openJackpot ? 'play' : 'home',
          modal: opts?.openJackpot ? 'slot_machine' : 'campaign_complete',
          lastMessage: `You finished all ${MAX_LEVEL} levels!`,
          session: null,
        });
        persistSoon();
        return;
      }

      const level = current + 1;
      if (level > get().unlockedLevel) {
        set({
          screen: 'home',
          modal: 'none',
          lastMessage: 'New level unlocked — pick it on the path',
          session: null,
        });
        persistSoon();
        return;
      }

      const next = createPuzzle(level);
      const diff = getLevelDifficulty(level);
      set({
        screen: 'play',
        level,
        _puzzle: next,
        ...syncFromPuzzle(next),
        ...moveBudget(level),
        tierLabel: diff.tierLabel,
        selectedTube: null,
        pourAnim: null,
        modal: opts?.openJackpot ? 'slot_machine' : 'none',
        lastMessage: opts?.openJackpot
          ? `Level ${level} ready · spin the Centrifuge`
          : `Level ${level} · ${diff.tierLabel}`,
        session: null,
      });
      persistSoon();
    },

    openSlotMachine: () => set({ modal: 'slot_machine' }),

    closeModal: () => set({ modal: 'none', pendingPayout: null }),

    setBetPerLine: (bet: number) => set({ betPerLine: clampBet(bet) }),

    setActiveLines: (lines: number) => set({ activeLines: clampLines(lines) }),

    cycleBet: (direction: 1 | -1) => {
      const current = get().betPerLine;
      const idx = BET_OPTIONS.indexOf(current);
      const next = BET_OPTIONS[(idx + direction + BET_OPTIONS.length) % BET_OPTIONS.length];
      set({ betPerLine: next });
    },

    cycleLines: (direction: 1 | -1) => {
      const current = get().activeLines;
      const next = clampLines(current + direction);
      set({ activeLines: next });
    },

    spin: async () => {
      const { coins, freeSpins, _jackpot, betPerLine, activeLines } = get();
      const cost = spinCost(betPerLine, activeLines);
      const canUseFreeSpin = freeSpins > 0 && isFreeSpinBet(betPerLine);

      if (canUseFreeSpin) {
        const remaining = freeSpins - 1;
        const result = _jackpot.freeSpin(betPerLine, activeLines);
        const payout = result.payout;

        // While free spins remain, auto-collect — no Collect / 2× dialog
        if (remaining > 0) {
          set({
            freeSpins: remaining,
            lastSpin: result,
            pendingPayout: null,
            coins: coins + payout.coins,
            undoItems: get().undoItems + payout.undoItems,
            extraTubeItems: get().extraTubeItems + payout.extraTubeItems,
            rareSkinUnlocked:
              get().rareSkinUnlocked || payout.unlockRareSkin,
            modal: 'spin_result',
            lastMessage:
              payout.kind === 'none'
                ? `No win · ${remaining} free spin${remaining === 1 ? '' : 's'} left`
                : `${payout.label} · auto collected · ${remaining} free left`,
          });
          return;
        }

        // Last free spin — offer Collect / 2× like a paid win
        set({
          freeSpins: 0,
          lastSpin: result,
          pendingPayout: payout.kind === 'none' ? null : payout,
          modal: payout.kind === 'none' ? 'spin_result' : 'ad_2x_payout',
          lastMessage: payout.label,
        });
        return;
      }

      if (freeSpins > 0 && !isFreeSpinBet(betPerLine)) {
        if (!_jackpot.canAffordSpin(coins, betPerLine, activeLines)) {
          set({
            lastMessage:
              'Free spins only work on bet 1 / 5 / 10 — lower your bet to use them',
          });
          return;
        }
        // Can afford bet 25 — continue as paid spin below
        set({
          lastMessage: 'Free spins only work on bet 1 / 5 / 10 — this spin is paid',
        });
      }

      if (!_jackpot.canAffordSpin(coins, betPerLine, activeLines)) {
        set({
          modal: 'ad_free_spins',
          lastMessage: `Need ${cost} coins to bet — watch an ad?`,
        });
        return;
      }

      const result = _jackpot.spin(coins, betPerLine, activeLines);
      if (!result) return;

      set({
        coins: coins - result.tokensSpent,
        lastSpin: result,
        pendingPayout: result.payout.kind === 'none' ? null : result.payout,
        modal: result.payout.kind === 'none' ? 'spin_result' : 'ad_2x_payout',
        lastMessage: result.payout.label,
      });
    },

    claimPendingPayout: (multiplier: number) => {
      const { pendingPayout, coins, undoItems, extraTubeItems, rareSkinUnlocked } =
        get();
      if (!pendingPayout) {
        set({ modal: 'slot_machine' });
        return;
      }
      const payout = applyPayoutMultiplier(pendingPayout, multiplier);
      set({
        coins: coins + payout.coins,
        undoItems: undoItems + payout.undoItems,
        extraTubeItems: extraTubeItems + payout.extraTubeItems,
        rareSkinUnlocked: rareSkinUnlocked || payout.unlockRareSkin,
        pendingPayout: null,
        modal: 'spin_result',
        lastMessage: payout.label,
      });
      persistSoon();
    },

    watchAd: async (placement: AdPlacement) => {
      set({ isAdLoading: true });
      try {
        const result = await getAdService().showRewarded(placement);
        if (!result.success || !result.rewarded) {
          set({ isAdLoading: false, lastMessage: 'Ad not completed' });
          return false;
        }

        if (placement === 'rewarded_extra_tube') {
          const { _puzzle } = get();
          _puzzle.addEmptyTube();
          set({
            isAdLoading: false,
            ...syncFromPuzzle(_puzzle),
            modal: 'none',
            lastMessage: '+1 Extra Empty Tube',
            session: captureSession(get()),
          });
          persistSoon();
        } else if (placement === 'rewarded_extra_moves') {
          set({
            isAdLoading: false,
            movesLeft: get().movesLeft + EXTRA_MOVES_FROM_AD,
            modal: 'none',
            lastMessage: `+${EXTRA_MOVES_FROM_AD} moves`,
            session: captureSession({
              ...get(),
              movesLeft: get().movesLeft + EXTRA_MOVES_FROM_AD,
              modal: 'none',
            }),
          });
          persistSoon();
        } else if (placement === 'rewarded_free_spins') {
          const bet = get().betPerLine;
          set({
            isAdLoading: false,
            freeSpins: get().freeSpins + 3,
            // Free spins only apply at 1/5/10 — clamp if on 25
            betPerLine: isFreeSpinBet(bet) ? bet : 10,
            modal: 'slot_machine',
            lastMessage: '+3 Free Centrifuge Spins (bet 1 / 5 / 10 only)',
          });
        } else if (placement === 'rewarded_2x_payout') {
          set({ isAdLoading: false });
          get().claimPendingPayout(2);
        } else {
          set({ isAdLoading: false });
        }
        return true;
      } catch (e) {
        set({
          isAdLoading: false,
          lastMessage: e instanceof Error ? e.message : 'Ad failed',
        });
        return false;
      }
    },

    requestMoreMoves: () => set({ modal: 'ad_extra_moves' }),

    dismissMessage: () => set({ lastMessage: null }),
  };
});

persistSoon = () => {
  queueMicrotask(() => {
    void savePersistedGame(buildPersistPayload(useGameStore.getState()));
  });
};

export type { Tube, SpinResult, SlotSymbol, Payout, BetOption };
export { SPIN_COST, LEVEL_COIN_REWARD, MAX_LEVEL, BET_OPTIONS, spinCost, isFreeSpinBet };
