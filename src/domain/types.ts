export type TeeId = 'blue' | 'red' | 'white' | 'yellow';

export interface Tee {
  id: TeeId;
  label: string;
  lengthMeters?: number;
  slope?: number;
  courseRating?: number;
}

export interface Course {
  id: string;
  club: string;
  name: string;
  holes: number;
  par: number[];
  index: number[];
  tees: Tee[];
}

export interface PlayerRosterEntry {
  id: string;
  name: string;
  defaultHandicap?: number;
}

export type TeamId = 'A' | 'B';

export interface RoundPlayer {
  playerId: string;
  // Snapshot of the roster name at round time, so renaming/removing a roster
  // entry later doesn't corrupt saved history.
  name: string;
  // null means this player plays scratch (no handicap strokes) this round.
  exactHandicapUsed: number | null;
  teamId?: TeamId;
}

export interface HoleScore {
  hole: number;
  // Keyed by playerId. A missing/null entry means that player hasn't entered
  // a stroke count for this hole yet.
  strokesByPlayer: Record<string, number | null>;
}

export type RoundStatus = 'in_progress' | 'completed';

export interface Round {
  id: string;
  courseId: string;
  teeId: TeeId;
  formatId: string;
  scratch: boolean;
  players: RoundPlayer[];
  holeScores: HoleScore[];
  // Shape owned by the matching GameFormatModule's settings type.
  settings: unknown;
  status: RoundStatus;
  startedAt: string;
  completedAt?: string;
  currentHole?: number;
}
