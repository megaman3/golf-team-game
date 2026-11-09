import { describe, expect, it } from 'vitest';
import type { Round } from './types';
import { decrementStroke, incrementStroke, setCurrentHole, setPlayerStroke } from './roundEditing';

function baseRound(): Round {
  return {
    id: 'r1',
    courseId: 'c1',
    formatId: 'bestBallWorstBall',
    scratch: false,
    players: [],
    holeScores: [
      { hole: 1, strokesByPlayer: {} },
      { hole: 2, strokesByPlayer: { a1: 4 } },
      { hole: 3, strokesByPlayer: {} },
    ],
    settings: {},
    status: 'in_progress',
    startedAt: '2026-01-01T00:00:00.000Z',
    currentHole: 1,
  };
}

describe('setPlayerStroke', () => {
  it('sets a stroke count for a player on the given hole without touching other holes', () => {
    const round = setPlayerStroke(baseRound(), 1, 'a1', 5);
    expect(round.holeScores[0].strokesByPlayer).toEqual({ a1: 5 });
    expect(round.holeScores[1].strokesByPlayer).toEqual({ a1: 4 });
  });

  it('can clear a stroke back to null', () => {
    const round = setPlayerStroke(baseRound(), 2, 'a1', null);
    expect(round.holeScores[1].strokesByPlayer).toEqual({ a1: null });
  });
});

describe('setCurrentHole', () => {
  it('clamps within 1..holesCount', () => {
    expect(setCurrentHole(baseRound(), 0).currentHole).toBe(1);
    expect(setCurrentHole(baseRound(), 2).currentHole).toBe(2);
    expect(setCurrentHole(baseRound(), 99).currentHole).toBe(3);
  });
});

describe('incrementStroke / decrementStroke', () => {
  it('increments from empty to 1, then upward', () => {
    expect(incrementStroke(null)).toBe(1);
    expect(incrementStroke(1)).toBe(2);
    expect(incrementStroke(7)).toBe(8);
  });

  it('decrements down to null instead of going below 1', () => {
    expect(decrementStroke(null)).toBeNull();
    expect(decrementStroke(1)).toBeNull();
    expect(decrementStroke(5)).toBe(4);
  });
});
