import type { Course, PlayerRosterEntry, Round } from '../domain/types';
import { seedCourses } from '../data/courses';

export const SCHEMA_VERSION = 1;

export interface AppStorage {
  schemaVersion: typeof SCHEMA_VERSION;
  courses: Course[];
  players: PlayerRosterEntry[];
  formatSettings: Record<string, unknown>;
  roundsHistory: Round[];
  inProgressRound: Round | null;
}

export function createDefaultStorage(): AppStorage {
  return {
    schemaVersion: SCHEMA_VERSION,
    courses: seedCourses,
    players: [],
    formatSettings: {},
    roundsHistory: [],
    inProgressRound: null,
  };
}
