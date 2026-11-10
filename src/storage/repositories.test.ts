import { describe, expect, it } from 'vitest';
import { createDefaultStorage } from './schema';
import { upsertPlayer, deletePlayer } from './playerRepository';
import { upsertCourse, deleteCourse } from './courseRepository';
import { getFormatSettings, setFormatSettings } from './settingsRepository';
import {
  saveInProgressRound,
  discardInProgressRound,
  completeRound,
  deleteRoundFromHistory,
  updateRoundInHistory,
} from './roundRepository';
import type { Round } from '../domain/types';

const round: Round = {
  id: 'r1',
  courseId: 'barseback-ocean',
  formatId: 'bestBallWorstBall',
  scratch: false,
  players: [],
  holeScores: [],
  settings: { bestBallPoints: 1, worstBallPoints: 1 },
  status: 'in_progress',
  startedAt: '2026-01-01T00:00:00.000Z',
};

describe('playerRepository', () => {
  it('adds a new player and updates an existing one by id', () => {
    let storage = createDefaultStorage();
    storage = upsertPlayer(storage, { id: 'p1', name: 'Anna' });
    storage = upsertPlayer(storage, { id: 'p1', name: 'Anna Andersson' });
    expect(storage.players).toEqual([{ id: 'p1', name: 'Anna Andersson' }]);
  });

  it('removes a player by id', () => {
    let storage = createDefaultStorage();
    storage = upsertPlayer(storage, { id: 'p1', name: 'Anna' });
    storage = deletePlayer(storage, 'p1');
    expect(storage.players).toEqual([]);
  });
});

describe('courseRepository', () => {
  it('adds a new course without touching the seed courses', () => {
    let storage = createDefaultStorage();
    const before = storage.courses.length;
    storage = upsertCourse(storage, { id: 'c1', club: 'Klubben', name: 'Egen bana', holes: 9, par: [4,4,4,4,4,4,4,4,4], index: [1,2,3,4,5,6,7,8,9], tees: [] });
    expect(storage.courses.length).toBe(before + 1);
    storage = deleteCourse(storage, 'c1');
    expect(storage.courses.length).toBe(before);
  });
});

describe('settingsRepository', () => {
  it('stores and retrieves settings per format id', () => {
    let storage = createDefaultStorage();
    storage = setFormatSettings(storage, 'bestBallWorstBall', { bestBallPoints: 2, worstBallPoints: 1 });
    expect(getFormatSettings(storage, 'bestBallWorstBall')).toEqual({ bestBallPoints: 2, worstBallPoints: 1 });
    expect(getFormatSettings(storage, 'copenhagen')).toBeUndefined();
  });
});

describe('roundRepository', () => {
  it('saves and discards an in-progress round', () => {
    let storage = createDefaultStorage();
    storage = saveInProgressRound(storage, round);
    expect(storage.inProgressRound).toEqual(round);
    storage = discardInProgressRound(storage);
    expect(storage.inProgressRound).toBeNull();
  });

  it('moves a completed round into history and clears in-progress', () => {
    let storage = createDefaultStorage();
    storage = saveInProgressRound(storage, round);
    storage = completeRound(storage, round);
    expect(storage.inProgressRound).toBeNull();
    expect(storage.roundsHistory).toHaveLength(1);
    expect(storage.roundsHistory[0].status).toBe('completed');
    expect(storage.roundsHistory[0].completedAt).toBeDefined();
  });

  it('deletes a round from history by id', () => {
    let storage = createDefaultStorage();
    storage = completeRound(storage, round);
    storage = deleteRoundFromHistory(storage, round.id);
    expect(storage.roundsHistory).toEqual([]);
  });

  it('updates a round already saved in history, leaving other rounds untouched', () => {
    let storage = createDefaultStorage();
    storage = completeRound(storage, round);
    storage = completeRound(storage, { ...round, id: 'r2' });

    storage = updateRoundInHistory(storage, 'r1', (r) => ({ ...r, scratch: true }));

    expect(storage.roundsHistory.find((r) => r.id === 'r1')?.scratch).toBe(true);
    expect(storage.roundsHistory.find((r) => r.id === 'r2')?.scratch).toBe(false);
  });
});
