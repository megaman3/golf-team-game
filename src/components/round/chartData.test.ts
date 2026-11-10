import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import type { HolePointsResult } from '../../engine/formats/types';
import { buildCumulativeSeries, buildPerHoleSeries } from './chartData';

const teamPlayers: RoundPlayer[] = [
  { playerId: 'a1', name: 'Anna', exactHandicapUsed: 0, teamId: 'A', teeId: 'white' },
  { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A', teeId: 'white' },
  { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B', teeId: 'white' },
  { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B', teeId: 'white' },
];

const individualPlayers: RoundPlayer[] = [
  { playerId: 'a', name: 'Anna', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'b', name: 'Björn', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'c', name: 'Cecilia', exactHandicapUsed: 0, teeId: 'white' },
];

const teamHoleResults: HolePointsResult[] = [
  { hole: 1, complete: true, pointsByTeam: { A: 1, B: 0 } },
  { hole: 2, complete: true, pointsByTeam: { A: 0, B: 1 } },
  { hole: 3, complete: false },
  { hole: 4, complete: true, pointsByTeam: { A: 2, B: 0 } },
];

const individualHoleResults: HolePointsResult[] = [
  { hole: 1, complete: true, pointsByPlayer: { a: 4, b: 2, c: 0 } },
  { hole: 2, complete: true, pointsByPlayer: { a: 0, b: 2, c: 4 } },
];

describe('buildCumulativeSeries', () => {
  it('accumulates team points and stops at the first incomplete hole', () => {
    const series = buildCumulativeSeries(teamHoleResults, teamPlayers, true);
    const a = series.find((s) => s.id === 'A')!;
    const b = series.find((s) => s.id === 'B')!;
    expect(a.values).toEqual([1, 1]); // hole 3 incomplete stops it before hole 4's +2
    expect(b.values).toEqual([0, 1]);
    expect(a.label).toBe('Lag A (Anna & Björn)');
  });

  it('accumulates individual player points', () => {
    const series = buildCumulativeSeries(individualHoleResults, individualPlayers, false);
    const anna = series.find((s) => s.id === 'a')!;
    const cecilia = series.find((s) => s.id === 'c')!;
    expect(anna.values).toEqual([4, 4]);
    expect(cecilia.values).toEqual([0, 4]);
  });
});

describe('buildPerHoleSeries', () => {
  it('reports each hole\'s points without accumulating, stopping at the first incomplete hole', () => {
    const series = buildPerHoleSeries(teamHoleResults, teamPlayers, true);
    const a = series.find((s) => s.id === 'A')!;
    expect(a.values).toEqual([1, 0]);
  });

  it('returns an empty series when no holes are complete', () => {
    const series = buildPerHoleSeries([{ hole: 1, complete: false }], teamPlayers, true);
    expect(series.every((s) => s.values.length === 0)).toBe(true);
  });
});
