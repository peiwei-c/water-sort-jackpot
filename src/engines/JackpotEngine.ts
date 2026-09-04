/**
 * Pure jackpot / multi-line slot engine.
 * 3×3 grid, up to 5 paylines, coin bets — no UI.
 */

export enum SlotSymbol {
  /** Low filler — triple pays a flat 1 coin; pairs do not pay. */
  Drop = 'drop',
  Coin = 'coin',
  Undo = 'undo',
  ExtraTube = 'extra_tube',
  Crown = 'crown',
}

export const SLOT_SYMBOLS: SlotSymbol[] = [
  SlotSymbol.Drop,
  SlotSymbol.Coin,
  SlotSymbol.Undo,
  SlotSymbol.ExtraTube,
  SlotSymbol.Crown,
];

/** Coins wagered per active payline. */
export const BET_OPTIONS = [1, 5, 10, 25] as const;
export type BetOption = (typeof BET_OPTIONS)[number];

/** Free spins from ads only apply at these bet levels. */
export const FREE_SPIN_BETS = [1, 5, 10] as const;
export type FreeSpinBet = (typeof FREE_SPIN_BETS)[number];

export const MAX_LINES = 5;
export const DEFAULT_BET: BetOption = 5;
export const DEFAULT_LINES = 5;

export function isFreeSpinBet(bet: number): bet is FreeSpinBet {
  return (FREE_SPIN_BETS as readonly number[]).includes(bet);
}

/** @deprecated Use bet × lines. Kept as default single-line-ish reference. */
export const SPIN_COST = DEFAULT_BET * DEFAULT_LINES;
/** First-clear reward for sorting a station. */
export const LEVEL_COIN_REWARD = 10;
/** Replay reward when the station was already cleared. */
export const REPLAY_COIN_REWARD = 1;

/** Coins earned for clearing `level` given prior `highestCompleted`. */
export function coinRewardForClear(
  level: number,
  highestCompleted: number,
): number {
  return level <= highestCompleted ? REPLAY_COIN_REWARD : LEVEL_COIN_REWARD;
}

/** Relative weights for each symbol (higher = more common). */
export const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  // Drop is common filler so Coin / other wins hit less often
  [SlotSymbol.Drop]: 38,
  [SlotSymbol.Coin]: 18,
  [SlotSymbol.Undo]: 20,
  [SlotSymbol.ExtraTube]: 16,
  [SlotSymbol.Crown]: 8,
};

/** Base coin multipliers × betPerLine for a full 3-match line. */
export const LINE_PAYTABLE: Record<SlotSymbol, number> = {
  [SlotSymbol.Crown]: 50,
  [SlotSymbol.Coin]: 8,
  [SlotSymbol.Undo]: 3,
  [SlotSymbol.ExtraTube]: 3,
  /** Flat payout (not × bet) — see evaluateLine. */
  [SlotSymbol.Drop]: 1,
};

/** Pair consolation multiplier × betPerLine (Drop pairs do not pay). */
export const PAIR_MULTIPLIER = 1;

export type SlotRow = [SlotSymbol, SlotSymbol, SlotSymbol];
export type SlotGrid = [SlotRow, SlotRow, SlotRow];

export type PaylineId = 1 | 2 | 3 | 4 | 5;

export type PaylineDef = {
  id: PaylineId;
  name: string;
  /** [row, col] cells left → right */
  cells: [[number, number], [number, number], [number, number]];
};

export const PAYLINES: PaylineDef[] = [
  { id: 1, name: 'Top', cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 2, name: 'Mid', cells: [[1, 0], [1, 1], [1, 2]] },
  { id: 3, name: 'Bot', cells: [[2, 0], [2, 1], [2, 2]] },
  { id: 4, name: 'Diag ↘', cells: [[0, 0], [1, 1], [2, 2]] },
  { id: 5, name: 'Diag ↗', cells: [[2, 0], [1, 1], [0, 2]] },
];

export type PayoutKind =
  | 'grand_jackpot'
  | 'extra_tube'
  | 'undo_pack'
  | 'triple_coin'
  | 'drop_min'
  | 'line_win'
  | 'consolation'
  | 'none';

export type LineWin = {
  lineId: PaylineId;
  lineName: string;
  symbols: SlotRow;
  kind: PayoutKind;
  coins: number;
  undoItems: number;
  extraTubeItems: number;
  unlockRareSkin: boolean;
  label: string;
};

export type Payout = {
  kind: PayoutKind;
  coins: number;
  undoItems: number;
  extraTubeItems: number;
  unlockRareSkin: boolean;
  label: string;
  lineWins: LineWin[];
  linesPlayed: number;
  betPerLine: number;
};

export type SpinResult = {
  /** Middle row kept for simple reel UIs / backwards compatibility. */
  reels: SlotRow;
  grid: SlotGrid;
  payout: Payout;
  tokensSpent: number;
  betPerLine: number;
  linesPlayed: number;
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng: () => number): SlotSymbol {
  const total = SLOT_SYMBOLS.reduce((sum, s) => sum + SYMBOL_WEIGHTS[s], 0);
  let roll = rng() * total;
  for (const symbol of SLOT_SYMBOLS) {
    roll -= SYMBOL_WEIGHTS[symbol];
    if (roll <= 0) return symbol;
  }
  return SlotSymbol.Coin;
}

export function spinCost(betPerLine: number, lines: number): number {
  return Math.max(0, betPerLine) * Math.max(0, lines);
}

export function clampBet(bet: number): BetOption {
  if ((BET_OPTIONS as readonly number[]).includes(bet)) {
    return bet as BetOption;
  }
  // Snap to nearest option
  let best: BetOption = BET_OPTIONS[0];
  let bestDist = Math.abs(bet - best);
  for (const opt of BET_OPTIONS) {
    const d = Math.abs(bet - opt);
    if (d < bestDist) {
      best = opt;
      bestDist = d;
    }
  }
  return best;
}

export function clampLines(lines: number): number {
  return Math.max(1, Math.min(MAX_LINES, Math.floor(lines)));
}

function readLine(grid: SlotGrid, def: PaylineDef): SlotRow {
  return def.cells.map(([r, c]) => grid[r][c]) as SlotRow;
}

/**
 * Score a single 3-symbol payline.
 * Coin payouts scale with betPerLine; item awards stay small but scale lightly.
 */
export function evaluateLine(
  symbols: SlotRow,
  line: PaylineDef,
  betPerLine: number,
): LineWin | null {
  const [a, b, c] = symbols;
  const allSame = a === b && b === c;
  const bet = Math.max(1, betPerLine);

  if (allSame) {
    switch (a) {
      case SlotSymbol.Crown:
        return {
          lineId: line.id,
          lineName: line.name,
          symbols,
          kind: 'grand_jackpot',
          coins: LINE_PAYTABLE[SlotSymbol.Crown] * bet,
          undoItems: 0,
          extraTubeItems: 0,
          unlockRareSkin: true,
          label: `${line.name}: 👑👑👑 +${LINE_PAYTABLE[SlotSymbol.Crown] * bet}🪙`,
        };
      case SlotSymbol.ExtraTube:
        return {
          lineId: line.id,
          lineName: line.name,
          symbols,
          kind: 'extra_tube',
          coins: LINE_PAYTABLE[SlotSymbol.ExtraTube] * bet,
          undoItems: 0,
          extraTubeItems: Math.max(1, Math.floor(bet / 5)),
          unlockRareSkin: false,
          label: `${line.name}: 🧋🧋🧋 +${Math.max(1, Math.floor(bet / 5))} cup`,
        };
      case SlotSymbol.Undo:
        return {
          lineId: line.id,
          lineName: line.name,
          symbols,
          kind: 'undo_pack',
          coins: LINE_PAYTABLE[SlotSymbol.Undo] * bet,
          undoItems: Math.max(1, Math.floor(bet / 5) + 1),
          extraTubeItems: 0,
          unlockRareSkin: false,
          label: `${line.name}: 🔄🔄🔄 +undos`,
        };
      case SlotSymbol.Coin:
        return {
          lineId: line.id,
          lineName: line.name,
          symbols,
          kind: 'triple_coin',
          coins: LINE_PAYTABLE[SlotSymbol.Coin] * bet,
          undoItems: 0,
          extraTubeItems: 0,
          unlockRareSkin: false,
          label: `${line.name}: 🪙🪙🪙 +${LINE_PAYTABLE[SlotSymbol.Coin] * bet}`,
        };
      case SlotSymbol.Drop:
        // Flat +1 coin — low filler win, does not scale with bet
        return {
          lineId: line.id,
          lineName: line.name,
          symbols,
          kind: 'drop_min',
          coins: LINE_PAYTABLE[SlotSymbol.Drop],
          undoItems: 0,
          extraTubeItems: 0,
          unlockRareSkin: false,
          label: `${line.name}: 💧💧💧 +1🪙`,
        };
    }
  }

  const pairSymbol =
    a === b && a !== c
      ? a
      : b === c && b !== a
        ? b
        : null;

  // Drop pairs never pay — they only dilute other hits
  // Only adjacent pairs (left-to-right) pay; a===c with different middle does not.
  if (pairSymbol !== null && pairSymbol !== SlotSymbol.Drop) {
    const coins = PAIR_MULTIPLIER * bet;
    return {
      lineId: line.id,
      lineName: line.name,
      symbols,
      kind: 'consolation',
      coins,
      undoItems: 0,
      extraTubeItems: 0,
      unlockRareSkin: false,
      label: `${line.name}: pair +${coins}🪙`,
    };
  }

  return null;
}

export function evaluateGrid(
  grid: SlotGrid,
  linesPlayed: number,
  betPerLine: number,
): Payout {
  const lines = clampLines(linesPlayed);
  const bet = clampBet(betPerLine);
  const active = PAYLINES.slice(0, lines);
  const lineWins: LineWin[] = [];

  for (const def of active) {
    const symbols = readLine(grid, def);
    const win = evaluateLine(symbols, def, bet);
    if (win) lineWins.push(win);
  }

  if (lineWins.length === 0) {
    return {
      kind: 'none',
      coins: 0,
      undoItems: 0,
      extraTubeItems: 0,
      unlockRareSkin: false,
      label: 'No win',
      lineWins: [],
      linesPlayed: lines,
      betPerLine: bet,
    };
  }

  const coins = lineWins.reduce((s, w) => s + w.coins, 0);
  const undoItems = lineWins.reduce((s, w) => s + w.undoItems, 0);
  const extraTubeItems = lineWins.reduce((s, w) => s + w.extraTubeItems, 0);
  const unlockRareSkin = lineWins.some((w) => w.unlockRareSkin);

  const kindPriority: PayoutKind[] = [
    'grand_jackpot',
    'extra_tube',
    'undo_pack',
    'triple_coin',
    'drop_min',
    'line_win',
    'consolation',
  ];
  let kind: PayoutKind = 'line_win';
  for (const k of kindPriority) {
    if (lineWins.some((w) => w.kind === k)) {
      kind = k;
      break;
    }
  }

  const label =
    lineWins.length === 1
      ? lineWins[0].label
      : `${lineWins.length} lines hit · +${coins}🪙`;

  return {
    kind,
    coins,
    undoItems,
    extraTubeItems,
    unlockRareSkin,
    label,
    lineWins,
    linesPlayed: lines,
    betPerLine: bet,
  };
}

/** Back-compat: treat a 3-reel result as the middle row only (1 line). */
export function evaluatePayout(
  reels: SlotRow,
  betPerLine: number = DEFAULT_BET,
): Payout {
  const grid: SlotGrid = [
    [SlotSymbol.Coin, SlotSymbol.Undo, SlotSymbol.Crown],
    reels,
    [SlotSymbol.Crown, SlotSymbol.ExtraTube, SlotSymbol.Coin],
  ];
  // Only score the middle line for legacy 3-reel calls
  const mid = PAYLINES[1];
  const win = evaluateLine(reels, mid, betPerLine);
  if (!win) {
    return {
      kind: 'none',
      coins: 0,
      undoItems: 0,
      extraTubeItems: 0,
      unlockRareSkin: false,
      label: 'No win',
      lineWins: [],
      linesPlayed: 1,
      betPerLine,
    };
  }
  return {
    kind: win.kind,
    coins: win.coins,
    undoItems: win.undoItems,
    extraTubeItems: win.extraTubeItems,
    unlockRareSkin: win.unlockRareSkin,
    label: win.label,
    lineWins: [win],
    linesPlayed: 1,
    betPerLine,
  };
}

/** Only 1× (collect) or 2× (rewarded ad) are allowed. */
export type PayoutMultiplier = 1 | 2;

export function applyPayoutMultiplier(
  payout: Payout,
  multiplier: number,
): Payout {
  const m: PayoutMultiplier = multiplier === 2 ? 2 : 1;
  if (m <= 1) return payout;
  return {
    ...payout,
    coins: payout.coins * m,
    undoItems: payout.undoItems * m,
    extraTubeItems: payout.extraTubeItems * m,
    label: `${payout.label} (×${m})`,
    lineWins: payout.lineWins.map((w) => ({
      ...w,
      coins: w.coins * m,
      undoItems: w.undoItems * m,
      extraTubeItems: w.extraTubeItems * m,
      label: `${w.label} (×${m})`,
    })),
  };
}

export function emptyGrid(): SlotGrid {
  return [
    [SlotSymbol.Drop, SlotSymbol.Undo, SlotSymbol.Crown],
    [SlotSymbol.ExtraTube, SlotSymbol.Coin, SlotSymbol.Drop],
    [SlotSymbol.Crown, SlotSymbol.Drop, SlotSymbol.Coin],
  ];
}

export class JackpotEngine {
  private rng: () => number;
  private spinCount = 0;

  constructor(seed?: number) {
    this.rng = mulberry32(seed ?? Date.now());
  }

  canAffordSpin(
    coins: number,
    betPerLine: number = DEFAULT_BET,
    lines: number = DEFAULT_LINES,
  ): boolean {
    return coins >= spinCost(betPerLine, lines);
  }

  needsFreeSpinAd(
    coins: number,
    betPerLine: number = DEFAULT_BET,
    lines: number = DEFAULT_LINES,
  ): boolean {
    return coins < spinCost(betPerLine, lines);
  }

  rollGrid(): SlotGrid {
    this.spinCount += 1;
    return [
      [pickWeighted(this.rng), pickWeighted(this.rng), pickWeighted(this.rng)],
      [pickWeighted(this.rng), pickWeighted(this.rng), pickWeighted(this.rng)],
      [pickWeighted(this.rng), pickWeighted(this.rng), pickWeighted(this.rng)],
    ];
  }

  /** @deprecated Prefer rollGrid — returns middle row only. */
  roll(): SlotRow {
    const grid = this.rollGrid();
    return grid[1];
  }

  spin(
    coins: number,
    betPerLine: number = DEFAULT_BET,
    lines: number = DEFAULT_LINES,
  ): SpinResult | null {
    const bet = clampBet(betPerLine);
    const lineCount = clampLines(lines);
    const cost = spinCost(bet, lineCount);
    if (coins < cost) return null;

    const grid = this.rollGrid();
    const payout = evaluateGrid(grid, lineCount, bet);
    return {
      reels: grid[1],
      grid,
      payout,
      tokensSpent: cost,
      betPerLine: bet,
      linesPlayed: lineCount,
    };
  }

  freeSpin(
    betPerLine: number = DEFAULT_BET,
    lines: number = DEFAULT_LINES,
  ): SpinResult {
    const bet = clampBet(betPerLine);
    const lineCount = clampLines(lines);
    const grid = this.rollGrid();
    const payout = evaluateGrid(grid, lineCount, bet);
    return {
      reels: grid[1],
      grid,
      payout,
      tokensSpent: 0,
      betPerLine: bet,
      linesPlayed: lineCount,
    };
  }

  getSpinCount(): number {
    return this.spinCount;
  }

  static evaluate(reels: SlotRow, betPerLine: number = DEFAULT_BET): Payout {
    return evaluatePayout(reels, betPerLine);
  }
}
