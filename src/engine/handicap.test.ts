import { describe, expect, it } from 'vitest';
import { computeHandicapStrokes, handicapStrokesForPlayerOnHole, playingHandicap, strokesOnHole } from './handicap';
import type { Course, Round } from '../domain/types';

const indices = Array.from({ length: 18 }, (_, i) => i + 1);

function distribution(h: number, holesCount = 18) {
  return indices.map((index) => strokesOnHole(h, index, holesCount));
}

describe('strokesOnHole', () => {
  it('distributes strokes consistently for a sweep of handicaps (invariant)', () => {
    for (let h = -20; h <= 40; h++) {
      const total = indices.reduce((sum, index) => sum + strokesOnHole(h, index), 0);
      expect(total).toBe(h);
    }
  });

  it('h = 0: no strokes on any hole', () => {
    expect(distribution(0)).toEqual(new Array(18).fill(0));
  });

  it('h = 9: the 9 hardest holes (index 1-9) get a stroke', () => {
    expect(distribution(9)).toEqual([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it('h = 18: every hole gets exactly one stroke', () => {
    expect(distribution(18)).toEqual(new Array(18).fill(1));
  });

  it('h = 19: the hardest hole (index 1) gets a second stroke', () => {
    expect(distribution(19)).toEqual([
      2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ]);
  });

  it('h = 36: every hole gets exactly two strokes', () => {
    expect(distribution(36)).toEqual(new Array(18).fill(2));
  });

  it('h = -5: the 5 easiest holes (index 14-18) give back a stroke', () => {
    expect(distribution(-5)).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1,
    ]);
  });

  it('boundary indexes 1 (hardest) and 18 (easiest) at h = 10', () => {
    expect(strokesOnHole(10, 1)).toBe(1);
    expect(strokesOnHole(10, 10)).toBe(1);
    expect(strokesOnHole(10, 11)).toBe(0);
    expect(strokesOnHole(10, 18)).toBe(0);
  });
});

describe('playingHandicap', () => {
  it('rounds the exact handicap when slope/course rating are absent', () => {
    expect(playingHandicap(11.4, {}, 72)).toBe(11);
    expect(playingHandicap(11.5, {}, 72)).toBe(12);
    expect(playingHandicap(-2.5, {}, 72)).toBe(-2);
  });

  it('applies the slope/course-rating formula when both are present', () => {
    // 18 * 120 / 113 + (74 - 72) = 19.1150... + 2 = 21.115 -> 21
    expect(playingHandicap(18, { slope: 120, courseRating: 74 }, 72)).toBe(21);
  });

  it('falls back to simple rounding when only one of slope/courseRating is set', () => {
    expect(playingHandicap(11.5, { slope: 120 }, 72)).toBe(12);
    expect(playingHandicap(11.5, { courseRating: 74 }, 72)).toBe(12);
  });
});

describe('computeHandicapStrokes', () => {
  it('returns 0 regardless of handicap when the player is scratch (null)', () => {
    expect(
      computeHandicapStrokes({
        exactHandicap: null,
        tee: {},
        coursePar: 72,
        holeIndex: 1,
      }),
    ).toBe(0);
  });

  it('combines playing handicap and hole-stroke allocation for a real handicap', () => {
    expect(
      computeHandicapStrokes({
        exactHandicap: 19,
        tee: {},
        coursePar: 72,
        holeIndex: 1,
      }),
    ).toBe(2);
    expect(
      computeHandicapStrokes({
        exactHandicap: 19,
        tee: {},
        coursePar: 72,
        holeIndex: 2,
      }),
    ).toBe(1);
  });
});

describe('handicapStrokesForPlayerOnHole', () => {
  const course: Pick<Course, 'par' | 'index' | 'holes' | 'tees'> = {
    par: [4, 4, 4],
    index: [1, 2, 3],
    holes: 3,
    tees: [{ id: 'white', label: 'Vit' }],
  };

  it("looks up the player's tee and handicap and resolves their strokes on the hole", () => {
    const round: Pick<Round, 'scratch' | 'players'> = {
      scratch: false,
      players: [{ playerId: 'p1', name: 'A', exactHandicapUsed: 2, teeId: 'white' }],
    };
    expect(handicapStrokesForPlayerOnHole(round, course, 'p1', 1)).toBe(1);
    expect(handicapStrokesForPlayerOnHole(round, course, 'p1', 3)).toBe(0);
  });

  it('returns 0 for a scratch round regardless of the stored handicap', () => {
    const round: Pick<Round, 'scratch' | 'players'> = {
      scratch: true,
      players: [{ playerId: 'p1', name: 'A', exactHandicapUsed: 24, teeId: 'white' }],
    };
    expect(handicapStrokesForPlayerOnHole(round, course, 'p1', 1)).toBe(0);
  });

  it('returns 0 for a player not in the round', () => {
    const round: Pick<Round, 'scratch' | 'players'> = { scratch: false, players: [] };
    expect(handicapStrokesForPlayerOnHole(round, course, 'missing', 1)).toBe(0);
  });
});
