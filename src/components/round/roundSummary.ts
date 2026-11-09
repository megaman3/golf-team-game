import type { RoundPlayer, TeamId } from '../../domain/types';
import type { RoundTotals } from '../../engine/formats/types';

export function teamLabel(players: RoundPlayer[], team: TeamId): string {
  const names = players.filter((p) => p.teamId === team).map((p) => p.name);
  return names.length > 0 ? `Lag ${team} (${names.join(' & ')})` : `Lag ${team}`;
}

export function describeWinner(players: RoundPlayer[], winner: TeamId | 'tie'): string {
  return winner === 'tie' ? 'delat' : teamLabel(players, winner);
}

export function describeRoundResult(totals: RoundTotals, players: RoundPlayer[]): string {
  if (!totals.pointsByTeam || !totals.winnerTeamIds) {
    return 'Rundan är klar.';
  }
  const { A, B } = totals.pointsByTeam;
  if (totals.winnerTeamIds.length > 1) {
    return `Oavgjort, ${A}–${B} poäng.`;
  }
  const winner = totals.winnerTeamIds[0];
  if (winner === 'tie') {
    return 'Rundan är klar.';
  }
  const loser: TeamId = winner === 'A' ? 'B' : 'A';
  return `${teamLabel(players, winner)} vann med ${totals.pointsByTeam[winner]}–${totals.pointsByTeam[loser]} poäng.`;
}
