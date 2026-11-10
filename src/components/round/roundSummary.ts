import type { RoundPlayer, TeamId } from '../../domain/types';
import type { HolePointsResult, RoundTotals } from '../../engine/formats/types';

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

// Sorted "Namn X – Namn Y – Namn Z" line for individual-player formats
// (Köpenhamare), highest points first.
export function describePlayerStandings(
  pointsByPlayer: Record<string, number> | undefined,
  players: RoundPlayer[],
): string | null {
  if (!pointsByPlayer) return null;
  return [...players]
    .sort((a, b) => (pointsByPlayer[b.playerId] ?? 0) - (pointsByPlayer[a.playerId] ?? 0))
    .map((p) => `${p.name} ${pointsByPlayer[p.playerId] ?? 0}`)
    .join(' – ');
}

// The same standings, normalized so the lowest scorer reads as 0 (e.g.
// "10-6-4" becomes "6-2-0") - shows the point gap at a glance without the
// absolute totals.
export function describeStandingsGap(
  pointsByPlayer: Record<string, number> | undefined,
  players: RoundPlayer[],
): string | null {
  if (!pointsByPlayer) return null;
  const values = Object.values(pointsByPlayer);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  return [...players]
    .sort((a, b) => (pointsByPlayer[b.playerId] ?? 0) - (pointsByPlayer[a.playerId] ?? 0))
    .map((p) => `${p.name} ${(pointsByPlayer[p.playerId] ?? 0) - min}`)
    .join(' – ');
}

// The final result for a team match, in classic match-play notation: scans
// the holes in play order and reports the FIRST point the trailing team
// could no longer catch up (even by winning every remaining hole) as
// "X och Y" ("3 och 2" = won by 3 with 2 holes left) - the standard
// shorthand for a match decided before the 18th hole. If it was never
// clinched early, the match went the distance: "X upp", or tied.
function describeTeamMatchResult(holeResults: HolePointsResult[], totalHoles: number, players: RoundPlayer[]): string {
  let diff = 0;
  for (let i = 0; i < holeResults.length; i++) {
    const hr = holeResults[i];
    if (!hr.complete || !hr.pointsByTeam) break;
    diff += hr.pointsByTeam.A - hr.pointsByTeam.B;
    const holesRemaining = totalHoles - (i + 1);
    if (holesRemaining > 0 && Math.abs(diff) > holesRemaining) {
      const leader: TeamId = diff > 0 ? 'A' : 'B';
      return `${teamLabel(players, leader)} vinner, ${Math.abs(diff)} och ${holesRemaining}.`;
    }
  }

  if (diff === 0) {
    return 'Lika (A/S).';
  }
  const leader: TeamId = diff > 0 ? 'A' : 'B';
  return `${teamLabel(players, leader)} vinner, ${Math.abs(diff)} upp.`;
}

export function describeRoundResult(
  totals: RoundTotals,
  holeResults: HolePointsResult[],
  totalHoles: number,
  players: RoundPlayer[],
): string {
  if (totals.pointsByTeam && totals.winnerTeamIds) {
    return describeTeamMatchResult(holeResults, totalHoles, players);
  }

  if (totals.pointsByPlayer && totals.winnerPlayerIds) {
    const standings = describePlayerStandings(totals.pointsByPlayer, players);
    if (totals.winnerPlayerIds.length > 1) {
      const names = totals.winnerPlayerIds.map((id) => players.find((p) => p.playerId === id)?.name ?? id);
      return `Delad seger: ${names.join(' & ')} (${standings} poäng).`;
    }
    const winner = players.find((p) => p.playerId === totals.winnerPlayerIds![0]);
    return `${winner?.name ?? 'Okänd'} vann (${standings} poäng).`;
  }

  return 'Rundan är klar.';
}
