import { createDefaultStorage, SCHEMA_VERSION, type AppStorage } from './schema';
import { seedCourses } from '../data/courses';
import type { Course } from '../domain/types';

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

// New seed courses shipped in a later app version wouldn't otherwise reach
// browsers that already have saved data, since a saved `courses` array
// always wins over the shipped seed. Appending any seed course whose id
// isn't already present picks up new courses without touching the ones a
// person may have already edited (e.g. a corrected hole index).
function mergeSeedCourses(courses: Course[]): Course[] {
  const existingIds = new Set(courses.map((c) => c.id));
  const missing = seedCourses.filter((c) => !existingIds.has(c.id));
  return missing.length > 0 ? [...courses, ...missing] : courses;
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
    courses: mergeSeedCourses(Array.isArray(value.courses) ? (value.courses as AppStorage['courses']) : defaults.courses),
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
