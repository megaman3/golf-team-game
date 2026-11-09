import { useStorage } from '../../StorageContext';
import { getGameFormat } from '../../engine/formats/registry';
import { computeRoundResult } from '../../engine/roundResult';
import { describeRoundResult, formatRoundDate } from '../round/roundSummary';
import './HistoryList.css';

interface HistoryListProps {
  onOpenRound: (roundId: string) => void;
}

export function HistoryList({ onOpenRound }: HistoryListProps) {
  const { storage } = useStorage();

  if (storage.roundsHistory.length === 0) {
    return <p className="history-list__empty">Inga avslutade rundor än.</p>;
  }

  return (
    <ul className="history-list">
      {storage.roundsHistory.map((round) => {
        const course = storage.courses.find((c) => c.id === round.courseId);
        const tee = course?.tees.find((t) => t.id === round.teeId);
        const format = getGameFormat(round.formatId);
        const resultText =
          course && tee ? describeRoundResult(computeRoundResult(round, course, tee).totals, round.players) : '';

        return (
          <li key={round.id} className="history-list__item">
            <button type="button" className="history-list__open" onClick={() => onOpenRound(round.id)}>
              <span className="history-list__date">{formatRoundDate(round.completedAt ?? round.startedAt)}</span>
              <span className="history-list__course">
                {course ? `${course.club} – ${course.name}` : 'Okänd bana'}
                {tee ? ` (${tee.label})` : ''}
              </span>
              <span className="history-list__format">{format.label}</span>
              {resultText && <span className="history-list__result">{resultText}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
