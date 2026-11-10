import type { RoundPlayer } from '../../domain/types';
import type { GameFormatModule, HolePointsResult, HoleStrokeInput, RoundTotals } from './types';

export type CopenhagenSettings = Record<string, never>;

export const defaultCopenhagenSettings: CopenhagenSettings = {};

// 6 points per hole split 4/2/0 by net-score rank; tied ranks share the sum
// of the slots they occupy evenly (e.g. a tie for best splits 4+2=6 into
// 3+3, giving the standard 3-3-0 / 4-1-1 / 2-2-2 tie tables).
const SLOT_POINTS = [4, 2, 0];

function netScore(input: HoleStrokeInput, player: RoundPlayer): number | null {
  const strokes = input.strokesByPlayer[player.playerId];
  if (strokes == null) return null;
  return strokes - (input.handicapStrokesByPlayer[player.playerId] ?? 0);
}

function computeHolePoints(
  input: HoleStrokeInput,
  _settings: CopenhagenSettings,
  players: RoundPlayer[],
): HolePointsResult {
  const nets = players.map((player) => ({ player, net: netScore(input, player) }));
  if (nets.some((n) => n.net == null)) {
    return { hole: input.hole, complete: false };
  }

  const sorted = [...nets].sort((a, b) => (a.net as number) - (b.net as number));
  const pointsByPlayer: Record<string, number> = {};

  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1].net === sorted[i].net) {
      j++;
    }
    const slotSum = SLOT_POINTS.slice(i, j + 1).reduce((a, b) => a + b, 0);
    const share = slotSum / (j - i + 1);
    for (let k = i; k <= j; k++) {
      pointsByPlayer[sorted[k].player.playerId] = share;
    }
    i = j + 1;
  }

  return { hole: input.hole, complete: true, pointsByPlayer };
}

function computeRoundTotals(holeResults: HolePointsResult[]): RoundTotals {
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

export const copenhagen: GameFormatModule<CopenhagenSettings> = {
  id: 'copenhagen',
  label: 'Köpenhamare',
  playerCount: 3,
  usesTeams: false,
  defaultSettings: defaultCopenhagenSettings,
  computeHolePoints,
  computeRoundTotals,
};
