import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { loadStorage, saveStorage } from './storage/storage';
import type { AppStorage } from './storage/schema';

interface StorageContextValue {
  storage: AppStorage;
  update: (updater: (current: AppStorage) => AppStorage) => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [storage, setStorage] = useState<AppStorage>(() => loadStorage(window.localStorage));

  const update = (updater: (current: AppStorage) => AppStorage) => {
    setStorage((current) => {
      const next = updater(current);
      saveStorage(window.localStorage, next);
      return next;
    });
  };

  const value = useMemo(() => ({ storage, update }), [storage]);

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error('useStorage måste användas inom en StorageProvider');
  }
  return ctx;
}
