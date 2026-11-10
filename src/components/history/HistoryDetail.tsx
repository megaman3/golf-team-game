import { useState } from 'react';
import { useStorage } from '../../StorageContext';
import type { TeamId } from '../../domain/types';
import { setPlayerStroke } from '../../domain/roundEditing';
import { computeRoundResult } from '../../engine/roundResult';
import { getGameFormat } from '../../engine/formats/registry';
import { deleteRoundFromHistory, updateRoundInHistory } from '../../storage/roundRepository';
import { describeRoundResult, formatRoundDate } from '../round/roundSummary';
import { RoundCharts } from '../round/RoundCharts';
import './HistoryDetail.css';

interface HistoryDetailProps {
  roundId: string;
  onBack: () => void;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function HistoryDetail({ roundId, onBack }: HistoryDetailProps) {
  const { storage, update } = useStorage();
  const [editing, setEditing] = useState(false);
  const round = storage.roundsHistory.find((r) => r.id === roundId);
  const course = round ? storage.courses.find((c) => c.id === round.courseId) : undefined;

  if (!round || !course) {
    return (
      <div className="history-detail">
        <button type="button" onClick={onBack}>
          ← Tillbaka
        </button>
        <p>Kunde inte hitta rundan.</p>
      </div>
    );
  }

  const format = getGameFormat(round.formatId);
  const result = computeRoundResult(round, course);
  const holes = Array.from({ length: course.holes }, (_, i) => i + 1);
  const splitPoint = Math.ceil(course.holes / 2);
  const front = holes.slice(0, splitPoint);
  const back = holes.slice(splitPoint);

  const parForHoles = (holeNumbers: number[]): number => sum(holeNumbers.map((h) => course.par[h - 1]));

  const playerStrokesSum = (playerId: string, holeNumbers: number[]): number | null => {
    const strokes = holeNumbers.map((h) => round.holeScores[h - 1]?.strokesByPlayer[playerId] ?? null);
    if (strokes.some((s) => s == null)) return null;
    return sum(strokes as number[]);
  };

  const pointsForHoles = (team: TeamId, holeNumbers: number[]): number =>
    sum(holeNumbers.map((h) => result.holeResults[h - 1]?.pointsByTeam?.[team] ?? 0));

  const playerPointsForHoles = (playerId: string, holeNumbers: number[]): number =>
    sum(holeNumbers.map((h) => result.holeResults[h - 1]?.pointsByPlayer?.[playerId] ?? 0));

  const handleDelete = () => {
    const confirmed = window.confirm('Radera den här rundan från historiken? Det går inte att ångra.');
    if (!confirmed) return;
    update((current) => deleteRoundFromHistory(current, round.id));
    onBack();
  };

  const handleStrokeChange = (playerId: string, hole: number, value: string) => {
    if (value !== '' && Number.isNaN(Number(value))) return;
    const strokes = value === '' ? null : Number(value);
    update((current) => updateRoundInHistory(current, round.id, (r) => setPlayerStroke(r, hole, playerId, strokes)));
  };

  return (
    <div className="history-detail">
      <div className="history-detail__header">
        <button type="button" onClick={onBack}>
          ← Tillbaka
        </button>
        <div className="history-detail__header-actions">
          <button type="button" onClick={() => setEditing((current) => !current)}>
            {editing ? 'Klar' : 'Redigera slag'}
          </button>
          <button type="button" className="history-detail__delete" onClick={handleDelete}>
            Radera
          </button>
        </div>
      </div>
      {editing && <p className="history-detail__edit-hint">Ändra ett slag nedan - poäng och resultat räknas om direkt.</p>}

      <h2>
        {course.club} – {course.name}
      </h2>
      <p className="history-detail__meta">
        {formatRoundDate(round.completedAt ?? round.startedAt)} · {format.label}
      </p>
      <p className="history-detail__result">{describeRoundResult(result.totals, result.holeResults, course.holes, round.players)}</p>

      <ul className="history-detail__players">
        {round.players.map((player) => {
          const tee = course.tees.find((t) => t.id === player.teeId);
          return (
            <li key={player.playerId}>
              {player.name}
              {player.teamId ? ` (Lag ${player.teamId})` : ''} —{' '}
              {player.exactHandicapUsed == null ? 'Scratch' : `Hcp ${player.exactHandicapUsed}`}
              {tee ? ` · Tee ${tee.label}` : ''}
            </li>
          );
        })}
      </ul>

      <div className="history-detail__scroll">
        <table className="history-detail__table">
          <thead>
            <tr>
              <th scope="col"> </th>
              {front.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th className="history-detail__summary-col">Ut</th>
              {back.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th className="history-detail__summary-col">In</th>
              <th className="history-detail__summary-col">Tot</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Par</th>
              {front.map((h) => (
                <td key={h}>{course.par[h - 1]}</td>
              ))}
              <td className="history-detail__summary-col">{parForHoles(front)}</td>
              {back.map((h) => (
                <td key={h}>{course.par[h - 1]}</td>
              ))}
              <td className="history-detail__summary-col">{parForHoles(back)}</td>
              <td className="history-detail__summary-col">{parForHoles(holes)}</td>
            </tr>
            <tr>
              <th scope="row">Index</th>
              {front.map((h) => (
                <td key={h}>{course.index[h - 1]}</td>
              ))}
              <td className="history-detail__summary-col" />
              {back.map((h) => (
                <td key={h}>{course.index[h - 1]}</td>
              ))}
              <td className="history-detail__summary-col" />
              <td className="history-detail__summary-col" />
            </tr>
            {round.players.map((player) => {
              const outSum = playerStrokesSum(player.playerId, front);
              const inSum = playerStrokesSum(player.playerId, back);
              const total = outSum != null && inSum != null ? outSum + inSum : null;
              const renderStrokeCell = (h: number) => {
                const strokes = round.holeScores[h - 1]?.strokesByPlayer[player.playerId] ?? null;
                if (!editing) return strokes ?? '–';
                return (
                  <input
                    type="number"
                    className="history-detail__stroke-input"
                    value={strokes ?? ''}
                    onChange={(e) => handleStrokeChange(player.playerId, h, e.target.value)}
                  />
                );
              };
              return (
                <tr key={player.playerId}>
                  <th scope="row">{player.name}</th>
                  {front.map((h) => <td key={h}>{renderStrokeCell(h)}</td>)}
                  <td className="history-detail__summary-col">{outSum ?? '–'}</td>
                  {back.map((h) => <td key={h}>{renderStrokeCell(h)}</td>)}
                  <td className="history-detail__summary-col">{inSum ?? '–'}</td>
                  <td className="history-detail__summary-col">{total ?? '–'}</td>
                </tr>
              );
            })}
            {format.usesTeams ? (
              <>
                <tr className="history-detail__points-row">
                  <th scope="row">Poäng A</th>
                  {front.map((h) => (
                    <td key={h}>{result.holeResults[h - 1]?.pointsByTeam?.A ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{pointsForHoles('A', front)}</td>
                  {back.map((h) => (
                    <td key={h}>{result.holeResults[h - 1]?.pointsByTeam?.A ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{pointsForHoles('A', back)}</td>
                  <td className="history-detail__summary-col">{pointsForHoles('A', holes)}</td>
                </tr>
                <tr className="history-detail__points-row">
                  <th scope="row">Poäng B</th>
                  {front.map((h) => (
                    <td key={h}>{result.holeResults[h - 1]?.pointsByTeam?.B ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{pointsForHoles('B', front)}</td>
                  {back.map((h) => (
                    <td key={h}>{result.holeResults[h - 1]?.pointsByTeam?.B ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{pointsForHoles('B', back)}</td>
                  <td className="history-detail__summary-col">{pointsForHoles('B', holes)}</td>
                </tr>
              </>
            ) : (
              round.players.map((player) => (
                <tr key={`points-${player.playerId}`} className="history-detail__points-row">
                  <th scope="row">Poäng {player.name}</th>
                  {front.map((h) => (
                    <td key={h}>{result.holeResults[h - 1]?.pointsByPlayer?.[player.playerId] ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{playerPointsForHoles(player.playerId, front)}</td>
                  {back.map((h) => (
                    <td key={h}>{result.holeResults[h - 1]?.pointsByPlayer?.[player.playerId] ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{playerPointsForHoles(player.playerId, back)}</td>
                  <td className="history-detail__summary-col">{playerPointsForHoles(player.playerId, holes)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RoundCharts holeResults={result.holeResults} players={round.players} usesTeams={format.usesTeams} />
    </div>
  );
}
