import { useMemo, useState } from 'react';
import { useStorage } from '../../StorageContext';
import { createId } from '../../domain/id';
import type { HoleScore, Round, RoundPlayer } from '../../domain/types';
import { bestBallWorstBall, type BestBallWorstBallSettings } from '../../engine/formats/bestBallWorstBall';
import { getGameFormat } from '../../engine/formats/registry';
import { getFormatSettings, setFormatSettings } from '../../storage/settingsRepository';
import { upsertPlayer } from '../../storage/playerRepository';
import { saveInProgressRound } from '../../storage/roundRepository';
import { CourseSelect } from './CourseSelect';
import { FormatSelect } from './FormatSelect';
import { PlayerSetup, type DraftPlayer } from './PlayerSetup';
import { FormatSettingsForm } from './FormatSettingsForm';
import { pickDefaultTeeId, DEFAULT_HANDICAP } from './defaultTee';
import { CourseBackground } from '../common/CourseBackground';
import { getCourseLogo } from '../../data/courseLogos';
import './RoundSetup.css';

function emptyDraftPlayers(count: number, defaultTeeId: string): DraftPlayer[] {
  return Array.from({ length: count }, (_, i) => ({
    name: '',
    handicap: DEFAULT_HANDICAP,
    team: i < count / 2 ? 'A' : 'B',
    teeId: defaultTeeId,
  }));
}

export function RoundSetup() {
  const { storage, update } = useStorage();

  const [courseId, setCourseId] = useState<string | null>(storage.courses[0]?.id ?? null);
  const course = useMemo(
    () => storage.courses.find((c) => c.id === courseId) ?? null,
    [storage.courses, courseId],
  );
  const [formatId, setFormatId] = useState<string>(bestBallWorstBall.id);
  const format = getGameFormat(formatId);
  const [scratch, setScratch] = useState(false);
  const [players, setPlayers] = useState<DraftPlayer[]>(() =>
    emptyDraftPlayers(format.playerCount, pickDefaultTeeId(course?.tees ?? [])),
  );
  const [settings, setSettings] = useState<unknown>(
    () => getFormatSettings(storage, formatId) ?? format.defaultSettings,
  );
  const [error, setError] = useState<string | null>(null);

  function handleCourseChange(nextCourseId: string) {
    setCourseId(nextCourseId);
    const nextCourse = storage.courses.find((c) => c.id === nextCourseId) ?? null;
    const defaultTeeId = pickDefaultTeeId(nextCourse?.tees ?? []);
    setPlayers((current) => current.map((player) => ({ ...player, teeId: defaultTeeId })));
  }

  function handleFormatChange(nextFormatId: string) {
    setFormatId(nextFormatId);
    const nextFormat = getGameFormat(nextFormatId);
    setPlayers(emptyDraftPlayers(nextFormat.playerCount, pickDefaultTeeId(course?.tees ?? [])));
    setSettings(getFormatSettings(storage, nextFormatId) ?? nextFormat.defaultSettings);
    setError(null);
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
      teeId: draft.teeId,
      ...(format.usesTeams ? { teamId: draft.team } : {}),
    }));

    const holeScores: HoleScore[] = Array.from({ length: course.holes }, (_, i) => ({
      hole: i + 1,
      strokesByPlayer: {},
    }));

    const round: Round = {
      id: createId(),
      courseId: course.id,
      formatId,
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
      next = setFormatSettings(next, formatId, settings);
      next = saveInProgressRound(next, round);
      return next;
    });
  }

  return (
    <CourseBackground image={courseId ? getCourseLogo(courseId) : null} fit="contain">
    <div className="round-setup">
      <h2>Ny runda</h2>
      {error && <p className="round-setup__error">{error}</p>}

      <CourseSelect courses={storage.courses} value={courseId} onChange={handleCourseChange} />
      <FormatSelect value={formatId} onChange={handleFormatChange} />

      <label className="field field--checkbox">
        <input type="checkbox" checked={scratch} onChange={(e) => setScratch(e.target.checked)} />
        <span>Spela utan handicap (scratch)</span>
      </label>

      <PlayerSetup
        usesTeams={format.usesTeams}
        players={players}
        rosterNames={storage.players.map((p) => p.name)}
        tees={course?.tees ?? []}
        onChange={setPlayers}
        defaultTeeId={pickDefaultTeeId(course?.tees ?? [])}
        minPlayers={format.minPlayers}
        maxPlayers={format.maxPlayers}
      />

      {formatId === bestBallWorstBall.id && (
        <FormatSettingsForm
          settings={settings as BestBallWorstBallSettings}
          onChange={(next) => setSettings(next)}
        />
      )}

      <button type="button" className="round-setup__start" onClick={handleStart}>
        Starta runda
      </button>
    </div>
    </CourseBackground>
  );
}
