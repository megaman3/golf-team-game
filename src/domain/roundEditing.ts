import type { Round } from './types';

export function setPlayerStroke(round: Round, hole: number, playerId: string, strokes: number | null): Round {
  const holeScores = round.holeScores.map((holeScore) =>
    holeScore.hole === hole
      ? { ...holeScore, strokesByPlayer: { ...holeScore.strokesByPlayer, [playerId]: strokes } }
      : holeScore,
  );
  return { ...round, holeScores };
}

export function setCurrentHole(round: Round, hole: number): Round {
  const clamped = Math.min(Math.max(hole, 1), round.holeScores.length);
  return { ...round, currentHole: clamped };
}

// A tap on "+" from empty starts at 1 stroke; a tap on "-" below 1 clears
// the entry back to "not entered" rather than going negative.
export function incrementStroke(current: number | null): number {
  return current == null ? 1 : current + 1;
}

export function decrementStroke(current: number | null): number | null {
  if (current == null) return null;
  return current > 1 ? current - 1 : null;
}
