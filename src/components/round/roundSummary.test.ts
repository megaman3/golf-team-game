import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import { describeMatchStatus, describeRoundResult, teamLabel } from './roundSummary';

const players: RoundPlayer[] = [
  { playerId: 'a1', name: 'Anna', exactHandicapUsed: 0, teamId: 'A', teeId: 'white' },
  { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A', teeId: 'white' },
  { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B', teeId: 'white' },
  { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B', teeId: 'white' },
];

describe('teamLabel', () => {
  it('lists the team members by name', () => {
    expect(teamLabel(players, 'A')).toBe('Lag A (Anna & Björn)');
  });
});

describe('describeRoundResult', () => {
  it('names the winning team and the point gap', () => {
    const text = describeRoundResult({ pointsByTeam: { A: 10, B: 4 }, winnerTeamIds: ['A'] }, players);
    expect(text).toBe('Lag A (Anna & Björn) vann med 10–4 poäng.');
  });

  it('describes a tied total', () => {
    const text = describeRoundResult({ pointsByTeam: { A: 7, B: 7 }, winnerTeamIds: ['A', 'B'] }, players);
    expect(text).toBe('Oavgjort, 7–7 poäng.');
  });
});

describe('describeMatchStatus', () => {
  it('returns null when there are no points yet', () => {
    expect(describeMatchStatus(undefined, 0, 18, players)).toBeNull();
  });

  it('reports All Square when the teams are tied, regardless of how many holes remain', () => {
    expect(describeMatchStatus({ A: 0, B: 0 }, 0, 18, players)).toBe('Lika (A/S)');
    expect(describeMatchStatus({ A: 5, B: 5 }, 18, 18, players)).toBe('Lika (A/S)');
  });

  it('reports a plain lead when the match is not yet decided', () => {
    // 1 up with 8 holes left - nowhere near clinched.
    expect(describeMatchStatus({ A: 4, B: 3 }, 10, 18, players)).toBe('Lag A (Anna & Björn) 1 upp');
  });

  it('reports dormie when the trailing team must win every remaining hole', () => {
    // 3 up with exactly 3 holes left.
    expect(describeMatchStatus({ A: 5, B: 2 }, 15, 18, players)).toBe(
      'Lag A (Anna & Björn) 3 upp – Lag B (Cecilia & David) är dormie',
    );
  });

  it('reports the match as clinched using "X & Y" notation once it cannot be caught', () => {
    // 3 up with only 2 holes left to play.
    expect(describeMatchStatus({ A: 5, B: 2 }, 16, 18, players)).toBe('Lag A (Anna & Björn) vinner, 3 och 2');
  });

  it('reports a plain lead once all holes are played (no "& 0" notation)', () => {
    expect(describeMatchStatus({ A: 4, B: 2 }, 18, 18, players)).toBe('Lag A (Anna & Björn) 2 upp');
  });
});
