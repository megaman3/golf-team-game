import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import { stableford, defaultStablefordSettings } from './stableford';
import type { HoleStrokeInput } from './types';

const players: RoundPlayer[] = [
  { playerId: 'a', name: 'Anna', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'b', name: 'Björn', exactHandicapUsed: 0, teeId: 'white' },
];

function holeInput(
  par: number,
  strokesByPlayer: Record<string, number | null>,
  handicapStrokesByPlayer: Record<string, number> = {},
): HoleStrokeInput {
  return { hole: 1, par, index: 5, strokesByPlayer, handicapStrokesByPlayer };
}

describe('stableford.computeHolePoints', () => {
  it('gives 2 points for a net score equal to par', () => {
    const result = stableford.computeHolePoints(holeInput(4, { a: 4 }), defaultStablefordSettings, [players[0]]);
    expect(result.pointsByPlayer).toEqual({ a: 2 });
  });

  it('gives 3 points one under net par and 4 points two under', () => {
    const oneUnder = stableford.computeHolePoints(holeInput(4, { a: 3 }), defaultStablefordSettings, [players[0]]);
    expect(oneUnder.pointsByPlayer).toEqual({ a: 3 });

    const twoUnder = stableford.computeHolePoints(holeInput(5, { a: 3 }), defaultStablefordSettings, [players[0]]);
    expect(twoUnder.pointsByPlayer).toEqual({ a: 4 });
  });

  it('gives 1 point one over net par and 0 points two or more over', () => {
    const oneOver = stableford.computeHolePoints(holeInput(4, { a: 5 }), defaultStablefordSettings, [players[0]]);
    expect(oneOver.pointsByPlayer).toEqual({ a: 1 });

    const twoOver = stableford.computeHolePoints(holeInput(4, { a: 6 }), defaultStablefordSettings, [players[0]]);
    expect(twoOver.pointsByPlayer).toEqual({ a: 0 });

    const wayOver = stableford.computeHolePoints(holeInput(4, { a: 9 }), defaultStablefordSettings, [players[0]]);
    expect(wayOver.pointsByPlayer).toEqual({ a: 0 });
  });

  it("computes each player's points independently - one player's score never affects another's", () => {
    const result = stableford.computeHolePoints(holeInput(4, { a: 3, b: 6 }), defaultStablefordSettings, players);
    expect(result.pointsByPlayer).toEqual({ a: 3, b: 0 });
  });

  it('applies handicap strokes before scoring against par', () => {
    const result = stableford.computeHolePoints(holeInput(4, { a: 5 }, { a: 1 }), defaultStablefordSettings, [
      players[0],
    ]);
    // net = 5 - 1 = 4 = par -> 2 points, not the 1 point raw strokes would give.
    expect(result.pointsByPlayer).toEqual({ a: 2 });
  });

  it('is incomplete until every player in the round has entered a stroke', () => {
    const result = stableford.computeHolePoints(holeInput(4, { a: 4, b: null }), defaultStablefordSettings, players);
    expect(result.complete).toBe(false);
    expect(result.pointsByPlayer).toBeUndefined();
  });
});

describe('stableford.computeRoundTotals', () => {
  it('sums each player\'s points across complete holes, independently', () => {
    const holeResults = [
      stableford.computeHolePoints(holeInput(4, { a: 3, b: 5 }), defaultStablefordSettings, players), // a3 b1
      stableford.computeHolePoints(holeInput(3, { a: 3, b: 3 }), defaultStablefordSettings, players), // a2 b2
    ];
    const totals = stableford.computeRoundTotals(holeResults, players);
    expect(totals.pointsByPlayer).toEqual({ a: 5, b: 3 });
    expect(totals.winnerPlayerIds).toEqual(['a']);
  });
});
