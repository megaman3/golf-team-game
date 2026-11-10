import { scoreCategory, type ScoreCategory } from '../../engine/scoreCategory';

const CLASS_BY_CATEGORY: Record<ScoreCategory, string | undefined> = {
  'double-eagle': 'score-cell--double-eagle',
  eagle: 'score-cell--eagle',
  birdie: 'score-cell--birdie',
  par: undefined,
  bogey: 'score-cell--bogey',
  'double-bogey': 'score-cell--double-bogey',
  'triple-bogey-or-worse': 'score-cell--triple-bogey-or-worse',
};

// Returns the CSS class for a stroke cell's net score vs. par, or undefined
// when there's no score yet or the hole was played at par (left unstyled).
export function scoreCellClassName(net: number | null, par: number): string | undefined {
  if (net == null) return undefined;
  return CLASS_BY_CATEGORY[scoreCategory(net, par)];
}
