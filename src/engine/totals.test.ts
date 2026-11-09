import { describe, expect, it } from 'vitest';
import type { Course, Round } from '../domain/types';
import { computeTotals } from './totals';

const course: Course = {
  id: 'c1',
  club: 'Testklubben',
  name: 'Testbanan',
  holes: 2,
  par: [4, 4],
  index: [1, 2],
  tees: [{ id: 'white', label: 'Vit' }],
};

function round(overrides: Partial<Round> & { id: string }): Round {
  return {
    courseId: course.id,
    formatId: 'bestBallWorstBall',
    scratch: true,
    players: [
      { playerId: 'anna', name: 'Anna', exactHandicapUsed: null, teamId: 'A', teeId: 'white' },
      { playerId: 'bjorn', name: 'Björn', exactHandicapUsed: null, teamId: 'A', teeId: 'white' },
      { playerId: 'cecilia', name: 'Cecilia', exactHandicapUsed: null, teamId: 'B', teeId: 'white' },
      { playerId: 'david', name: 'David', exactHandicapUsed: null, teamId: 'B', teeId: 'white' },
    ],
    holeScores: [
      // A wins both sub-matches on hole 1, tied on hole 2 - A wins 2-0.
      { hole: 1, strokesByPlayer: { anna: 3, bjorn: 4, cecilia: 4, david: 5 } },
      { hole: 2, strokesByPlayer: { anna: 4, bjorn: 4, cecilia: 4, david: 4 } },
    ],
    settings: { bestBallPoints: 1, worstBallPoints: 1 },
    status: 'completed',
    startedAt: '2026-05-01T10:00:00.000Z',
    completedAt: '2026-05-01T13:00:00.000Z',
    ...overrides,
  };
}

describe('computeTotals', () => {
  it('credits each player with their team\'s points and win for the round', () => {
    const totals = computeTotals([round({ id: 'r1' })], [course]);

    const anna = totals.byPlayer.find((p) => p.playerId === 'anna')!;
    const cecilia = totals.byPlayer.find((p) => p.playerId === 'cecilia')!;
    expect(anna.points).toBe(2);
    expect(anna.wins).toBe(1);
    expect(anna.roundsPlayed).toBe(1);
    expect(cecilia.points).toBe(0);
    expect(cecilia.wins).toBe(0);
  });

  it('aggregates a team-pair regardless of which letter (A/B) they played as', () => {
    const r1 = round({ id: 'r1' });
    // Same pair (Anna & Björn) plays again, this time as team B, and loses.
    const r2 = round({
      id: 'r2',
      players: [
        { playerId: 'cecilia', name: 'Cecilia', exactHandicapUsed: null, teamId: 'A', teeId: 'white' },
        { playerId: 'david', name: 'David', exactHandicapUsed: null, teamId: 'A', teeId: 'white' },
        { playerId: 'anna', name: 'Anna', exactHandicapUsed: null, teamId: 'B', teeId: 'white' },
        { playerId: 'bjorn', name: 'Björn', exactHandicapUsed: null, teamId: 'B', teeId: 'white' },
      ],
    });

    const totals = computeTotals([r1, r2], [course]);
    const pair = totals.byPair.find((p) => p.playerIds.includes('anna') && p.playerIds.includes('bjorn'))!;
    expect(pair.roundsPlayed).toBe(2);
    expect(pair.points).toBe(4); // 2 from each round
    expect(pair.wins).toBe(2); // won both times regardless of team letter
  });

  it('credits both teams a win when the round is tied', () => {
    const tied = round({
      id: 'r3',
      holeScores: [
        { hole: 1, strokesByPlayer: { anna: 4, bjorn: 4, cecilia: 4, david: 4 } },
        { hole: 2, strokesByPlayer: { anna: 4, bjorn: 4, cecilia: 4, david: 4 } },
      ],
    });
    const totals = computeTotals([tied], [course]);
    expect(totals.byPlayer.every((p) => p.wins === 1)).toBe(true);
  });

  it('filters by format id', () => {
    const totals = computeTotals([round({ id: 'r1' })], [course], { formatId: 'copenhagen' });
    expect(totals.byPlayer).toEqual([]);
  });

  it('filters by date range (inclusive)', () => {
    const inRange = computeTotals([round({ id: 'r1' })], [course], { from: '2026-05-01', to: '2026-05-01' });
    expect(inRange.byPlayer.length).toBeGreaterThan(0);

    const outOfRange = computeTotals([round({ id: 'r1' })], [course], { from: '2026-05-02' });
    expect(outOfRange.byPlayer).toEqual([]);
  });

  it('ignores a round whose course can no longer be found', () => {
    const totals = computeTotals([round({ id: 'r1', courseId: 'missing' })], [course]);
    expect(totals.byPlayer).toEqual([]);
  });
});
