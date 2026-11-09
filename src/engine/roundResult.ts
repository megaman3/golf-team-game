import type { Course, Round } from '../domain/types';
import { computeHandicapStrokes } from './handicap';
import { getGameFormat } from './formats/registry';
import type { HolePointsResult, HoleStrokeInput, RoundTotals } from './formats/types';

export interface RoundResult {
  holeResults: HolePointsResult[];
  totals: RoundTotals;
}

export function computeRoundResult(round: Round, course: Course): RoundResult {
  const format = getGameFormat(round.formatId);
  const settings = round.settings ?? format.defaultSettings;
  const coursePar = course.par.reduce((sum, par) => sum + par, 0);
  const teeById = new Map(course.tees.map((tee) => [tee.id, tee]));

  const holeResults = course.par.map((par, i) => {
    const hole = i + 1;
    const index = course.index[i];
    const holeScore = round.holeScores.find((entry) => entry.hole === hole);

    const strokesByPlayer: Record<string, number | null> = {};
    const handicapStrokesByPlayer: Record<string, number> = {};
    for (const player of round.players) {
      strokesByPlayer[player.playerId] = holeScore?.strokesByPlayer[player.playerId] ?? null;
      handicapStrokesByPlayer[player.playerId] = computeHandicapStrokes({
        exactHandicap: round.scratch ? null : player.exactHandicapUsed,
        tee: teeById.get(player.teeId) ?? {},
        coursePar,
        holeIndex: index,
        holesCount: course.holes,
      });
    }

    const input: HoleStrokeInput = { hole, par, index, strokesByPlayer, handicapStrokesByPlayer };
    return format.computeHolePoints(input, settings, round.players);
  });

  const totals = format.computeRoundTotals(holeResults, round.players);
  return { holeResults, totals };
}
