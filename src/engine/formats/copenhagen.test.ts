import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import { copenhagen, defaultCopenhagenSettings } from './copenhagen';
import type { HoleStrokeInput } from './types';

const players: RoundPlayer[] = [
  { playerId: 'a', name: 'Anna', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'b', name: 'Björn', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'c', name: 'Cecilia', exactHandicapUsed: 0, teeId: 'white' },
];

function holeInput(
  strokesByPlayer: Record<string, number | null>,
  handicapStrokesByPlayer: Record<string, number> = {},
): HoleStrokeInput {
  return { hole: 1, par: 4, index: 5, strokesByPlayer, handicapStrokesByPlayer };
}

describe('copenhagen.computeHolePoints', () => {
  it('splits 4-2-0 when all three nets differ', () => {
    const result = copenhagen.computeHolePoints(holeInput({ a: 3, b: 4, c: 5 }), defaultCopenhagenSettings, players);
    expect(result.complete).toBe(true);
    expect(result.pointsByPlayer).toEqual({ a: 4, b: 2, c: 0 });
  });

  it('splits 4-1-1 when the best is alone and the other two tie', () => {
    const result = copenhagen.computeHolePoints(holeInput({ a: 3, b: 4, c: 4 }), defaultCopenhagenSettings, players);
    expect(result.pointsByPlayer).toEqual({ a: 4, b: 1, c: 1 });
  });

  it('splits 3-3-0 when two tie for best and one is alone worst', () => {
    const result = copenhagen.computeHolePoints(holeInput({ a: 3, b: 3, c: 5 }), defaultCopenhagenSettings, players);
    expect(result.pointsByPlayer).toEqual({ a: 3, b: 3, c: 0 });
  });

  it('splits 2-2-2 when all three tie', () => {
    const result = copenhagen.computeHolePoints(holeInput({ a: 4, b: 4, c: 4 }), defaultCopenhagenSettings, players);
    expect(result.pointsByPlayer).toEqual({ a: 2, b: 2, c: 2 });
  });

  it('is incomplete until all three players have entered a stroke', () => {
    const result = copenhagen.computeHolePoints(holeInput({ a: 3, b: 4, c: null }), defaultCopenhagenSettings, players);
    expect(result.complete).toBe(false);
    expect(result.pointsByPlayer).toBeUndefined();
  });

  it('ranks by net score (strokes minus handicap strokes), not raw strokes', () => {
    // Raw strokes are identical, but c gets a handicap stroke, so c's net
    // is lowest and should win the hole outright.
    const result = copenhagen.computeHolePoints(
      holeInput({ a: 4, b: 4, c: 4 }, { c: 1 }),
      defaultCopenhagenSettings,
      players,
    );
    expect(result.pointsByPlayer).toEqual({ a: 1, b: 1, c: 4 });
  });
});

describe('copenhagen.computeRoundTotals', () => {
  it('sums points across complete holes only, skipping an incomplete hole', () => {
    const holeResults = [
      copenhagen.computeHolePoints(holeInput({ a: 3, b: 4, c: 5 }), defaultCopenhagenSettings, players), // a4 b2 c0
      copenhagen.computeHolePoints(holeInput({ a: 3, b: null, c: 5 }), defaultCopenhagenSettings, players), // incomplete
      copenhagen.computeHolePoints(holeInput({ a: 3, b: 5, c: 4 }), defaultCopenhagenSettings, players), // a4 c2 b0
    ];
    const totals = copenhagen.computeRoundTotals(holeResults, players);
    expect(totals.pointsByPlayer).toEqual({ a: 8, b: 2, c: 2 });
    expect(totals.winnerPlayerIds).toEqual(['a']);
  });

  it('credits every player when the round total ends in a tie', () => {
    const holeResults = [
      copenhagen.computeHolePoints(holeInput({ a: 3, b: 4, c: 5 }), defaultCopenhagenSettings, players), // a4 b2 c0
      copenhagen.computeHolePoints(holeInput({ a: 5, b: 4, c: 3 }), defaultCopenhagenSettings, players), // a0 b2 c4
    ];
    const totals = copenhagen.computeRoundTotals(holeResults, players);
    expect(totals.pointsByPlayer).toEqual({ a: 4, b: 4, c: 4 });
    expect(totals.winnerPlayerIds?.sort()).toEqual(['a', 'b', 'c']);
  });
});
