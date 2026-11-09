import { useMemo, useState } from 'react';
import { useStorage } from '../../StorageContext';
import { formatRegistry } from '../../engine/formats/registry';
import { computeTotals } from '../../engine/totals';
import './TotalsView.css';

type View = 'player' | 'pair';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function thisYearStartIso(): string {
  return `${new Date().getFullYear()}-01-01`;
}

export function TotalsView() {
  const { storage } = useStorage();
  const [view, setView] = useState<View>('player');
  const [formatId, setFormatId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const totals = useMemo(
    () =>
      computeTotals(storage.roundsHistory, storage.courses, {
        formatId: formatId || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [storage.roundsHistory, storage.courses, formatId, from, to],
  );

  const rows = view === 'player' ? totals.byPlayer : totals.byPair;

  return (
    <div className="totals-view">
      <h2>Total</h2>

      <div className="totals-view__filters">
        <label className="field">
          <span>Spelform</span>
          <select value={formatId} onChange={(e) => setFormatId(e.target.value)}>
            <option value="">Alla format</option>
            {Object.values(formatRegistry).map((format) => (
              <option key={format.id} value={format.id}>
                {format.label}
              </option>
            ))}
          </select>
        </label>

        <div className="totals-view__date-range">
          <label className="field">
            <span>Från</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field">
            <span>Till</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>

        <div className="totals-view__shortcuts">
          <button
            type="button"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            Alla rundor
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom(thisYearStartIso());
              setTo(todayIso());
            }}
          >
            I år
          </button>
          <button
            type="button"
            onClick={() => {
              setFrom(daysAgoIso(30));
              setTo(todayIso());
            }}
          >
            Senaste 30 dagarna
          </button>
        </div>
      </div>

      <div className="totals-view__toggle">
        <button
          type="button"
          className={view === 'player' ? 'totals-view__toggle-btn totals-view__toggle-btn--active' : 'totals-view__toggle-btn'}
          onClick={() => setView('player')}
        >
          Per spelare
        </button>
        <button
          type="button"
          className={view === 'pair' ? 'totals-view__toggle-btn totals-view__toggle-btn--active' : 'totals-view__toggle-btn'}
          onClick={() => setView('pair')}
        >
          Per lagpar
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="totals-view__empty">Inga rundor matchar filtret.</p>
      ) : (
        <table className="totals-view__table">
          <thead>
            <tr>
              <th scope="col">{view === 'player' ? 'Spelare' : 'Lagpar'}</th>
              <th scope="col">Poäng</th>
              <th scope="col">Vinster</th>
              <th scope="col">Rundor</th>
            </tr>
          </thead>
          <tbody>
            {view === 'player'
              ? totals.byPlayer.map((row) => (
                  <tr key={row.playerId}>
                    <td>{row.name}</td>
                    <td>{row.points}</td>
                    <td>{row.wins}</td>
                    <td>{row.roundsPlayed}</td>
                  </tr>
                ))
              : totals.byPair.map((row) => (
                  <tr key={row.playerIds.join('+')}>
                    <td>{row.names.join(' & ')}</td>
                    <td>{row.points}</td>
                    <td>{row.wins}</td>
                    <td>{row.roundsPlayed}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
