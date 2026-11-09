import { createDefaultStorage, SCHEMA_VERSION, type AppStorage } from './schema';

const STORAGE_KEY = 'golf-team-game:v1';

// Matches the subset of the Web Storage API we need, so tests can pass an
// in-memory fake instead of requiring a browser/jsdom environment.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadStorage(backend: StorageLike): AppStorage {
  const raw = backend.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultStorage();
  }

  try {
    return migrate(JSON.parse(raw));
  } catch {
    return createDefaultStorage();
  }
}

export function saveStorage(backend: StorageLike, storage: AppStorage): void {
  try {
    backend.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'QuotaExceededError') {
      throw new Error('Lagringsutrymmet i webbläsaren är fullt. Exportera och radera gammal historik.');
    }
    throw err;
  }
}

function migrate(parsed: unknown): AppStorage {
  if (!parsed || typeof parsed !== 'object') {
    return createDefaultStorage();
  }

  const value = parsed as Record<string, unknown>;
  if (value.schemaVersion !== SCHEMA_VERSION) {
    // No older schema to migrate from yet - fall back to defaults rather
    // than guessing at a shape that was never shipped.
    return createDefaultStorage();
  }

  const defaults = createDefaultStorage();
  return {
    schemaVersion: SCHEMA_VERSION,
    courses: Array.isArray(value.courses) ? (value.courses as AppStorage['courses']) : defaults.courses,
    players: Array.isArray(value.players) ? (value.players as AppStorage['players']) : defaults.players,
    formatSettings:
      typeof value.formatSettings === 'object' && value.formatSettings !== null
        ? (value.formatSettings as AppStorage['formatSettings'])
        : defaults.formatSettings,
    roundsHistory: Array.isArray(value.roundsHistory)
      ? (value.roundsHistory as AppStorage['roundsHistory'])
      : defaults.roundsHistory,
    inProgressRound: (value.inProgressRound as AppStorage['inProgressRound'] | undefined) ?? null,
  };
}
