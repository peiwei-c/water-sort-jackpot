import {
  JackpotEngine,
  SlotSymbol,
  SPIN_COST,
  LEVEL_COIN_REWARD,
  REPLAY_COIN_REWARD,
  coinRewardForClear,
  DEFAULT_BET,
  DEFAULT_LINES,
  BET_OPTIONS,
  FREE_SPIN_BETS,
  isFreeSpinBet,
  LINE_PAYTABLE,
  spinCost,
  evaluatePayout,
  evaluateLine,
  evaluateGrid,
  applyPayoutMultiplier,
  PAYLINES,
  type SlotGrid,
} from '../JackpotEngine';

describe('JackpotEngine multi-line', () => {
  describe('betting', () => {
    it('exposes bet options and default spin cost = bet × lines', () => {
      expect(BET_OPTIONS).toEqual([1, 5, 10, 25]);
      expect(SPIN_COST).toBe(DEFAULT_BET * DEFAULT_LINES);
      expect(LEVEL_COIN_REWARD).toBe(10);
      expect(REPLAY_COIN_REWARD).toBe(1);
      expect(coinRewardForClear(3, 0)).toBe(10);
      expect(coinRewardForClear(3, 2)).toBe(10);
      expect(coinRewardForClear(3, 3)).toBe(1);
      expect(coinRewardForClear(2, 5)).toBe(1);
      expect(spinCost(5, 5)).toBe(25);
      expect(spinCost(10, 3)).toBe(30);
    });

    it('rejects spin when coins < bet × lines', () => {
      const engine = new JackpotEngine(1);
      expect(engine.canAffordSpin(24, 5, 5)).toBe(false);
      expect(engine.spin(24, 5, 5)).toBeNull();
    });

    it('spends bet × lines on a paid spin', () => {
      const engine = new JackpotEngine(99);
      const result = engine.spin(100, 5, 5);
      expect(result).not.toBeNull();
      expect(result!.tokensSpent).toBe(25);
      expect(result!.grid).toHaveLength(3);
      expect(result!.grid[0]).toHaveLength(3);
      expect(result!.linesPlayed).toBe(5);
      expect(result!.betPerLine).toBe(5);
    });

    it('freeSpin costs zero coins but still scores lines', () => {
      const engine = new JackpotEngine(7);
      const result = engine.freeSpin(5, 3);
      expect(result.tokensSpent).toBe(0);
      expect(result.linesPlayed).toBe(3);
    });

    it('free spins apply only at bets 1 / 5 / 10', () => {
      expect(FREE_SPIN_BETS).toEqual([1, 5, 10]);
      expect(isFreeSpinBet(1)).toBe(true);
      expect(isFreeSpinBet(5)).toBe(true);
      expect(isFreeSpinBet(10)).toBe(true);
      expect(isFreeSpinBet(25)).toBe(false);
    });
  });

  describe('paylines', () => {
    it('scores a crown jackpot on a line scaled by bet', () => {
      const win = evaluateLine(
        [SlotSymbol.Crown, SlotSymbol.Crown, SlotSymbol.Crown],
        PAYLINES[0],
        5,
      );
      expect(win).not.toBeNull();
      expect(win!.kind).toBe('grand_jackpot');
      expect(win!.coins).toBe(LINE_PAYTABLE[SlotSymbol.Crown] * 5);
      expect(win!.unlockRareSkin).toBe(true);
    });

    it('stacks multiple line wins on a grid', () => {
      const grid: SlotGrid = [
        [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Coin],
        [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Coin],
        [SlotSymbol.Undo, SlotSymbol.Crown, SlotSymbol.ExtraTube],
      ];
      const payout = evaluateGrid(grid, 5, 1);
      // Top + Mid triples + possibly diagonals with pairs
      expect(payout.lineWins.length).toBeGreaterThanOrEqual(2);
      expect(payout.coins).toBeGreaterThan(0);
    });

    it('only evaluates the selected number of lines', () => {
      const grid: SlotGrid = [
        [SlotSymbol.Crown, SlotSymbol.Crown, SlotSymbol.Crown],
        [SlotSymbol.Undo, SlotSymbol.Coin, SlotSymbol.ExtraTube],
        [SlotSymbol.Coin, SlotSymbol.Undo, SlotSymbol.Crown],
      ];
      const oneLine = evaluateGrid(grid, 1, 1);
      const fiveLines = evaluateGrid(grid, 5, 1);
      expect(oneLine.lineWins.length).toBe(1);
      expect(fiveLines.linesPlayed).toBe(5);
    });

    it('awards flat +1 for triple Drop and ignores Drop pairs', () => {
      const triple = evaluateLine(
        [SlotSymbol.Drop, SlotSymbol.Drop, SlotSymbol.Drop],
        PAYLINES[0],
        25,
      );
      expect(triple!.kind).toBe('drop_min');
      expect(triple!.coins).toBe(1);

      const pair = evaluateLine(
        [SlotSymbol.Drop, SlotSymbol.Drop, SlotSymbol.Crown],
        PAYLINES[1],
        10,
      );
      expect(pair).toBeNull();
    });

    it('awards pair consolation scaled by bet', () => {
      const win = evaluateLine(
        [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Crown],
        PAYLINES[1],
        10,
      );
      expect(win!.kind).toBe('consolation');
      expect(win!.coins).toBe(10);
    });

    it('does not pay non-adjacent a===c pairs', () => {
      const win = evaluateLine(
        [SlotSymbol.Coin, SlotSymbol.Crown, SlotSymbol.Coin],
        PAYLINES[1],
        10,
      );
      expect(win).toBeNull();
    });
  });

  describe('legacy evaluatePayout', () => {
    it('still scores a middle-row triple', () => {
      const p = evaluatePayout(
        [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Coin],
        5,
      );
      expect(p.kind).toBe('triple_coin');
      expect(p.coins).toBe(LINE_PAYTABLE[SlotSymbol.Coin] * 5);
    });
  });

  describe('applyPayoutMultiplier', () => {
    it('doubles stacked coin rewards', () => {
      const base = evaluatePayout(
        [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Coin],
        5,
      );
      const doubled = applyPayoutMultiplier(base, 2);
      expect(doubled.coins).toBe(base.coins * 2);
    });

    it('clamps multipliers above 2 down to 1×', () => {
      const base = evaluatePayout(
        [SlotSymbol.Coin, SlotSymbol.Coin, SlotSymbol.Coin],
        5,
      );
      expect(applyPayoutMultiplier(base, 1000).coins).toBe(base.coins);
    });
  });
});
