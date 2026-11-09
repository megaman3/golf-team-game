import { describe, expect, it } from 'vitest';
import type { RoundPlayer } from '../../domain/types';
import { describeRoundResult, teamLabel } from './roundSummary';

const players: RoundPlayer[] = [
  { playerId: 'a1', name: 'Anna', exactHandicapUsed: 0, teamId: 'A' },
  { playerId: 'a2', name: 'Björn', exactHandicapUsed: 0, teamId: 'A' },
  { playerId: 'b1', name: 'Cecilia', exactHandicapUsed: 0, teamId: 'B' },
  { playerId: 'b2', name: 'David', exactHandicapUsed: 0, teamId: 'B' },
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
