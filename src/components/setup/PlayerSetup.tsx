import type { TeamId, Tee } from '../../domain/types';
import { DEFAULT_HANDICAP } from './defaultTee';

export interface DraftPlayer {
  name: string;
  handicap: string;
  team: TeamId;
  teeId: string;
}

interface PlayerSetupProps {
  usesTeams: boolean;
  players: DraftPlayer[];
  rosterNames: string[];
  tees: Tee[];
  onChange: (players: DraftPlayer[]) => void;
  defaultTeeId: string;
  // When both are set, the number of player rows becomes adjustable
  // between them instead of fixed to players.length.
  minPlayers?: number;
  maxPlayers?: number;
}

export function PlayerSetup({
  usesTeams,
  players,
  rosterNames,
  tees,
  onChange,
  defaultTeeId,
  minPlayers,
  maxPlayers,
}: PlayerSetupProps) {
  const variableCount = minPlayers != null && maxPlayers != null;

  function updatePlayer(index: number, patch: Partial<DraftPlayer>) {
    onChange(players.map((player, i) => (i === index ? { ...player, ...patch } : player)));
  }

  function addPlayer() {
    onChange([...players, { name: '', handicap: DEFAULT_HANDICAP, team: 'A', teeId: defaultTeeId }]);
  }

  function removePlayer(index: number) {
    onChange(players.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="player-setup">
      <legend>Spelare</legend>
      <datalist id="player-roster">
        {rosterNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {players.map((player, index) => {
        const selectedTee = tees.find((t) => t.id === player.teeId);
        return (
          <div className="player-setup__entry" key={index}>
            <div className="player-setup__row">
              <input
                type="text"
                list="player-roster"
                placeholder={`Spelare ${index + 1}`}
                value={player.name}
                onChange={(e) => updatePlayer(index, { name: e.target.value })}
              />
              <input
                type="number"
                step="0.1"
                placeholder="Hcp"
                value={player.handicap}
                onChange={(e) => updatePlayer(index, { handicap: e.target.value })}
              />
              <select
                className="player-setup__tee"
                value={player.teeId}
                onChange={(e) => updatePlayer(index, { teeId: e.target.value })}
                disabled={tees.length === 0}
              >
                {tees.map((tee) => (
                  <option key={tee.id} value={tee.id}>
                    Tee {tee.label}
                  </option>
                ))}
              </select>
              {usesTeams && (
                <select
                  value={player.team}
                  onChange={(e) => updatePlayer(index, { team: e.target.value as TeamId })}
                >
                  <option value="A">Lag A</option>
                  <option value="B">Lag B</option>
                </select>
              )}
              {variableCount && players.length > (minPlayers ?? 1) && (
                <button
                  type="button"
                  className="player-setup__remove"
                  onClick={() => removePlayer(index)}
                  aria-label={`Ta bort spelare ${index + 1}`}
                >
                  ×
                </button>
              )}
            </div>
            {selectedTee && (
              <p className="player-setup__tee-info">
                {selectedTee.slope != null && selectedTee.courseRating != null
                  ? `Slope ${selectedTee.slope} · Course rating ${selectedTee.courseRating} (herrar)`
                  : 'Slope/course rating saknas - handicap räknas med enkel avrundning'}
              </p>
            )}
          </div>
        );
      })}
      {variableCount && players.length < (maxPlayers ?? players.length) && (
        <button type="button" className="player-setup__add" onClick={addPlayer}>
          + Lägg till spelare
        </button>
      )}
    </fieldset>
  );
}
