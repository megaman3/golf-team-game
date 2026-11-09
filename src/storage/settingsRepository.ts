import type { AppStorage } from './schema';

export function getFormatSettings<T>(storage: AppStorage, formatId: string): T | undefined {
  return storage.formatSettings[formatId] as T | undefined;
}

export function setFormatSettings(storage: AppStorage, formatId: string, settings: unknown): AppStorage {
  return { ...storage, formatSettings: { ...storage.formatSettings, [formatId]: settings } };
}
