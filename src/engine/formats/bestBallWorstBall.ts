import type { RoundPlayer, TeamId } from '../../domain/types';
import type { GameFormatModule, HolePointsResult, HoleStrokeInput, RoundTotals } from './types';

export interface BestBallWorstBallSettings {
  bestBallPoints: number;
  worstBallPoints: number;
}

export const defaultBestBallWorstBallSettings: BestBallWorstBallSettings = {
  bestBallPoints: 1,
  worstBallPoints: 1,
};

function teamPlayers(players: RoundPlayer[], team: TeamId): RoundPlayer[] {
  return players.filter((player) => player.teamId === team);
}

function netScore(input: HoleStrokeInput, player: RoundPlayer): number | null {
  const strokes = input.strokesByPlayer[player.playerId];
  if (strokes == null) return null;
  return strokes - (input.handicapStrokesByPlayer[player.playerId] ?? 0);
}

function subMatchWinner(netA: number, netB: number): TeamId | 'tie' {
  if (netA < netB) return 'A';
  if (netB < netA) return 'B';
  return 'tie';
}

function computeHolePoints(
  input: HoleStrokeInput,
  settings: BestBallWorstBallSettings,
  players: RoundPlayer[],
): HolePointsResult {
  const teamA = teamPlayers(players, 'A');
  const teamB = teamPlayers(players, 'B');
  const netsA = teamA.map((player) => netScore(input, player));
  const netsB = teamB.map((player) => netScore(input, player));

  if (netsA.some((net) => net == null) || netsB.some((net) => net == null)) {
    return { hole: input.hole, complete: false };
  }

  const resolvedNetsA = netsA as number[];
  const resolvedNetsB = netsB as number[];

  const bestBallWinner = subMatchWinner(Math.min(...resolvedNetsA), Math.min(...resolvedNetsB));
  const worstBallWinner = subMatchWinner(Math.max(...resolvedNetsA), Math.max(...resolvedNetsB));

  const pointsByTeam: Record<TeamId, number> = { A: 0, B: 0 };
  if (bestBallWinner !== 'tie') pointsByTeam[bestBallWinner] += settings.bestBallPoints;
  if (worstBallWinner !== 'tie') pointsByTeam[worstBallWinner] += settings.worstBallPoints;

  return {
    hole: input.hole,
    complete: true,
    pointsByTeam,
    detail: { bestBallWinner, worstBallWinner },
  };
}

function computeRoundTotals(holeResults: HolePointsResult[]): RoundTotals {
  const pointsByTeam: Record<TeamId, number> = { A: 0, B: 0 };
  for (const result of holeResults) {
    if (!result.complete || !result.pointsByTeam) continue;
    pointsByTeam.A += result.pointsByTeam.A;
    pointsByTeam.B += result.pointsByTeam.B;
  }

  let winnerTeamIds: Array<TeamId | 'tie'>;
  if (pointsByTeam.A === pointsByTeam.B) {
    winnerTeamIds = ['A', 'B'];
  } else {
    winnerTeamIds = [pointsByTeam.A > pointsByTeam.B ? 'A' : 'B'];
  }

  return { pointsByTeam, winnerTeamIds };
}

export const bestBallWorstBall: GameFormatModule<BestBallWorstBallSettings> = {
  id: 'bestBallWorstBall',
  label: 'Bästboll/sämstboll',
  playerCount: 4,
  usesTeams: true,
  defaultSettings: defaultBestBallWorstBallSettings,
  computeHolePoints,
  computeRoundTotals,
};
