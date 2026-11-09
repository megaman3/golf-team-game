import { useStorage } from '../../StorageContext';
import { computeRoundResult } from '../../engine/roundResult';
import { describeRoundResult } from './roundSummary';
import './RoundSaved.css';

interface RoundSavedProps {
  onStartNewRound: () => void;
}

export function RoundSaved({ onStartNewRound }: RoundSavedProps) {
  const { storage } = useStorage();
  const round = storage.roundsHistory[0];
  const course = round ? storage.courses.find((c) => c.id === round.courseId) : undefined;

  return (
    <div className="round-saved">
      <h2>Rundan sparad</h2>
      {round && course ? (
        <>
          <p className="round-saved__course">
            {course.club} – {course.name}
          </p>
          <p className="round-saved__result">{describeRoundResult(computeRoundResult(round, course).totals, round.players)}</p>
        </>
      ) : (
        <p>Rundan ligger nu i historiken.</p>
      )}
      <button type="button" className="round-saved__start" onClick={onStartNewRound}>
        Starta ny runda
      </button>
    </div>
  );
}
