import type { TeamId, Tee } from '../../domain/types';

export interface DraftPlayer {
  name: string;
  handicap: string;
  team: TeamId;
  teeId: string;
}

interface PlayerSetupProps {
  playerCount: number;
  usesTeams: boolean;
  players: DraftPlayer[];
  rosterNames: string[];
  tees: Tee[];
  onChange: (players: DraftPlayer[]) => void;
}

export function PlayerSetup({ playerCount, usesTeams, players, rosterNames, tees, onChange }: PlayerSetupProps) {
  function updatePlayer(index: number, patch: Partial<DraftPlayer>) {
    onChange(players.map((player, i) => (i === index ? { ...player, ...patch } : player)));
  }

  return (
    <fieldset className="player-setup">
      <legend>Spelare</legend>
      <datalist id="player-roster">
        {rosterNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {Array.from({ length: playerCount }, (_, index) => {
        const player = players[index];
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
            </div>
            {selectedTee && (
              <p className="player-setup__tee-info">
                {selectedTee.slope != null && selectedTee.courseRating != null
                  ? `Slope ${selectedTee.slope} · Course rating ${selectedTee.courseRating}`
                  : 'Slope/course rating saknas - handicap räknas med enkel avrundning'}
              </p>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
