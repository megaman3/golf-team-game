import type { HolePointsResult, RoundTotals } from './types';

// Shared round-totals aggregation for individual-player formats
// (Köpenhamare, Poängbogey): sum each player's points across complete
// holes, then credit every player tied for the highest total as a winner.
export function aggregateIndividualPoints(holeResults: HolePointsResult[]): RoundTotals {
  const pointsByPlayer: Record<string, number> = {};
  for (const result of holeResults) {
    if (!result.complete || !result.pointsByPlayer) continue;
    for (const [playerId, points] of Object.entries(result.pointsByPlayer)) {
      pointsByPlayer[playerId] = (pointsByPlayer[playerId] ?? 0) + points;
    }
  }

  const values = Object.values(pointsByPlayer);
  if (values.length === 0) {
    return { pointsByPlayer, winnerPlayerIds: [] };
  }

  const maxPoints = Math.max(...values);
  const winnerPlayerIds = Object.entries(pointsByPlayer)
    .filter(([, points]) => points === maxPoints)
    .map(([playerId]) => playerId);

  return { pointsByPlayer, winnerPlayerIds };
}
