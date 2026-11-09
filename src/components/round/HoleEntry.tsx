import { useMemo } from 'react';
import { useStorage } from '../../StorageContext';
import type { RoundPlayer, TeamId } from '../../domain/types';
import { decrementStroke, incrementStroke, setCurrentHole, setPlayerStroke } from '../../domain/roundEditing';
import { computeHandicapStrokes } from '../../engine/handicap';
import { computeRoundResult } from '../../engine/roundResult';
import type { HolePointsResult, RoundTotals } from '../../engine/formats/types';
import { getGameFormat } from '../../engine/formats/registry';
import { completeRound } from '../../storage/roundRepository';
import { describeRoundResult, describeWinner, teamLabel } from './roundSummary';
import './HoleEntry.css';

interface BestBallWorstBallDetail {
  bestBallWinner: TeamId | 'tie';
  worstBallWinner: TeamId | 'tie';
}

interface HoleEntryProps {
  onShowScorecard: () => void;
  onFinished: () => void;
}

export function HoleEntry({ onShowScorecard, onFinished }: HoleEntryProps) {
  const { storage, update } = useStorage();
  const round = storage.inProgressRound;
  const course = round ? storage.courses.find((c) => c.id === round.courseId) : undefined;
  const tee = course && round ? course.tees.find((t) => t.id === round.teeId) : undefined;

  const result = useMemo(() => {
    if (!round || !course || !tee) return null;
    return computeRoundResult(round, course, tee);
  }, [round, course, tee]);

  if (!round || !course || !tee || !result) {
    return <p>Kunde inte hitta bana/tee för den pågående rundan.</p>;
  }

  const format = getGameFormat(round.formatId);
  const currentHole = round.currentHole ?? 1;
  const holeArrayIndex = currentHole - 1;
  const par = course.par[holeArrayIndex];
  const holeIndex = course.index[holeArrayIndex];
  const coursePar = course.par.reduce((sum, p) => sum + p, 0);
  const currentHoleResult = result.holeResults[holeArrayIndex];
  const allComplete = result.holeResults.every((h) => h.complete);

  function goToHole(hole: number) {
    update((current) => {
      if (!current.inProgressRound) return current;
      return { ...current, inProgressRound: setCurrentHole(current.inProgressRound, hole) };
    });
  }

  function adjustStroke(playerId: string, strokes: number | null, delta: 1 | -1) {
    update((current) => {
      if (!current.inProgressRound) return current;
      const nextValue = delta === 1 ? incrementStroke(strokes) : decrementStroke(strokes);
      return { ...current, inProgressRound: setPlayerStroke(current.inProgressRound, currentHole, playerId, nextValue) };
    });
  }

  const handleFinish = () => {
    const resultText = describeRoundResult(result.totals, round.players);
    const confirmed = window.confirm(`${resultText}\n\nSpara rundan till historiken?`);
    if (!confirmed) return;

    update((current) => {
      if (!current.inProgressRound) return current;
      return completeRound(current, current.inProgressRound);
    });
    onFinished();
  };

  return (
    <div className="hole-entry">
      <div className="hole-entry__top">
        <p className="hole-entry__course">
          {course.club} – {course.name} ({tee.label}) · {format.label}
        </p>
        <button type="button" className="hole-entry__scorecard-link" onClick={onShowScorecard}>
          Scorekort
        </button>
      </div>
      <div className="hole-entry__nav">
        <button type="button" disabled={currentHole <= 1} onClick={() => goToHole(currentHole - 1)}>
          ←
        </button>
        <div className="hole-entry__hole-info">
          <strong>Hål {currentHole}</strong> av {course.holes} · Par {par} · Index {holeIndex}
        </div>
        <button type="button" disabled={currentHole >= course.holes} onClick={() => goToHole(currentHole + 1)}>
          →
        </button>
      </div>

      <ul className="hole-entry__players">
        {round.players.map((player) => {
          const strokes = round.holeScores[holeArrayIndex]?.strokesByPlayer[player.playerId] ?? null;
          const handicapStrokes = computeHandicapStrokes({
            exactHandicap: round.scratch ? null : player.exactHandicapUsed,
            tee,
            coursePar,
            holeIndex,
            holesCount: course.holes,
          });
          const net = strokes != null ? strokes - handicapStrokes : null;

          return (
            <li key={player.playerId} className="hole-entry__player">
              <div className="hole-entry__player-name">
                <span>{player.name}</span>
                {player.teamId && <span className="hole-entry__badge">Lag {player.teamId}</span>}
                {handicapStrokes !== 0 && (
                  <span className="hole-entry__badge hole-entry__badge--hcp">
                    {handicapStrokes > 0 ? `+${handicapStrokes}` : handicapStrokes}
                  </span>
                )}
              </div>
              <div className="hole-entry__stroke-control">
                <button
                  type="button"
                  className="hole-entry__stroke-button"
                  aria-label={`Färre slag för ${player.name}`}
                  onClick={() => adjustStroke(player.playerId, strokes, -1)}
                >
                  −
                </button>
                <span className="hole-entry__stroke-count">{strokes ?? '–'}</span>
                <button
                  type="button"
                  className="hole-entry__stroke-button"
                  aria-label={`Fler slag för ${player.name}`}
                  onClick={() => adjustStroke(player.playerId, strokes, 1)}
                >
                  +
                </button>
              </div>
              <div className="hole-entry__net">{net != null ? `Netto ${net}` : ''}</div>
            </li>
          );
        })}
      </ul>

      <HoleResultSummary result={currentHoleResult} players={round.players} />
      <RoundStandings totals={result.totals} players={round.players} />

      {allComplete && (
        <div className="hole-entry__finish-area">
          <p className="hole-entry__final-result">{describeRoundResult(result.totals, round.players)}</p>
          <button type="button" className="hole-entry__finish" onClick={handleFinish}>
            Spara och avsluta
          </button>
        </div>
      )}
    </div>
  );
}

function HoleResultSummary({ result, players }: { result: HolePointsResult; players: RoundPlayer[] }) {
  if (!result.complete) {
    return <p className="hole-entry__summary">Väntar på alla slag på hålet…</p>;
  }

  const detail = result.detail as BestBallWorstBallDetail | undefined;
  const points = result.pointsByTeam;

  return (
    <div className="hole-entry__summary">
      {detail && (
        <p>
          Bästboll: {describeWinner(players, detail.bestBallWinner)} · Sämstboll:{' '}
          {describeWinner(players, detail.worstBallWinner)}
        </p>
      )}
      {points && (
        <p>
          Poäng hålet: {teamLabel(players, 'A')} {points.A} – {points.B} {teamLabel(players, 'B')}
        </p>
      )}
    </div>
  );
}

function RoundStandings({ totals, players }: { totals: RoundTotals; players: RoundPlayer[] }) {
  if (!totals.pointsByTeam) return null;

  return (
    <div className="hole-entry__standings">
      <h3>Ställning</h3>
      <p>
        {teamLabel(players, 'A')} {totals.pointsByTeam.A} – {totals.pointsByTeam.B} {teamLabel(players, 'B')}
      </p>
    </div>
  );
}
