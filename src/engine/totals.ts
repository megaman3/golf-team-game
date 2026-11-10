import type { Course, Round, RoundPlayer, TeamId } from '../domain/types';
import { computeRoundResult } from './roundResult';
import { getGameFormat } from './formats/registry';

export interface PlayerTotal {
  playerId: string;
  name: string;
  points: number;
  wins: number;
  roundsPlayed: number;
}

export interface PairTotal {
  playerIds: [string, string];
  names: [string, string];
  points: number;
  wins: number;
  roundsPlayed: number;
}

export interface TotalsFilter {
  formatId?: string;
  // ISO date strings (date-only is fine, e.g. "2026-04-01"). Both ends are
  // inclusive of the whole day.
  from?: string;
  to?: string;
}

export interface Totals {
  byPlayer: PlayerTotal[];
  byPair: PairTotal[];
}

const TEAM_IDS: TeamId[] = ['A', 'B'];

function withinRange(iso: string, from?: string, to?: string): boolean {
  const time = new Date(iso).getTime();
  if (from && time < new Date(from).getTime()) return false;
  if (to) {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    if (time > toEnd.getTime()) return false;
  }
  return true;
}

function creditPlayer(byPlayer: Map<string, PlayerTotal>, player: RoundPlayer, points: number, won: boolean): void {
  const existing = byPlayer.get(player.playerId) ?? {
    playerId: player.playerId,
    name: player.name,
    points: 0,
    wins: 0,
    roundsPlayed: 0,
  };
  existing.name = player.name;
  existing.points += points;
  existing.wins += won ? 1 : 0;
  existing.roundsPlayed += 1;
  byPlayer.set(player.playerId, existing);
}

function creditPair(byPair: Map<string, PairTotal>, pair: RoundPlayer[], points: number, won: boolean): void {
  const sorted = [...pair].sort((a, b) => a.playerId.localeCompare(b.playerId));
  const key = sorted.map((p) => p.playerId).join('+');
  const existing = byPair.get(key) ?? {
    playerIds: [sorted[0].playerId, sorted[1].playerId],
    names: [sorted[0].name, sorted[1].name],
    points: 0,
    wins: 0,
    roundsPlayed: 0,
  };
  existing.names = [sorted[0].name, sorted[1].name];
  existing.points += points;
  existing.wins += won ? 1 : 0;
  existing.roundsPlayed += 1;
  byPair.set(key, existing);
}

export function computeTotals(rounds: Round[], courses: Course[], filter: TotalsFilter = {}): Totals {
  const byPlayer = new Map<string, PlayerTotal>();
  const byPair = new Map<string, PairTotal>();

  const filteredRounds = rounds.filter((round) => {
    if (filter.formatId && round.formatId !== filter.formatId) return false;
    return withinRange(round.completedAt ?? round.startedAt, filter.from, filter.to);
  });

  for (const round of filteredRounds) {
    const course = courses.find((c) => c.id === round.courseId);
    if (!course) continue;

    const format = getGameFormat(round.formatId);
    const result = computeRoundResult(round, course);

    if (format.usesTeams) {
      const { pointsByTeam, winnerTeamIds } = result.totals;
      if (!pointsByTeam || !winnerTeamIds) continue;

      for (const team of TEAM_IDS) {
        const teamPlayers = round.players.filter((p) => p.teamId === team);
        const points = pointsByTeam[team];
        const won = winnerTeamIds.includes(team);

        for (const player of teamPlayers) {
          creditPlayer(byPlayer, player, points, won);
        }
        if (teamPlayers.length === 2) {
          creditPair(byPair, teamPlayers, points, won);
        }
      }
    } else {
      const { pointsByPlayer, winnerPlayerIds } = result.totals;
      if (!pointsByPlayer || !winnerPlayerIds) continue;

      for (const player of round.players) {
        const points = pointsByPlayer[player.playerId] ?? 0;
        const won = winnerPlayerIds.includes(player.playerId);
        creditPlayer(byPlayer, player, points, won);
      }
    }
  }

  return {
    byPlayer: [...byPlayer.values()].sort((a, b) => b.points - a.points),
    byPair: [...byPair.values()].sort((a, b) => b.points - a.points),
  };
}
