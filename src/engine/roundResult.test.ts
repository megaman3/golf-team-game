import { describe, expect, it } from 'vitest';
import type { Course, Round } from '../domain/types';
import { computeRoundResult } from './roundResult';

const whiteTee = { id: 'white', label: 'Vit' };
const redTee = { id: 'red', label: 'Röd', slope: 140, courseRating: 74 };

const course: Course = {
  id: 'test-course',
  club: 'Testklubben',
  name: 'Testbanan',
  holes: 3,
  par: [4, 4, 4],
  index: [1, 2, 3],
  tees: [whiteTee, redTee],
};

function baseRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 'r1',
    courseId: course.id,
    formatId: 'bestBallWorstBall',
    scratch: false,
    players: [
      { playerId: 'a1', name: 'Anna', exactHandicapUsed: 2, teamId: 'A', teeId: whiteTee.id },
      { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A', teeId: whiteTee.id },
      { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B', teeId: whiteTee.id },
      { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B', teeId: whiteTee.id },
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
    const result = computeRoundResult(baseRound(), course);

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
    const result = computeRoundResult(round, course);

    // Without a1's handicap stroke, hole 1 becomes a tie on both sub-matches.
    expect(result.holeResults[0].pointsByTeam).toEqual({ A: 0, B: 0 });
    expect(result.holeResults[0].detail).toEqual({ bestBallWinner: 'tie', worstBallWinner: 'tie' });
  });

  it('uses custom format settings from the round instead of the format default', () => {
    const round = baseRound({ settings: { bestBallPoints: 3, worstBallPoints: 2 } });
    const result = computeRoundResult(round, course);

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
    const result = computeRoundResult(round, course);

    expect(result.holeResults.every((h) => h.complete === false)).toBe(true);
    expect(result.totals.pointsByTeam).toEqual({ A: 0, B: 0 });
  });

  it('computes handicap strokes from each player\'s own tee, not a shared round tee', () => {
    const round = baseRound({
      players: [
        // Same exact handicap, different tees - a1's tee has a slope/course
        // rating (uses the full formula), a2's plain white tee doesn't
        // (simple rounding), so their playing handicaps differ sharply.
        { playerId: 'a1', name: 'Anna', exactHandicapUsed: 10, teamId: 'A', teeId: redTee.id },
        { playerId: 'a2', name: 'Björn', exactHandicapUsed: 10, teamId: 'A', teeId: whiteTee.id },
        { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B', teeId: whiteTee.id },
        { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B', teeId: whiteTee.id },
      ],
    });
    const result = computeRoundResult(round, course);

    // a1: playingHandicap = round(10*140/113 + (74-12)) = 74 -> far more
    // handicap strokes per hole than a2's playingHandicap of 10, even
    // though both entered the same raw strokes and exact handicap. That
    // swing is enough to flip both sub-matches to team A on hole 1.
    expect(result.holeResults[0].detail).toEqual({ bestBallWinner: 'A', worstBallWinner: 'A' });
  });
});
