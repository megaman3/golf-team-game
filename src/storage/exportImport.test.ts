import { describe, expect, it } from 'vitest';
import { createDefaultStorage } from './schema';
import { exportAllAsJson, parseImportedJson } from './exportImport';

describe('export/import round-trip', () => {
  it('imports exactly what was exported, including history and an in-progress round', () => {
    const storage = createDefaultStorage();
    storage.players.push({ id: 'p1', name: 'Anna' });
    storage.roundsHistory.push({
      id: 'r1',
      courseId: 'barseback-ocean',
      formatId: 'bestBallWorstBall',
      scratch: false,
      players: [],
      holeScores: [],
      settings: { bestBallPoints: 1, worstBallPoints: 1 },
      status: 'completed',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T03:00:00.000Z',
    });

    const json = exportAllAsJson(storage);
    const result = parseImportedJson(json);

    expect(result.ok).toBe(true);
    expect(result.ok && result.storage).toEqual(storage);
  });

  it('rejects a file that is not valid JSON', () => {
    const result = parseImportedJson('{not json');
    expect(result).toEqual({ ok: false, error: 'Filen är inte giltig JSON.' });
  });

  it('rejects valid JSON that does not look like app storage', () => {
    const result = parseImportedJson(JSON.stringify({ hello: 'world' }));
    expect(result.ok).toBe(false);
  });
});
