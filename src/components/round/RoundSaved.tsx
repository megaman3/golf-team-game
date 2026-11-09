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
  const tee = course && round ? course.tees.find((t) => t.id === round.teeId) : undefined;

  return (
    <div className="round-saved">
      <h2>Rundan sparad</h2>
      {round && course && tee ? (
        <>
          <p className="round-saved__course">
            {course.club} – {course.name} ({tee.label})
          </p>
          <p className="round-saved__result">{describeRoundResult(computeRoundResult(round, course, tee).totals, round.players)}</p>
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
