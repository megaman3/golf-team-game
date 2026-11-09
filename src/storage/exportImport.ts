import { SCHEMA_VERSION, type AppStorage } from './schema';

export function exportAllAsJson(storage: AppStorage): string {
  return JSON.stringify(storage, null, 2);
}

export type ImportResult =
  | { ok: true; storage: AppStorage }
  | { ok: false; error: string };

export function parseImportedJson(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Filen är inte giltig JSON.' };
  }

  if (!isAppStorageShape(parsed)) {
    return { ok: false, error: 'Filen innehåller inte giltig data för Golf-poängräknaren.' };
  }

  return { ok: true, storage: parsed };
}

function isAppStorageShape(value: unknown): value is AppStorage {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === SCHEMA_VERSION &&
    Array.isArray(v.courses) &&
    Array.isArray(v.players) &&
    typeof v.formatSettings === 'object' &&
    v.formatSettings !== null &&
    Array.isArray(v.roundsHistory) &&
    (v.inProgressRound === null || typeof v.inProgressRound === 'object')
  );
}
