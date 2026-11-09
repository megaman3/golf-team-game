import { useStorage } from '../../StorageContext';
import type { TeamId } from '../../domain/types';
import { computeRoundResult } from '../../engine/roundResult';
import { getGameFormat } from '../../engine/formats/registry';
import { deleteRoundFromHistory } from '../../storage/roundRepository';
import { describeRoundResult, formatRoundDate } from '../round/roundSummary';
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
  const round = storage.roundsHistory.find((r) => r.id === roundId);
  const course = round ? storage.courses.find((c) => c.id === round.courseId) : undefined;
  const tee = course && round ? course.tees.find((t) => t.id === round.teeId) : undefined;

  if (!round || !course || !tee) {
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
  const result = computeRoundResult(round, course, tee);
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

  const handleDelete = () => {
    const confirmed = window.confirm('Radera den här rundan från historiken? Det går inte att ångra.');
    if (!confirmed) return;
    update((current) => deleteRoundFromHistory(current, round.id));
    onBack();
  };

  return (
    <div className="history-detail">
      <div className="history-detail__header">
        <button type="button" onClick={onBack}>
          ← Tillbaka
        </button>
        <button type="button" className="history-detail__delete" onClick={handleDelete}>
          Radera
        </button>
      </div>

      <h2>
        {course.club} – {course.name} ({tee.label})
      </h2>
      <p className="history-detail__meta">
        {formatRoundDate(round.completedAt ?? round.startedAt)} · {format.label}
      </p>
      <p className="history-detail__result">{describeRoundResult(result.totals, round.players)}</p>

      <ul className="history-detail__players">
        {round.players.map((player) => (
          <li key={player.playerId}>
            {player.name}
            {player.teamId ? ` (Lag ${player.teamId})` : ''} —{' '}
            {player.exactHandicapUsed == null ? 'Scratch' : `Hcp ${player.exactHandicapUsed}`}
          </li>
        ))}
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
              return (
                <tr key={player.playerId}>
                  <th scope="row">{player.name}</th>
                  {front.map((h) => (
                    <td key={h}>{round.holeScores[h - 1]?.strokesByPlayer[player.playerId] ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{outSum ?? '–'}</td>
                  {back.map((h) => (
                    <td key={h}>{round.holeScores[h - 1]?.strokesByPlayer[player.playerId] ?? '–'}</td>
                  ))}
                  <td className="history-detail__summary-col">{inSum ?? '–'}</td>
                  <td className="history-detail__summary-col">{total ?? '–'}</td>
                </tr>
              );
            })}
            {format.usesTeams && (
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
