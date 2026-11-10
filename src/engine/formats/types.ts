import type { RoundPlayer, TeamId } from '../../domain/types';

export interface HoleStrokeInput {
  hole: number;
  par: number;
  index: number;
  strokesByPlayer: Record<string, number | null>;
  handicapStrokesByPlayer: Record<string, number>;
}

export interface HolePointsResult {
  hole: number;
  // False until every player this format requires has entered a stroke count
  // for this hole.
  complete: boolean;
  pointsByPlayer?: Record<string, number>;
  pointsByTeam?: Record<TeamId, number>;
  detail?: unknown;
}

export interface RoundTotals {
  pointsByPlayer?: Record<string, number>;
  pointsByTeam?: Record<TeamId, number>;
  // More than one id/team means a shared win.
  winnerPlayerIds?: string[];
  winnerTeamIds?: Array<TeamId | 'tie'>;
}

export interface GameFormatModule<TSettings> {
  id: string;
  label: string;
  // Default/initial number of player slots shown in setup.
  playerCount: number;
  // When set, the format allows a variable number of players between these
  // two (inclusive) - setup shows add/remove controls instead of a fixed
  // number of slots. Omitted for formats with an exact player count.
  minPlayers?: number;
  maxPlayers?: number;
  usesTeams: boolean;
  defaultSettings: TSettings;
  computeHolePoints(
    input: HoleStrokeInput,
    settings: TSettings,
    players: RoundPlayer[],
  ): HolePointsResult;
  computeRoundTotals(holeResults: HolePointsResult[], players: RoundPlayer[]): RoundTotals;
}
