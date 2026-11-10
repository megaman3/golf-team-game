import type { RoundPlayer, TeamId } from '../../domain/types';
import type { HolePointsResult } from '../../engine/formats/types';
import { teamLabel } from './roundSummary';

export interface ChartSeries {
  id: string;
  label: string;
  // One entry per completed hole, in hole order. Stops at the first
  // incomplete hole rather than padding with zeros, so the chart never
  // implies a hole was played when it wasn't.
  values: number[];
}

function seriesIdentities(players: RoundPlayer[], usesTeams: boolean): Array<{ id: string; label: string }> {
  if (usesTeams) {
    return (['A', 'B'] as TeamId[]).map((team) => ({ id: team, label: teamLabel(players, team) }));
  }
  return players.map((p) => ({ id: p.playerId, label: p.name }));
}

function pointsFor(result: HolePointsResult, id: string, usesTeams: boolean): number | null {
  if (!result.complete) return null;
  if (usesTeams) return result.pointsByTeam?.[id as TeamId] ?? null;
  return result.pointsByPlayer?.[id] ?? null;
}

export function buildCumulativeSeries(
  holeResults: HolePointsResult[],
  players: RoundPlayer[],
  usesTeams: boolean,
): ChartSeries[] {
  return seriesIdentities(players, usesTeams).map(({ id, label }) => {
    let cumulative = 0;
    const values: number[] = [];
    for (const hr of holeResults) {
      const points = pointsFor(hr, id, usesTeams);
      if (points == null) break;
      cumulative += points;
      values.push(cumulative);
    }
    return { id, label, values };
  });
}

export function buildPerHoleSeries(
  holeResults: HolePointsResult[],
  players: RoundPlayer[],
  usesTeams: boolean,
): ChartSeries[] {
  return seriesIdentities(players, usesTeams).map(({ id, label }) => {
    const values: number[] = [];
    for (const hr of holeResults) {
      const points = pointsFor(hr, id, usesTeams);
      if (points == null) break;
      values.push(points);
    }
    return { id, label, values };
  });
}
