export type ScoreCategory =
  | 'double-eagle'
  | 'eagle'
  | 'birdie'
  | 'par'
  | 'bogey'
  | 'double-bogey'
  | 'triple-bogey-or-worse';

// Classifies a net score (gross strokes minus handicap strokes) relative to
// par, using the standard golf naming - e.g. a net score 2 under par is an
// eagle regardless of whether that came from skill or handicap strokes.
export function scoreCategory(net: number, par: number): ScoreCategory {
  const diff = net - par;
  if (diff <= -3) return 'double-eagle';
  if (diff === -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double-bogey';
  return 'triple-bogey-or-worse';
}
