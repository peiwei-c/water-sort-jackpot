import { create } from 'zustand';
import {
  WaterSortEngine,
  getLevelDifficulty,
  MAX_LEVEL,
  isCampaignComplete,
  adUndoCount,
  type Tube,
  type HintMove,
} from '../engines/WaterSortEngine';
import {
  MAX_LIVES,
  createFullLives,
  syncLives,
  spendLife,
  grantLife,
  msUntilNextLife,
  formatRegenCountdown,
  type LivesState,
} from '../engines/LivesEngine';
import {
  createMissionBoard,
  refreshMissionBoard,
  recordMissionEvent,
  claimMission,
  countClaimableMissions,
  listMissionViews,
  formatRewardLabel,
  COINS_PER_OVERFLOW_LIFE,
  type MissionBoardState,
  type MissionReward,
  type MissionView,
} from '../engines/MissionEngine';
import {
  JackpotEngine,
  SPIN_COST,
  LEVEL_COIN_REWARD,
  REPLAY_COIN_REWARD,
  coinRewardForClear,
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
import { getAudioManager } from '../services/audio/AudioManager';
import {
  getAdService,
  INTERSTITIAL_EVERY_N_LEVELS,
  type AdPlacement,
} from '../services/AdService';
import { getAdManager } from '../services/AdManager';
import {
  purchaseRemoveAds as iapPurchaseRemoveAds,
  restorePurchases as iapRestorePurchases,
} from '../services/IapService';
import {
  loadPersistedGame,
  savePersistedGame,
  type PuzzleSession,
  type PersistedGame,
} from '../services/persistence';
import {
  PATH_DEFAULT,
  VIAL_DEFAULT,
  VIAL_CROWN,
  PALETTE_DEFAULT,
  DEFAULT_OWNED,
  getStoreItem,
  ensureOwnedDefaults,
  scaledMoveLimit,
} from '../engines/StoreCatalog';
export const EXTRA_MOVES_FROM_AD = 5;
export const POUR_ANIM_MS = 520;
/** Failures on the same station before Skip Level is offered. */
export const SKIP_AFTER_FAILS = 2;

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
  | 'out_of_lives'
  | 'slot_machine'
  | 'ad_extra_tube'
  | 'ad_undo'
  | 'ad_extra_moves'
  | 'ad_free_spins'
  | 'ad_2x_payout'
  | 'spin_result';

type GameStore = {
  screen: 'home' | 'play' | 'store' | 'missions';
  level: number;
  /** Highest level the player may open (1…MAX_LEVEL). */
  unlockedLevel: number;
  /** Highest level cleared at least once. */
  highestCompleted: number;
  coins: number;
  undoItems: number;
  extraTubeItems: number;
  freeSpins: number;
  /** True when crown vial is owned (Centrifuge or Store). */
  rareSkinUnlocked: boolean;
  ownedItemIds: string[];
  equippedPathId: string;
  equippedVialId: string;
  equippedPaletteId: string;
  tubes: Tube[];
  capacity: number;
  moveLimit: number;
  movesLeft: number;
  tierLabel: string;
  betPerLine: BetOption;
  activeLines: number;
  selectedTube: number | null;
  pourAnim: PourAnim | null;
  modal: ModalKind;
  lastSpin: SpinResult | null;
  pendingPayout: Payout | null;
  isAdLoading: boolean;
  adsReady: boolean;
  /** Prevents double-debit Centrifuge spins. */
  spinInFlight: boolean;
  levelsCompletedSinceAd: number;
  lastMessage: string | null;
  /** Coins granted by the most recent station clear (first clear or replay). */
  lastClearCoinReward: number;
  /** Saved mid-puzzle run (null when none / cleared). */
  session: PuzzleSession | null;
  hydrated: boolean;
  /** Remove Ads IAP — hides banner + suppresses interstitial; rewarded stays. */
  isNoAdsPurchased: boolean;
  /** First-run Lab Manual shown at least once. */
  hasSeenLabManual: boolean;
  /** Consecutive failures on the current station (skip unlocks at SKIP_AFTER_FAILS). */
  consecutiveFailCount: number;
  /** Highlighted pour from a rewarded hint. */
  hintHighlight: HintMove | null;
  /** Candy Crush–style lives (capped at MAX_LIVES). */
  lives: number;
  /** Epoch ms when the next life regenerates; null when full. */
  nextLifeAt: number | null;
  /** Daily / weekly mission board. */
  missionBoard: MissionBoardState;

  _puzzle: WaterSortEngine;
  _jackpot: JackpotEngine;

  hydrate: () => Promise<void>;
  /** Persist mid-puzzle. settleJackpot collects pending Centrifuge wins at 1×. */
  flushSession: (opts?: { settleJackpot?: boolean }) => void;
  /** Apply matured regenerating lives (call on tick / foreground). */
  refreshLives: () => void;
  /** Roll daily/weekly mission windows if the calendar advanced. */
  refreshMissions: () => void;
  markLabManualSeen: () => void;
  selectTube: (index: number) => void;
  clearSelection: () => void;
  completePourAnim: (opts?: { skipAds?: boolean }) => void;
  undo: () => void;
  useExtraTube: () => void;
  requestHint: () => Promise<boolean>;
  skipLevel: () => Promise<boolean>;
  restartLevel: () => void;
  startLevel: (level: number) => void;
  goHome: () => void;
  openStore: () => void;
  openMissions: () => void;
  claimMissionReward: (missionId: string) => boolean;
  buyItem: (id: string) => boolean;
  equipItem: (id: string) => boolean;
  purchaseRemoveAds: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  nextLevel: (opts?: {
    openJackpot?: boolean;
    goHome?: boolean;
  }) => Promise<void>;
  openSlotMachine: () => void;
  closeModal: () => void;
  setBetPerLine: (bet: number) => void;
  setActiveLines: (lines: number) => void;
  cycleBet: (direction: 1 | -1) => void;
  cycleLines: (direction: 1 | -1) => void;
  spin: () => Promise<void>;
  /** Collect pending jackpot payout at 1×. Doubling only via rewarded ad path. */
  claimPendingPayout: () => void;
  watchAd: (placement: AdPlacement) => Promise<boolean>;
  requestMoreMoves: () => void;
  dismissMessage: () => void;
  markAdsReady: () => void;
};

function syncFromPuzzle(puzzle: WaterSortEngine): Pick<GameStore, 'tubes' | 'capacity'> {
  const state = puzzle.getState();
  return { tubes: state.tubes, capacity: state.capacity };
}

function createPuzzle(level: number): WaterSortEngine {
  return WaterSortEngine.createDefaultLevel(level);
}

function moveBudget(
  level: number,
  pathId: string = PATH_DEFAULT,
): { moveLimit: number; movesLeft: number } {
  const { moveLimit: base } = getLevelDifficulty(level);
  const moveLimit = scaledMoveLimit(base, pathId);
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
    rareSkinUnlocked: state.ownedItemIds.includes(VIAL_CROWN),
    betPerLine: state.betPerLine,
    activeLines: state.activeLines,
    session: state.session,
    ownedItemIds: state.ownedItemIds,
    equippedPathId: state.equippedPathId,
    equippedVialId: state.equippedVialId,
    equippedPaletteId: state.equippedPaletteId,
    isNoAdsPurchased: state.isNoAdsPurchased,
    levelsCompletedSinceAd: state.levelsCompletedSinceAd,
    pendingPayout: state.pendingPayout,
    hasSeenLabManual: state.hasSeenLabManual,
    lives: state.lives,
    nextLifeAt: state.nextLifeAt,
    missionBoard: state.missionBoard,
  };
}

function livesSnapshot(state: LivesState): Pick<GameStore, 'lives' | 'nextLifeAt'> {
  return { lives: state.lives, nextLifeAt: state.nextLifeAt };
}

function applyMissionReward(
  state: GameStore,
  reward: MissionReward,
): Partial<GameStore> & { lastMessage: string } {
  let coins = state.coins + (reward.coins ?? 0);
  let undoItems = state.undoItems + (reward.undoItems ?? 0);
  let extraTubeItems = state.extraTubeItems + (reward.extraTubeItems ?? 0);
  let freeSpins = state.freeSpins + (reward.freeSpins ?? 0);
  let livesState: LivesState = {
    lives: state.lives,
    nextLifeAt: state.nextLifeAt,
  };
  const wantLives = reward.lives ?? 0;
  let overflowCoins = 0;
  if (wantLives > 0) {
    const before = livesState.lives;
    livesState = grantLife(livesState, wantLives);
    const gained = Math.max(0, livesState.lives - before);
    overflowCoins = Math.max(0, wantLives - gained) * COINS_PER_OVERFLOW_LIFE;
    coins += overflowCoins;
  }
  const base = formatRewardLabel(reward);
  return {
    coins,
    undoItems,
    extraTubeItems,
    freeSpins,
    ...livesSnapshot(livesState),
    lastMessage:
      overflowCoins > 0
        ? `Mission complete! ${base} (${overflowCoins} coins — lives were full)`
        : `Mission complete! ${base}`,
  };
}

function trackMission(
  get: () => GameStore,
  set: (
    partial:
      | Partial<GameStore>
      | ((state: GameStore) => Partial<GameStore>),
  ) => void,
  metric: Parameters<typeof recordMissionEvent>[1],
  amount: number = 1,
): void {
  const next = recordMissionEvent(get().missionBoard, metric, amount);
  if (next === get().missionBoard) return;
  set({ missionBoard: next });
}

function grantCosmeticFromPayout(
  ownedItemIds: string[],
  unlockRareSkin: boolean,
): { ownedItemIds: string[]; rareSkinUnlocked: boolean } {
  if (!unlockRareSkin) {
    return {
      ownedItemIds,
      rareSkinUnlocked: ownedItemIds.includes(VIAL_CROWN),
    };
  }
  const next = ensureOwnedDefaults([...ownedItemIds, VIAL_CROWN], true);
  return { ownedItemIds: next, rareSkinUnlocked: true };
}

/** Assigned after store creation — safe to call from actions. */
let persistSoon: () => void = () => {};
let flushPersistNow: () => void = () => {};

/** Apply pending Centrifuge payout at 1×. Syncs away Collect/2× offer UI. */
function collectPendingQuietly(
  get: () => GameStore,
  set: (
    partial:
      | Partial<GameStore>
      | ((state: GameStore) => Partial<GameStore>),
  ) => void,
): boolean {
  const {
    pendingPayout,
    coins,
    undoItems,
    extraTubeItems,
    ownedItemIds,
    modal,
  } = get();
  if (!pendingPayout) return false;
  const payout = applyPayoutMultiplier(pendingPayout, 1);
  const cosmetics = grantCosmeticFromPayout(
    ownedItemIds,
    payout.unlockRareSkin,
  );
  const patch: Partial<GameStore> = {
    coins: coins + payout.coins,
    undoItems: undoItems + payout.undoItems,
    extraTubeItems: extraTubeItems + payout.extraTubeItems,
    ...cosmetics,
    pendingPayout: null,
    lastMessage: payout.label,
  };
  // Don't leave Collect / 2× controls up after the win is already granted.
  if (modal === 'ad_2x_payout') {
    patch.modal = 'spin_result';
  }
  set(patch);
  persistSoon();
  return true;
}

function settlePendingPayout(
  get: () => GameStore,
  set: (
    partial:
      | Partial<GameStore>
      | ((state: GameStore) => Partial<GameStore>),
  ) => void,
  multiplier: 1 | 2,
): void {
  const { pendingPayout, coins, undoItems, extraTubeItems, ownedItemIds } =
    get();
  if (!pendingPayout) {
    set({ modal: 'slot_machine' });
    return;
  }
  const payout = applyPayoutMultiplier(pendingPayout, multiplier);
  const cosmetics = grantCosmeticFromPayout(
    ownedItemIds,
    payout.unlockRareSkin,
  );
  set({
    coins: coins + payout.coins,
    undoItems: undoItems + payout.undoItems,
    extraTubeItems: extraTubeItems + payout.extraTubeItems,
    ...cosmetics,
    pendingPayout: null,
    modal: 'spin_result',
    lastMessage: payout.label,
  });
  persistSoon();
}

export const useGameStore = create<GameStore>((set, get) => {
  const puzzle = createPuzzle(1);
  const jackpot = new JackpotEngine();
  const budget = moveBudget(1, PATH_DEFAULT);
  const startDiff = getLevelDifficulty(1);
  const fullLives = createFullLives();

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
    ownedItemIds: [...DEFAULT_OWNED],
    equippedPathId: PATH_DEFAULT,
    equippedVialId: VIAL_DEFAULT,
    equippedPaletteId: PALETTE_DEFAULT,
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
    adsReady: false,
    spinInFlight: false,
    lastMessage: null,
    lastClearCoinReward: LEVEL_COIN_REWARD,
    session: null,
    hydrated: false,
    isNoAdsPurchased: false,
    hasSeenLabManual: false,
    consecutiveFailCount: 0,
    hintHighlight: null,
    lives: fullLives.lives,
    nextLifeAt: fullLives.nextLifeAt,
    missionBoard: createMissionBoard(),
    _puzzle: puzzle,
    _jackpot: jackpot,

    hydrate: async () => {
      if (get().hydrated) return;
      const data = await loadPersistedGame();
      if (!data) {
        set({ hydrated: true });
        return;
      }
      const synced = syncLives({
        lives: data.lives,
        nextLifeAt: data.nextLifeAt,
      });
      const missionBoard = refreshMissionBoard(data.missionBoard);
      const updates: Partial<GameStore> = {
        hydrated: true,
        unlockedLevel: data.unlockedLevel,
        highestCompleted: data.highestCompleted,
        coins: data.coins,
        undoItems: data.undoItems,
        extraTubeItems: data.extraTubeItems,
        freeSpins: data.freeSpins,
        rareSkinUnlocked: data.rareSkinUnlocked,
        ownedItemIds: data.ownedItemIds,
        equippedPathId: data.equippedPathId,
        equippedVialId: data.equippedVialId,
        equippedPaletteId: data.equippedPaletteId,
        betPerLine: clampBet(data.betPerLine),
        activeLines: clampLines(data.activeLines),
        session: data.session,
        isNoAdsPurchased: data.isNoAdsPurchased,
        levelsCompletedSinceAd: data.levelsCompletedSinceAd,
        pendingPayout: data.pendingPayout,
        hasSeenLabManual: data.hasSeenLabManual,
        ...livesSnapshot(synced),
        missionBoard,
        screen: 'home',
      };
      set(updates as GameStore);
      if (
        synced.lives !== data.lives ||
        synced.nextLifeAt !== data.nextLifeAt ||
        missionBoard !== data.missionBoard
      ) {
        persistSoon();
      }
    },

    markAdsReady: () => set({ adsReady: true }),

    refreshLives: () => {
      const before = {
        lives: get().lives,
        nextLifeAt: get().nextLifeAt,
      };
      const synced = syncLives(before);
      if (
        synced.lives === before.lives &&
        synced.nextLifeAt === before.nextLifeAt
      ) {
        return;
      }
      set(livesSnapshot(synced));
      persistSoon();
    },

    refreshMissions: () => {
      const before = get().missionBoard;
      const next = refreshMissionBoard(before);
      if (next === before) return;
      set({ missionBoard: next });
      persistSoon();
    },

    markLabManualSeen: () => {
      if (get().hasSeenLabManual) return;
      set({ hasSeenLabManual: true });
      persistSoon();
    },

    flushSession: (opts) => {
      // Finalize in-flight pour so the board on disk matches the engine.
      if (get().pourAnim) {
        get().completePourAnim({ skipAds: true });
      }
      // Only settle jackpot on true background / kill — not iOS inactive
      // (Control Center), which would steal the Collect / 2× offer.
      if (opts?.settleJackpot) {
        collectPendingQuietly(get, set);
      }

      const state = get();
      if (state.screen === 'play') {
        const session = captureSession(get());
        set({ session });
      }
      flushPersistNow();
    },

    selectTube: (index: number) => {
      const { selectedTube, _puzzle, modal, movesLeft, pourAnim } = get();
      if (modal !== 'none' || pourAnim) return;

      if (selectedTube === null) {
        if (_puzzle.getTubes()[index]?.length === 0) return;
        getAudioManager().playSfx('tap');
        set({ selectedTube: index, hintHighlight: null });
        return;
      }

      if (selectedTube === index) {
        getAudioManager().playSfx('tap');
        set({ selectedTube: null });
        return;
      }

      if (movesLeft <= 0) {
        getAudioManager().playSfx('fail');
        set({
          modal: 'out_of_moves',
          selectedTube: null,
          lastMessage: 'Out of moves!',
          consecutiveFailCount: get().consecutiveFailCount + 1,
          hintHighlight: null,
        });
        return;
      }

      const before = _puzzle.getTubes();
      const result = _puzzle.pour(selectedTube, index);
      if (!result.success || result.color === null) {
        if (_puzzle.getTubes()[index]?.length) {
          getAudioManager().playSfx('tap');
          set({ selectedTube: index, hintHighlight: null });
        } else {
          set({ selectedTube: null });
        }
        return;
      }

      getAudioManager().playSfx('pour');
      const after = _puzzle.getTubes();
      const nextMoves = movesLeft - 1;
      let pendingModal: ModalKind = 'none';
      let pendingMessage: string | null = null;
      let pendingCoins: number | undefined;
      let clearReward: number | undefined;
      let pendingLevelsSinceAd: number | undefined;

      if (_puzzle.isWon()) {
        const currentLevel = get().level;
        const reward = coinRewardForClear(currentLevel, get().highestCompleted);
        pendingCoins = get().coins + reward;
        pendingLevelsSinceAd = get().levelsCompletedSinceAd + 1;
        pendingModal = isCampaignComplete(currentLevel)
          ? 'campaign_complete'
          : 'level_complete';
        pendingMessage = isCampaignComplete(currentLevel)
          ? `Campaign complete! All ${MAX_LEVEL} levels cleared`
          : `Level complete! +${reward} coin${reward === 1 ? '' : 's'}`;
        clearReward = reward;
      } else if (nextMoves <= 0) {
        pendingModal = 'out_of_moves';
        pendingMessage = 'Out of moves!';
      }

      set({
        // Keep pre-pour visuals while the pour animation plays
        tubes: before,
        selectedTube: null,
        hintHighlight: null,
        ...(clearReward !== undefined
          ? { lastClearCoinReward: clearReward }
          : {}),
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

    completePourAnim: (opts) => {
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
        const firstClear = get().level > get().highestCompleted;
        Object.assign(
          updates,
          progressAfterClear(
            get().level,
            get().highestCompleted,
            get().unlockedLevel,
          ),
          { consecutiveFailCount: 0, hintHighlight: null },
        );
        set(updates as GameStore);
        trackMission(get, set, 'station_clear', 1);
        if (firstClear) {
          trackMission(get, set, 'first_clear', 1);
        }
      } else if (pourAnim.pendingModal === 'out_of_moves') {
        updates.consecutiveFailCount = get().consecutiveFailCount + 1;
        set(updates as GameStore);
      } else {
        set(updates as GameStore);
      }

      if (
        pourAnim.pendingModal === 'level_complete' ||
        pourAnim.pendingModal === 'campaign_complete'
      ) {
        getAudioManager().playSfx('success');
        set({ session: null });
        persistSoon();
        const since = get().levelsCompletedSinceAd;
        if (
          !opts?.skipAds &&
          since >= INTERSTITIAL_EVERY_N_LEVELS
        ) {
          if (get().isNoAdsPurchased) {
            set({ levelsCompletedSinceAd: 0 });
            persistSoon();
          } else {
            void (async () => {
              set({ isAdLoading: true });
              try {
                const result = await getAdManager().showInterstitialSafe({
                  level: get().level,
                  pourAnimActive: false,
                  isNoAdsPurchased: get().isNoAdsPurchased,
                });
                // Success or policy gate → back off so we don't retry every clear.
                if (result?.success || result === null) {
                  set({ levelsCompletedSinceAd: 0 });
                  persistSoon();
                }
              } finally {
                set({ isAdLoading: false });
              }
            })();
          }
        }
      } else if (pourAnim.pendingModal === 'out_of_moves') {
        getAudioManager().playSfx('fail');
        const session = captureSession(get());
        set({ session });
        persistSoon();
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
      if (!_puzzle.canUndo()) {
        set({ lastMessage: 'Nothing to undo' });
        return;
      }
      if (undoItems <= 0) {
        set({
          modal: 'ad_undo',
          lastMessage: 'Watch an ad to undo recent pours?',
        });
        return;
      }
      _puzzle.undo();
      set({
        undoItems: undoItems - 1,
        movesLeft: Math.min(moveLimit, movesLeft + 1),
        ...syncFromPuzzle(_puzzle),
        selectedTube: null,
        hintHighlight: null,
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
        hintHighlight: null,
        lastMessage: 'Extra tube added',
        session: captureSession(get()),
      });
      persistSoon();
    },

    requestHint: async () => {
      const { pourAnim, modal, adsReady } = get();
      if (pourAnim || modal === 'level_complete' || modal === 'out_of_moves') {
        return false;
      }
      if (!adsReady || !getAdService().isReady('rewarded')) {
        set({ lastMessage: 'Hint ad not available' });
        return false;
      }
      return get().watchAd('rewarded_hint');
    },

    skipLevel: async () => {
      if (get().consecutiveFailCount < SKIP_AFTER_FAILS) {
        set({ lastMessage: 'Skip unlocks after 2 fails on this station' });
        return false;
      }
      if (!get().adsReady || !getAdService().isReady('rewarded')) {
        set({ lastMessage: 'Skip ad not available' });
        return false;
      }
      return get().watchAd('rewarded_skip_level');
    },

    startLevel: (level) => {
      const { unlockedLevel, session } = get();
      const safe = Math.floor(level);
      if (safe < 1 || safe > unlockedLevel || safe > MAX_LEVEL) {
        set({ lastMessage: 'Level locked' });
        return;
      }
      const diff = getLevelDifficulty(safe);
      const sameLevel = get().level === safe;

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
          hintHighlight: null,
          consecutiveFailCount: sameLevel ? get().consecutiveFailCount : 0,
          lastMessage: 'Continuing station…',
        });
        return;
      }

      const spent = spendLife({
        lives: get().lives,
        nextLifeAt: get().nextLifeAt,
      });
      if (!spent) {
        set({
          modal: 'out_of_lives',
          lastMessage: 'Out of lives',
        });
        return;
      }

      const next = createPuzzle(safe);
      set({
        screen: 'play',
        level: safe,
        _puzzle: next,
        ...syncFromPuzzle(next),
        ...moveBudget(safe, get().equippedPathId),
        tierLabel: diff.tierLabel,
        selectedTube: null,
        pourAnim: null,
        modal: 'none',
        hintHighlight: null,
        consecutiveFailCount: 0,
        lastMessage: null,
        session: null,
        ...livesSnapshot(spent),
      });
      persistSoon();
    },

    goHome: () => {
      if (get().pourAnim) {
        get().completePourAnim({ skipAds: true });
      }
      collectPendingQuietly(get, set);
      const session =
        get().screen === 'play' ? captureSession(get()) : get().session;
      set({
        screen: 'home',
        selectedTube: null,
        pourAnim: null,
        modal: 'none',
        lastMessage: session
          ? 'Progress saved — tap the flask to continue'
          : null,
        session,
      });
      flushPersistNow();
    },

    openStore: () => {
      if (get().pourAnim) return;
      collectPendingQuietly(get, set);
      if (get().screen === 'play') {
        const session = captureSession(get());
        set({ screen: 'store', session, selectedTube: null, modal: 'none' });
      } else {
        set({ screen: 'store', modal: 'none' });
      }
      persistSoon();
    },

    openMissions: () => {
      if (get().pourAnim) return;
      collectPendingQuietly(get, set);
      const missionBoard = refreshMissionBoard(get().missionBoard);
      if (get().screen === 'play') {
        const session = captureSession(get());
        set({
          screen: 'missions',
          session,
          selectedTube: null,
          modal: 'none',
          missionBoard,
        });
      } else {
        set({
          screen: 'missions',
          modal: 'none',
          missionBoard,
        });
      }
      persistSoon();
    },

    claimMissionReward: (missionId) => {
      const result = claimMission(get().missionBoard, missionId);
      if (!result) {
        set({ lastMessage: 'Mission not ready to claim' });
        return false;
      }
      const rewardPatch = applyMissionReward(get(), result.reward);
      set({
        missionBoard: result.board,
        ...rewardPatch,
      } as GameStore);
      persistSoon();
      return true;
    },

    buyItem: (id) => {
      const item = getStoreItem(id);
      if (!item) {
        set({ lastMessage: 'Unknown item' });
        return false;
      }
      const { coins, ownedItemIds } = get();
      if (ownedItemIds.includes(id)) {
        set({ lastMessage: 'Already owned' });
        return false;
      }
      if (item.price > coins) {
        set({
          lastMessage: `Need ${item.price - coins} more coins for ${item.name}`,
        });
        return false;
      }
      const nextOwned = ensureOwnedDefaults([...ownedItemIds, id]);
      const patch: Partial<GameStore> = {
        coins: coins - item.price,
        ownedItemIds: nextOwned,
        rareSkinUnlocked: nextOwned.includes(VIAL_CROWN),
        lastMessage:
          item.kind === 'path' && (item.moveScale ?? 1) < 1
            ? `Purchased ${item.name} · harder challenge equipped`
            : `Purchased ${item.name}`,
      };
      if (item.kind === 'path') patch.equippedPathId = id;
      if (item.kind === 'vial') patch.equippedVialId = id;
      if (item.kind === 'palette') patch.equippedPaletteId = id;
      set(patch as GameStore);
      persistSoon();
      return true;
    },

    equipItem: (id) => {
      const item = getStoreItem(id);
      if (!item) {
        set({ lastMessage: 'Unknown item' });
        return false;
      }
      if (!get().ownedItemIds.includes(id)) {
        set({ lastMessage: 'Buy it in the Store first' });
        return false;
      }
      if (item.kind === 'path') {
        set({
          equippedPathId: id,
          lastMessage:
            (item.moveScale ?? 1) < 1
              ? `Equipped ${item.name} · harder move budget on next station`
              : `Equipped ${item.name}`,
        });
      } else if (item.kind === 'palette') {
        set({
          equippedPaletteId: id,
          lastMessage: `Equipped ${item.name} color theme`,
        });
      } else {
        set({ equippedVialId: id, lastMessage: `Equipped ${item.name}` });
      }
      persistSoon();
      return true;
    },

    restartLevel: () => {
      const spent = spendLife({
        lives: get().lives,
        nextLifeAt: get().nextLifeAt,
      });
      if (!spent) {
        set({
          modal: 'out_of_lives',
          lastMessage: 'Out of lives — watch an ad or wait',
        });
        return;
      }

      const level = get().level;
      const next = createPuzzle(level);
      const diff = getLevelDifficulty(level);
      set({
        _puzzle: next,
        ...syncFromPuzzle(next),
        ...moveBudget(level, get().equippedPathId),
        tierLabel: diff.tierLabel,
        selectedTube: null,
        pourAnim: null,
        modal: 'none',
        hintHighlight: null,
        lastMessage: 'Level restarted',
        session: null,
        ...livesSnapshot(spent),
      });
      persistSoon();
    },

    nextLevel: async (opts) => {
      const current = get().level;

      if (opts?.goHome) {
        collectPendingQuietly(get, set);
        set({
          screen: 'home',
          selectedTube: null,
          pourAnim: null,
          modal: 'none',
          lastMessage: null,
          session: null,
          hintHighlight: null,
        });
        persistSoon();
        return;
      }

      if (isCampaignComplete(current)) {
        const openJackpot = !!opts?.openJackpot;
        set({
          screen: openJackpot ? 'play' : 'home',
          modal: openJackpot ? 'slot_machine' : 'campaign_complete',
          lastMessage: `You finished all ${MAX_LEVEL} levels!`,
          session: null,
          consecutiveFailCount: 0,
          hintHighlight: null,
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
          consecutiveFailCount: 0,
          hintHighlight: null,
        });
        persistSoon();
        return;
      }

      const spent = spendLife({
        lives: get().lives,
        nextLifeAt: get().nextLifeAt,
      });
      if (!spent) {
        collectPendingQuietly(get, set);
        set({
          screen: 'home',
          modal: 'out_of_lives',
          selectedTube: null,
          pourAnim: null,
          session: null,
          consecutiveFailCount: 0,
          hintHighlight: null,
          lastMessage: 'Station cleared — need a life for the next one',
        });
        persistSoon();
        return;
      }

      const next = createPuzzle(level);
      const diff = getLevelDifficulty(level);
      const openJackpot = !!opts?.openJackpot;
      set({
        screen: 'play',
        level,
        _puzzle: next,
        ...syncFromPuzzle(next),
        ...moveBudget(level, get().equippedPathId),
        tierLabel: diff.tierLabel,
        selectedTube: null,
        pourAnim: null,
        modal: openJackpot ? 'slot_machine' : 'none',
        consecutiveFailCount: 0,
        hintHighlight: null,
        lastMessage: openJackpot
          ? `Level ${level} ready · spin the Centrifuge`
          : `Level ${level} · ${diff.tierLabel}`,
        session: null,
        ...livesSnapshot(spent),
      });
      persistSoon();
    },

    purchaseRemoveAds: async () => {
      if (get().isNoAdsPurchased) {
        set({ lastMessage: 'Ads already removed' });
        return true;
      }
      set({ isAdLoading: true });
      try {
        const result = await iapPurchaseRemoveAds();
        if (!result.success) {
          set({
            isAdLoading: false,
            lastMessage: result.cancelled ? null : result.message,
          });
          return false;
        }
        set({
          isNoAdsPurchased: true,
          isAdLoading: false,
          lastMessage: result.message,
        });
        await getAdService().hideBanner();
        persistSoon();
        return true;
      } catch (e) {
        set({
          isAdLoading: false,
          lastMessage: e instanceof Error ? e.message : 'Purchase failed',
        });
        return false;
      }
    },

    restorePurchases: async () => {
      set({ isAdLoading: true });
      try {
        const result = await iapRestorePurchases();
        if (result.isNoAdsPurchased) {
          set({
            isNoAdsPurchased: true,
            isAdLoading: false,
            lastMessage: result.message,
          });
          await getAdService().hideBanner();
          persistSoon();
          return true;
        }
        set({ isAdLoading: false, lastMessage: result.message });
        return false;
      } catch (e) {
        set({
          isAdLoading: false,
          lastMessage: e instanceof Error ? e.message : 'Restore failed',
        });
        return false;
      }
    },

    openSlotMachine: () => {
      const pending = get().pendingPayout;
      set({
        modal: pending ? 'ad_2x_payout' : 'slot_machine',
      });
    },

    closeModal: () => {
      collectPendingQuietly(get, set);
      set({ modal: 'none' });
    },

    setBetPerLine: (bet: number) => {
      set({ betPerLine: clampBet(bet) });
      persistSoon();
    },

    setActiveLines: (lines: number) => {
      set({ activeLines: clampLines(lines) });
      persistSoon();
    },

    cycleBet: (direction: 1 | -1) => {
      const current = get().betPerLine;
      const idx = BET_OPTIONS.indexOf(current);
      const next = BET_OPTIONS[(idx + direction + BET_OPTIONS.length) % BET_OPTIONS.length];
      set({ betPerLine: next });
      persistSoon();
    },

    cycleLines: (direction: 1 | -1) => {
      const current = get().activeLines;
      const next = clampLines(current + direction);
      set({ activeLines: next });
      persistSoon();
    },

    spin: async () => {
      if (get().spinInFlight) return;
      set({ spinInFlight: true });
      try {
      const { coins, freeSpins, _jackpot, betPerLine, activeLines } = get();
      const cost = spinCost(betPerLine, activeLines);
      const canUseFreeSpin = freeSpins > 0 && isFreeSpinBet(betPerLine);

      if (canUseFreeSpin) {
        const remaining = freeSpins - 1;
        const result = _jackpot.freeSpin(betPerLine, activeLines);
        const payout = result.payout;

        // While free spins remain, auto-collect — no Collect / 2× dialog
        if (remaining > 0) {
          const cosmetics = grantCosmeticFromPayout(
            get().ownedItemIds,
            payout.unlockRareSkin,
          );
          set({
            freeSpins: remaining,
            lastSpin: result,
            pendingPayout: null,
            coins: coins + payout.coins,
            undoItems: get().undoItems + payout.undoItems,
            extraTubeItems: get().extraTubeItems + payout.extraTubeItems,
            ...cosmetics,
            modal: 'spin_result',
            lastMessage:
              payout.kind === 'none'
                ? `No win · ${remaining} free spin${remaining === 1 ? '' : 's'} left`
                : `${payout.label} · auto collected · ${remaining} free left`,
          });
          trackMission(get, set, 'centrifuge_spin', 1);
          persistSoon();
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
        trackMission(get, set, 'centrifuge_spin', 1);
        persistSoon();
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
      trackMission(get, set, 'centrifuge_spin', 1);
      persistSoon();
      } finally {
        set({ spinInFlight: false });
      }
    },

    claimPendingPayout: () => {
      settlePendingPayout(get, set, 1);
    },

    watchAd: async (placement: AdPlacement) => {
      set({ isAdLoading: true });
      try {
        const result = await getAdService().showRewarded(placement);
        if (!result.success || !result.rewarded) {
          set({
            isAdLoading: false,
            lastMessage: result.message || 'Ad not completed',
          });
          return false;
        }

        if (placement === 'rewarded_extra_tube') {
          const { _puzzle } = get();
          _puzzle.addEmptyTube();
          set({
            isAdLoading: false,
            ...syncFromPuzzle(_puzzle),
            modal: 'none',
            hintHighlight: null,
            lastMessage: '+1 Extra Empty Tube',
            session: captureSession(get()),
          });
          persistSoon();
        } else if (placement === 'rewarded_undo') {
          const { _puzzle, movesLeft, moveLimit } = get();
          const count = adUndoCount(_puzzle.undoDepth());
          if (count <= 0) {
            set({
              isAdLoading: false,
              modal: 'none',
              lastMessage: 'Nothing to undo',
            });
            return false;
          }
          const undone = _puzzle.undoMany(count);
          set({
            isAdLoading: false,
            movesLeft: Math.min(moveLimit, movesLeft + undone),
            ...syncFromPuzzle(_puzzle),
            selectedTube: null,
            hintHighlight: null,
            modal: 'none',
            lastMessage: `Undid ${undone} pour${undone === 1 ? '' : 's'}`,
            session: captureSession({
              ...get(),
              movesLeft: Math.min(moveLimit, movesLeft + undone),
              modal: 'none',
            }),
          });
          persistSoon();
        } else if (placement === 'rewarded_hint') {
          const hint = get()._puzzle.findHint();
          if (!hint) {
            set({
              isAdLoading: false,
              lastMessage: 'No valid pour right now',
            });
            return false;
          }
          set({
            isAdLoading: false,
            hintHighlight: hint,
            modal: 'none',
            lastMessage: 'Hint: pour the highlighted vials',
          });
        } else if (placement === 'rewarded_skip_level') {
          const current = get().level;
          const unlockedLevel = Math.min(
            MAX_LEVEL,
            Math.max(
              get().unlockedLevel,
              current >= MAX_LEVEL ? MAX_LEVEL : current + 1,
            ),
          );
          set({
            isAdLoading: false,
            unlockedLevel,
            consecutiveFailCount: 0,
            hintHighlight: null,
            session: null,
            modal: 'none',
            lastMessage:
              current >= MAX_LEVEL
                ? 'Station skipped'
                : `Skipped · Station ${current + 1} unlocked`,
          });
          persistSoon();
          if (current < MAX_LEVEL && unlockedLevel >= current + 1) {
            await get().nextLevel({ openJackpot: false });
          } else {
            set({ screen: 'home' });
            persistSoon();
          }
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
          settlePendingPayout(get, set, 2);
        } else if (placement === 'rewarded_life') {
          const granted = grantLife({
            lives: get().lives,
            nextLifeAt: get().nextLifeAt,
          });
          set({
            isAdLoading: false,
            ...livesSnapshot(granted),
            modal: 'none',
            lastMessage: `+1 life · ${granted.lives}/${MAX_LIVES}`,
          });
          persistSoon();
        } else {
          set({ isAdLoading: false });
        }
        trackMission(get, set, 'rewarded_ad', 1);
        persistSoon();
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

const PERSIST_DEBOUNCE_MS = 400;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function writePersistPayload(): void {
  void savePersistedGame(buildPersistPayload(useGameStore.getState()));
}

persistSoon = () => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    writePersistPayload();
  }, PERSIST_DEBOUNCE_MS);
};

flushPersistNow = () => {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  writePersistPayload();
};

export type { Tube, SpinResult, SlotSymbol, Payout, BetOption, MissionView };
export {
  SPIN_COST,
  LEVEL_COIN_REWARD,
  REPLAY_COIN_REWARD,
  coinRewardForClear,
  MAX_LEVEL,
  MAX_LIVES,
  BET_OPTIONS,
  spinCost,
  isFreeSpinBet,
  msUntilNextLife,
  formatRegenCountdown,
  countClaimableMissions,
  listMissionViews,
  formatRewardLabel,
};
