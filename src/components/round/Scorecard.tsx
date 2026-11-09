import { useStorage } from '../../StorageContext';
import { setCurrentHole } from '../../domain/roundEditing';
import './Scorecard.css';

interface ScorecardProps {
  onSelectHole: () => void;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function Scorecard({ onSelectHole }: ScorecardProps) {
  const { storage, update } = useStorage();
  const round = storage.inProgressRound;
  const course = round ? storage.courses.find((c) => c.id === round.courseId) : undefined;

  if (!round || !course) {
    return <p>Kunde inte hitta bana för den pågående rundan.</p>;
  }

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

  const handleIndexChange = (holeNumber: number, value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    update((current) => ({
      ...current,
      courses: current.courses.map((c) =>
        c.id === course.id ? { ...c, index: c.index.map((idx, i) => (i === holeNumber - 1 ? parsed : idx)) } : c,
      ),
    }));
  };

  function goToHole(hole: number) {
    update((current) => {
      if (!current.inProgressRound) return current;
      return { ...current, inProgressRound: setCurrentHole(current.inProgressRound, hole) };
    });
    onSelectHole();
  }

  return (
    <div className="scorecard">
      <div className="scorecard__header">
        <h2>Scorekort</h2>
        <button type="button" onClick={onSelectHole}>
          Tillbaka till hålinmatning
        </button>
      </div>
      <p className="scorecard__hint">Tryck på ett hålnummer för att gå dit och rätta.</p>

      <div className="scorecard__scroll">
        <table className="scorecard__table">
          <thead>
            <tr>
              <th scope="col"> </th>
              {front.map((hole) => (
                <th key={hole} scope="col">
                  <button type="button" className="scorecard__hole-button" onClick={() => goToHole(hole)}>
                    {hole}
                  </button>
                </th>
              ))}
              <th scope="col" className="scorecard__summary-col">
                Ut
              </th>
              {back.map((hole) => (
                <th key={hole} scope="col">
                  <button type="button" className="scorecard__hole-button" onClick={() => goToHole(hole)}>
                    {hole}
                  </button>
                </th>
              ))}
              <th scope="col" className="scorecard__summary-col">
                In
              </th>
              <th scope="col" className="scorecard__summary-col">
                Tot
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Par</th>
              {front.map((hole) => (
                <td key={hole}>{course.par[hole - 1]}</td>
              ))}
              <td className="scorecard__summary-col">{parForHoles(front)}</td>
              {back.map((hole) => (
                <td key={hole}>{course.par[hole - 1]}</td>
              ))}
              <td className="scorecard__summary-col">{parForHoles(back)}</td>
              <td className="scorecard__summary-col">{parForHoles(holes)}</td>
            </tr>
            <tr>
              <th scope="row">Index</th>
              {front.map((hole) => (
                <td key={hole}>
                  <input
                    type="number"
                    className="scorecard__index-input"
                    value={course.index[hole - 1]}
                    onChange={(e) => handleIndexChange(hole, e.target.value)}
                  />
                </td>
              ))}
              <td className="scorecard__summary-col" />
              {back.map((hole) => (
                <td key={hole}>
                  <input
                    type="number"
                    className="scorecard__index-input"
                    value={course.index[hole - 1]}
                    onChange={(e) => handleIndexChange(hole, e.target.value)}
                  />
                </td>
              ))}
              <td className="scorecard__summary-col" />
              <td className="scorecard__summary-col" />
            </tr>
            {round.players.map((player) => {
              const outSum = playerStrokesSum(player.playerId, front);
              const inSum = playerStrokesSum(player.playerId, back);
              const total = outSum != null && inSum != null ? outSum + inSum : null;
              return (
                <tr key={player.playerId}>
                  <th scope="row">{player.name}</th>
                  {front.map((hole) => (
                    <td key={hole}>{round.holeScores[hole - 1]?.strokesByPlayer[player.playerId] ?? '–'}</td>
                  ))}
                  <td className="scorecard__summary-col">{outSum ?? '–'}</td>
                  {back.map((hole) => (
                    <td key={hole}>{round.holeScores[hole - 1]?.strokesByPlayer[player.playerId] ?? '–'}</td>
                  ))}
                  <td className="scorecard__summary-col">{inSum ?? '–'}</td>
                  <td className="scorecard__summary-col">{total ?? '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
