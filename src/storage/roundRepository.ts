import type { Round } from '../domain/types';
import type { AppStorage } from './schema';

export function saveInProgressRound(storage: AppStorage, round: Round): AppStorage {
  return { ...storage, inProgressRound: round };
}

export function discardInProgressRound(storage: AppStorage): AppStorage {
  return { ...storage, inProgressRound: null };
}

export function completeRound(storage: AppStorage, round: Round): AppStorage {
  const completed: Round = { ...round, status: 'completed', completedAt: new Date().toISOString() };
  return {
    ...storage,
    roundsHistory: [completed, ...storage.roundsHistory],
    inProgressRound: null,
  };
}

export function deleteRoundFromHistory(storage: AppStorage, roundId: string): AppStorage {
  return { ...storage, roundsHistory: storage.roundsHistory.filter((round) => round.id !== roundId) };
}
