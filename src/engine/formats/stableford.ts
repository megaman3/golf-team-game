import type { RoundPlayer } from '../../domain/types';
import { aggregateIndividualPoints } from './individualTotals';
import type { GameFormatModule, HolePointsResult, HoleStrokeInput } from './types';

export type StablefordSettings = Record<string, never>;

export const defaultStablefordSettings: StablefordSettings = {};

// Standard poängbogey/Stableford table: 2 points for net par, +1 per
// stroke better, -1 per stroke worse, floored at 0 (two or more over gets
// nothing). Each player's points depend only on their own net score, never
// on how anyone else played.
function pointsForNet(net: number, par: number): number {
  return Math.max(0, 2 - (net - par));
}

function computeHolePoints(
  input: HoleStrokeInput,
  _settings: StablefordSettings,
  players: RoundPlayer[],
): HolePointsResult {
  const pointsByPlayer: Record<string, number> = {};

  for (const player of players) {
    const strokes = input.strokesByPlayer[player.playerId];
    if (strokes == null) {
      return { hole: input.hole, complete: false };
    }
    const net = strokes - (input.handicapStrokesByPlayer[player.playerId] ?? 0);
    pointsByPlayer[player.playerId] = pointsForNet(net, input.par);
  }

  return { hole: input.hole, complete: true, pointsByPlayer };
}

export const stableford: GameFormatModule<StablefordSettings> = {
  id: 'stableford',
  label: 'Poängbogey',
  playerCount: 4,
  minPlayers: 1,
  maxPlayers: 4,
  usesTeams: false,
  defaultSettings: defaultStablefordSettings,
  computeHolePoints,
  computeRoundTotals: (holeResults) => aggregateIndividualPoints(holeResults),
};
