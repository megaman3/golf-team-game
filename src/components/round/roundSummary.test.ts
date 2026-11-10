import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import {
  describeMatchStatus,
  describePlayerStandings,
  describeRoundResult,
  describeStandingsGap,
  teamLabel,
} from './roundSummary';

const players: RoundPlayer[] = [
  { playerId: 'a1', name: 'Anna', exactHandicapUsed: 0, teamId: 'A', teeId: 'white' },
  { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A', teeId: 'white' },
  { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B', teeId: 'white' },
  { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B', teeId: 'white' },
];

const threePlayers: RoundPlayer[] = [
  { playerId: 'a', name: 'Anna', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'b', name: 'Björn', exactHandicapUsed: 0, teeId: 'white' },
  { playerId: 'c', name: 'Cecilia', exactHandicapUsed: 0, teeId: 'white' },
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

  it('names a single winning player (individual format)', () => {
    const text = describeRoundResult(
      { pointsByPlayer: { a: 10, b: 6, c: 4 }, winnerPlayerIds: ['a'] },
      threePlayers,
    );
    expect(text).toBe('Anna vann (Anna 10 – Björn 6 – Cecilia 4 poäng).');
  });

  it('describes a shared win among tied players (individual format)', () => {
    const text = describeRoundResult(
      { pointsByPlayer: { a: 8, b: 8, c: 4 }, winnerPlayerIds: ['a', 'b'] },
      threePlayers,
    );
    expect(text).toBe('Delad seger: Anna & Björn (Anna 8 – Björn 8 – Cecilia 4 poäng).');
  });
});

describe('describePlayerStandings', () => {
  it('sorts players by points, highest first', () => {
    expect(describePlayerStandings({ a: 4, b: 10, c: 6 }, threePlayers)).toBe('Björn 10 – Cecilia 6 – Anna 4');
  });
});

describe('describeStandingsGap', () => {
  it('normalizes so the lowest scorer reads as 0 (10-6-4 -> 6-2-0)', () => {
    expect(describeStandingsGap({ a: 10, b: 6, c: 4 }, threePlayers)).toBe('Anna 6 – Björn 2 – Cecilia 0');
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
