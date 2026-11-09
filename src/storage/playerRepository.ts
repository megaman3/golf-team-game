import type { PlayerRosterEntry } from '../domain/types';
import type { AppStorage } from './schema';

export function upsertPlayer(storage: AppStorage, player: PlayerRosterEntry): AppStorage {
  const exists = storage.players.some((p) => p.id === player.id);
  const players = exists
    ? storage.players.map((p) => (p.id === player.id ? player : p))
    : [...storage.players, player];
  return { ...storage, players };
}

export function deletePlayer(storage: AppStorage, playerId: string): AppStorage {
  return { ...storage, players: storage.players.filter((p) => p.id !== playerId) };
}
