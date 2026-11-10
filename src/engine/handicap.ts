import type { Course, Round, Tee } from '../domain/types';

export function playingHandicap(
  exactHandicap: number,
  tee: Pick<Tee, 'slope' | 'courseRating'>,
  coursePar: number,
): number {
  if (tee.slope != null && tee.courseRating != null) {
    return Math.round((exactHandicap * tee.slope) / 113 + (tee.courseRating - coursePar));
  }
  return Math.round(exactHandicap);
}

export function strokesOnHole(playingHcp: number, holeIndex: number, holesCount = 18): number {
  const base = Math.floor(playingHcp / holesCount);
  // True mathematical modulo (always in [0, holesCount)), unlike JS `%`,
  // which keeps the formula correct for negative (plus) handicaps.
  const remainder = playingHcp - base * holesCount;
  return base + (holeIndex <= remainder ? 1 : 0);
}

export interface HandicapStrokeInput {
  // null means this player plays scratch on this hole, regardless of tee/course.
  exactHandicap: number | null;
  tee: Pick<Tee, 'slope' | 'courseRating'>;
  coursePar: number;
  holeIndex: number;
  holesCount?: number;
}

export function computeHandicapStrokes(input: HandicapStrokeInput): number {
  if (input.exactHandicap == null) {
    return 0;
  }
  const hcp = playingHandicap(input.exactHandicap, input.tee, input.coursePar);
  return strokesOnHole(hcp, input.holeIndex, input.holesCount ?? 18);
}

// Looks up one player's handicap strokes on one hole of a round, resolving
// their tee and scratch status. Returns 0 if the player isn't in the round.
export function handicapStrokesForPlayerOnHole(
  round: Pick<Round, 'scratch' | 'players'>,
  course: Pick<Course, 'par' | 'index' | 'holes' | 'tees'>,
  playerId: string,
  hole: number,
): number {
  const player = round.players.find((p) => p.playerId === playerId);
  if (!player) return 0;
  const tee = course.tees.find((t) => t.id === player.teeId);
  const coursePar = course.par.reduce((sum, p) => sum + p, 0);
  return computeHandicapStrokes({
    exactHandicap: round.scratch ? null : player.exactHandicapUsed,
    tee: tee ?? {},
    coursePar,
    holeIndex: course.index[hole - 1],
    holesCount: course.holes,
  });
}
