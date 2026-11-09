import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import { bestBallWorstBall, defaultBestBallWorstBallSettings } from './bestBallWorstBall';
import type { HoleStrokeInput } from './types';

const players: RoundPlayer[] = [
  { playerId: 'a1', name: 'Anna', exactHandicapUsed: 0, teamId: 'A' },
  { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A' },
  { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B' },
  { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B' },
];

function holeInput(
  strokesByPlayer: Record<string, number | null>,
  handicapStrokesByPlayer: Record<string, number> = {},
): HoleStrokeInput {
  return { hole: 1, par: 4, index: 5, strokesByPlayer, handicapStrokesByPlayer };
}

describe('bestBallWorstBall.computeHolePoints', () => {
  it('awards both sub-match points to the team that wins both', () => {
    const input = holeInput({ a1: 3, a2: 5, b1: 4, b2: 6 });
    const result = bestBallWorstBall.computeHolePoints(input, defaultBestBallWorstBallSettings, players);
    expect(result.complete).toBe(true);
    expect(result.pointsByTeam).toEqual({ A: 2, B: 0 });
    expect(result.detail).toEqual({ bestBallWinner: 'A', worstBallWinner: 'A' });
  });

  it('splits sub-matches between teams when each wins one', () => {
    // Team A best net 3 (wins bästboll), team B best net 4.
    // Team A worst net 7, team B worst net 5 (B wins sämstboll).
    const input = holeInput({ a1: 3, a2: 7, b1: 4, b2: 5 });
    const result = bestBallWorstBall.computeHolePoints(input, defaultBestBallWorstBallSettings, players);
    expect(result.pointsByTeam).toEqual({ A: 1, B: 1 });
    expect(result.detail).toEqual({ bestBallWinner: 'A', worstBallWinner: 'B' });
  });

  it('gives 0 points to both teams on a tied sub-match', () => {
    // Equal lowest net (bästboll tie); worst balls differ.
    const input = holeInput({ a1: 4, a2: 6, b1: 4, b2: 5 });
    const result = bestBallWorstBall.computeHolePoints(input, defaultBestBallWorstBallSettings, players);
    expect(result.detail).toEqual({ bestBallWinner: 'tie', worstBallWinner: 'B' });
    expect(result.pointsByTeam).toEqual({ A: 0, B: 1 });
  });

  it('is incomplete when any of the 4 players has no stroke entered yet', () => {
    const input = holeInput({ a1: 3, a2: 5, b1: 4, b2: null });
    const result = bestBallWorstBall.computeHolePoints(input, defaultBestBallWorstBallSettings, players);
    expect(result.complete).toBe(false);
    expect(result.pointsByTeam).toBeUndefined();
  });

  it('respects configurable point values per sub-match', () => {
    const input = holeInput({ a1: 3, a2: 5, b1: 4, b2: 6 });
    const result = bestBallWorstBall.computeHolePoints(
      input,
      { bestBallPoints: 2, worstBallPoints: 1 },
      players,
    );
    expect(result.pointsByTeam).toEqual({ A: 3, B: 0 });
  });

  it('applies handicap strokes before comparing net scores', () => {
    // Raw strokes are identical, but team A gets a handicap stroke on a1,
    // flipping both sub-match outcomes to team A.
    const input = holeInput(
      { a1: 5, a2: 5, b1: 5, b2: 5 },
      { a1: 1 },
    );
    const result = bestBallWorstBall.computeHolePoints(input, defaultBestBallWorstBallSettings, players);
    // a1 net = 4, a2 net = 5, b1 net = 5, b2 net = 5
    expect(result.detail).toEqual({ bestBallWinner: 'A', worstBallWinner: 'tie' });
    expect(result.pointsByTeam).toEqual({ A: 1, B: 0 });
  });
});

describe('bestBallWorstBall.computeRoundTotals', () => {
  it('sums points across complete holes only and picks the higher total as winner', () => {
    const holeResults = [
      bestBallWorstBall.computeHolePoints(holeInput({ a1: 3, a2: 5, b1: 4, b2: 6 }), defaultBestBallWorstBallSettings, players),
      bestBallWorstBall.computeHolePoints(holeInput({ a1: 5, a2: null, b1: 4, b2: 6 }), defaultBestBallWorstBallSettings, players),
    ];
    const totals = bestBallWorstBall.computeRoundTotals(holeResults, players);
    expect(totals.pointsByTeam).toEqual({ A: 2, B: 0 });
    expect(totals.winnerTeamIds).toEqual(['A']);
  });

  it('credits both teams as winners on a tied total', () => {
    const holeResults = [
      bestBallWorstBall.computeHolePoints(holeInput({ a1: 3, a2: 5, b1: 4, b2: 6 }), defaultBestBallWorstBallSettings, players),
      bestBallWorstBall.computeHolePoints(holeInput({ a1: 5, a2: 7, b1: 3, b2: 4 }), defaultBestBallWorstBallSettings, players),
    ];
    const totals = bestBallWorstBall.computeRoundTotals(holeResults, players);
    expect(totals.pointsByTeam).toEqual({ A: 2, B: 2 });
    expect(totals.winnerTeamIds).toEqual(['A', 'B']);
  });
});
