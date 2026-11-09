import { describe, expect, it } from 'vitest';
import { createDefaultStorage, SCHEMA_VERSION } from './schema';
import { loadStorage, saveStorage, type StorageLike } from './storage';

function createMemoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('loadStorage', () => {
  it('returns default storage (with seed courses) on first run with nothing saved', () => {
    const backend = createMemoryStorage();
    const storage = loadStorage(backend);

    expect(storage.schemaVersion).toBe(SCHEMA_VERSION);
    expect(storage.courses.length).toBeGreaterThan(0);
    expect(storage.players).toEqual([]);
    expect(storage.roundsHistory).toEqual([]);
    expect(storage.inProgressRound).toBeNull();
  });

  it('round-trips a saved storage object exactly', () => {
    const backend = createMemoryStorage();
    const original = createDefaultStorage();
    original.players.push({ id: 'p1', name: 'Anna', defaultHandicap: 12 });

    saveStorage(backend, original);
    const loaded = loadStorage(backend);

    expect(loaded).toEqual(original);
  });

  it('falls back to defaults when the saved data is corrupt JSON', () => {
    const backend = createMemoryStorage();
    backend.setItem('golf-team-game:v1', '{not valid json');

    const storage = loadStorage(backend);
    expect(storage).toEqual(createDefaultStorage());
  });

  it('falls back to defaults when the schema version does not match', () => {
    const backend = createMemoryStorage();
    backend.setItem('golf-team-game:v1', JSON.stringify({ schemaVersion: 999 }));

    const storage = loadStorage(backend);
    expect(storage).toEqual(createDefaultStorage());
  });

  it('fills in missing fields with defaults when the saved shape is partial', () => {
    const backend = createMemoryStorage();
    backend.setItem('golf-team-game:v1', JSON.stringify({ schemaVersion: SCHEMA_VERSION, players: [] }));

    const storage = loadStorage(backend);
    expect(storage.players).toEqual([]);
    expect(storage.courses.length).toBeGreaterThan(0);
    expect(storage.roundsHistory).toEqual([]);
  });
});
