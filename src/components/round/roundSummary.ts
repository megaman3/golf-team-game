import type { RoundPlayer, TeamId } from '../../domain/types';
import type { RoundTotals } from '../../engine/formats/types';

export function formatRoundDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function teamLabel(players: RoundPlayer[], team: TeamId): string {
  const names = players.filter((p) => p.teamId === team).map((p) => p.name);
  return names.length > 0 ? `Lag ${team} (${names.join(' & ')})` : `Lag ${team}`;
}

export function describeWinner(players: RoundPlayer[], winner: TeamId | 'tie'): string {
  return winner === 'tie' ? 'delat' : teamLabel(players, winner);
}

// Classic match-play status, shown live while a round is in progress:
// "X upp" / "Lika (A/S)", plus the standard "X & Y" notation once a team
// has clinched the match (the trailing team can't catch up even by
// winning every remaining hole) and a "dormie" note when the trailing
// team must win every remaining hole just to stay alive.
export function describeMatchStatus(
  pointsByTeam: Record<TeamId, number> | undefined,
  holesPlayed: number,
  totalHoles: number,
  players: RoundPlayer[],
): string | null {
  if (!pointsByTeam) return null;

  const diff = pointsByTeam.A - pointsByTeam.B;
  if (diff === 0) {
    return 'Lika (A/S)';
  }

  const holesRemaining = Math.max(totalHoles - holesPlayed, 0);
  const leader: TeamId = diff > 0 ? 'A' : 'B';
  const trailer: TeamId = leader === 'A' ? 'B' : 'A';
  const margin = Math.abs(diff);
  const leaderLabel = teamLabel(players, leader);

  if (holesRemaining > 0 && margin > holesRemaining) {
    return `${leaderLabel} vinner, ${margin} och ${holesRemaining}`;
  }

  if (holesRemaining > 0 && margin === holesRemaining) {
    return `${leaderLabel} ${margin} upp – ${teamLabel(players, trailer)} är dormie`;
  }

  return `${leaderLabel} ${margin} upp`;
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
