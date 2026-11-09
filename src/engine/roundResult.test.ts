import { describe, expect, it } from 'vitest';
import type { Course, Round, Tee } from '../domain/types';
import { computeRoundResult } from './roundResult';

const course: Course = {
  id: 'test-course',
  club: 'Testklubben',
  name: 'Testbanan',
  holes: 3,
  par: [4, 4, 4],
  index: [1, 2, 3],
  tees: [],
};

const tee: Tee = { id: 'white', label: 'Vit' };

function baseRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 'r1',
    courseId: course.id,
    teeId: tee.id,
    formatId: 'bestBallWorstBall',
    scratch: false,
    players: [
      { playerId: 'a1', name: 'Anna', exactHandicapUsed: 2, teamId: 'A' },
      { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A' },
      { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B' },
      { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B' },
    ],
    holeScores: [
      { hole: 1, strokesByPlayer: { a1: 5, a2: 4, b1: 4, b2: 5 } },
      { hole: 2, strokesByPlayer: { a1: 5, a2: 4, b1: 4, b2: 5 } },
      { hole: 3, strokesByPlayer: { a1: 4, a2: 4, b1: 4, b2: null } },
    ],
    settings: undefined,
    status: 'in_progress',
    startedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeRoundResult', () => {
  it('applies each player handicap strokes and aggregates only completed holes', () => {
    const result = computeRoundResult(baseRound(), course, tee);

    expect(result.holeResults.map((h) => h.complete)).toEqual([true, true, false]);
    // a1 (handicap 2) gets a stroke on holes with index 1 and 2, none on index 3.
    expect(result.holeResults[0].pointsByTeam).toEqual({ A: 1, B: 0 });
    expect(result.holeResults[1].pointsByTeam).toEqual({ A: 1, B: 0 });
    expect(result.holeResults[2].pointsByTeam).toBeUndefined();

    expect(result.totals.pointsByTeam).toEqual({ A: 2, B: 0 });
    expect(result.totals.winnerTeamIds).toEqual(['A']);
  });

  it('ignores player handicaps entirely when the round is scratch', () => {
    const round = baseRound({ scratch: true });
    const result = computeRoundResult(round, course, tee);

    // Without a1's handicap stroke, hole 1 becomes a tie on both sub-matches.
    expect(result.holeResults[0].pointsByTeam).toEqual({ A: 0, B: 0 });
    expect(result.holeResults[0].detail).toEqual({ bestBallWinner: 'tie', worstBallWinner: 'tie' });
  });

  it('uses custom format settings from the round instead of the format default', () => {
    const round = baseRound({ settings: { bestBallPoints: 3, worstBallPoints: 2 } });
    const result = computeRoundResult(round, course, tee);

    expect(result.holeResults[0].pointsByTeam).toEqual({ A: 2, B: 0 });
  });

  it('never crashes on a round with no scores entered at all (fresh in-progress round)', () => {
    const round = baseRound({
      holeScores: [
        { hole: 1, strokesByPlayer: {} },
        { hole: 2, strokesByPlayer: {} },
        { hole: 3, strokesByPlayer: {} },
      ],
    });
    const result = computeRoundResult(round, course, tee);

    expect(result.holeResults.every((h) => h.complete === false)).toBe(true);
    expect(result.totals.pointsByTeam).toEqual({ A: 0, B: 0 });
  });
});
