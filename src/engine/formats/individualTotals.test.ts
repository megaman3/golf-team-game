import { describe, expect, it } from 'vitest';
import { aggregateIndividualPoints } from './individualTotals';
import type { HolePointsResult } from './types';

describe('aggregateIndividualPoints', () => {
  it('sums points across complete holes only', () => {
    const holeResults: HolePointsResult[] = [
      { hole: 1, complete: true, pointsByPlayer: { a: 3, b: 2 } },
      { hole: 2, complete: false },
      { hole: 3, complete: true, pointsByPlayer: { a: 1, b: 4 } },
    ];
    const totals = aggregateIndividualPoints(holeResults);
    expect(totals.pointsByPlayer).toEqual({ a: 4, b: 6 });
    expect(totals.winnerPlayerIds).toEqual(['b']);
  });

  it('credits every player tied for the highest total', () => {
    const holeResults: HolePointsResult[] = [{ hole: 1, complete: true, pointsByPlayer: { a: 3, b: 3, c: 1 } }];
    const totals = aggregateIndividualPoints(holeResults);
    expect(totals.winnerPlayerIds?.sort()).toEqual(['a', 'b']);
  });

  it('returns an empty result when no holes are complete', () => {
    const totals = aggregateIndividualPoints([{ hole: 1, complete: false }]);
    expect(totals.pointsByPlayer).toEqual({});
    expect(totals.winnerPlayerIds).toEqual([]);
  });
});
