import { useMemo, useState } from 'react';
import { useStorage } from '../../StorageContext';
import { createId } from '../../domain/id';
import type { HoleScore, Round, RoundPlayer } from '../../domain/types';
import {
  bestBallWorstBall,
  defaultBestBallWorstBallSettings,
  type BestBallWorstBallSettings,
} from '../../engine/formats/bestBallWorstBall';
import { getFormatSettings, setFormatSettings } from '../../storage/settingsRepository';
import { upsertPlayer } from '../../storage/playerRepository';
import { saveInProgressRound } from '../../storage/roundRepository';
import { CourseSelect } from './CourseSelect';
import { PlayerSetup, type DraftPlayer } from './PlayerSetup';
import { FormatSettingsForm } from './FormatSettingsForm';
import './RoundSetup.css';

const FORMAT_ID = bestBallWorstBall.id;

function emptyDraftPlayers(defaultTeeId: string): DraftPlayer[] {
  return [
    { name: '', handicap: '', team: 'A', teeId: defaultTeeId },
    { name: '', handicap: '', team: 'A', teeId: defaultTeeId },
    { name: '', handicap: '', team: 'B', teeId: defaultTeeId },
    { name: '', handicap: '', team: 'B', teeId: defaultTeeId },
  ];
}

export function RoundSetup() {
  const { storage, update } = useStorage();

  const [courseId, setCourseId] = useState<string | null>(storage.courses[0]?.id ?? null);
  const course = useMemo(
    () => storage.courses.find((c) => c.id === courseId) ?? null,
    [storage.courses, courseId],
  );
  const [scratch, setScratch] = useState(false);
  const [players, setPlayers] = useState<DraftPlayer[]>(() => emptyDraftPlayers(course?.tees[0]?.id ?? ''));
  const [settings, setSettings] = useState<BestBallWorstBallSettings>(
    () => getFormatSettings<BestBallWorstBallSettings>(storage, FORMAT_ID) ?? defaultBestBallWorstBallSettings,
  );
  const [error, setError] = useState<string | null>(null);

  function handleCourseChange(nextCourseId: string) {
    setCourseId(nextCourseId);
    const nextCourse = storage.courses.find((c) => c.id === nextCourseId) ?? null;
    const defaultTeeId = nextCourse?.tees[0]?.id ?? '';
    setPlayers((current) => current.map((player) => ({ ...player, teeId: defaultTeeId })));
  }

  function resolvePlayerId(name: string): string {
    const trimmed = name.trim();
    const existing = storage.players.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    return existing?.id ?? createId();
  }

  function handleStart() {
    if (!course) {
      setError('Välj bana.');
      return;
    }
    if (players.some((p) => p.name.trim() === '')) {
      setError('Alla spelare måste ha ett namn.');
      return;
    }
    if (players.some((p) => !p.teeId)) {
      setError('Alla spelare måste ha en tee.');
      return;
    }
    if (!scratch && players.some((p) => p.handicap.trim() === '' || Number.isNaN(Number(p.handicap)))) {
      setError('Ange handicap för alla spelare, eller välj scratch för rundan.');
      return;
    }

    const roundPlayers: RoundPlayer[] = players.map((draft) => ({
      playerId: resolvePlayerId(draft.name),
      name: draft.name.trim(),
      exactHandicapUsed: scratch ? null : Number(draft.handicap),
      teamId: draft.team,
      teeId: draft.teeId,
    }));

    const holeScores: HoleScore[] = Array.from({ length: course.holes }, (_, i) => ({
      hole: i + 1,
      strokesByPlayer: {},
    }));

    const round: Round = {
      id: createId(),
      courseId: course.id,
      formatId: FORMAT_ID,
      scratch,
      players: roundPlayers,
      holeScores,
      settings,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      currentHole: 1,
    };

    setError(null);
    update((current) => {
      let next = current;
      for (const player of roundPlayers) {
        if (player.exactHandicapUsed != null) {
          next = upsertPlayer(next, { id: player.playerId, name: player.name, defaultHandicap: player.exactHandicapUsed });
        } else {
          next = upsertPlayer(next, { id: player.playerId, name: player.name });
        }
      }
      next = setFormatSettings(next, FORMAT_ID, settings);
      next = saveInProgressRound(next, round);
      return next;
    });
  }

  return (
    <div className="round-setup">
      <h2>Ny runda</h2>
      {error && <p className="round-setup__error">{error}</p>}

      <CourseSelect courses={storage.courses} value={courseId} onChange={handleCourseChange} />

      <label className="field field--checkbox">
        <input type="checkbox" checked={scratch} onChange={(e) => setScratch(e.target.checked)} />
        <span>Spela utan handicap (scratch)</span>
      </label>

      <PlayerSetup
        playerCount={bestBallWorstBall.playerCount}
        usesTeams={bestBallWorstBall.usesTeams}
        players={players}
        rosterNames={storage.players.map((p) => p.name)}
        tees={course?.tees ?? []}
        onChange={setPlayers}
      />

      <FormatSettingsForm settings={settings} onChange={setSettings} />

      <button type="button" className="round-setup__start" onClick={handleStart}>
        Starta runda
      </button>
    </div>
  );
}
