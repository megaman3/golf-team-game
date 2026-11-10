import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { RoundPlayer } from '../../domain/types';
import type { HolePointsResult } from '../../engine/formats/types';
import { buildCumulativeSeries, buildPerHoleSeries, type ChartSeries } from './chartData';
import './RoundCharts.css';

const SERIES_COLORS = ['var(--chart-series-1)', 'var(--chart-series-2)', 'var(--chart-series-3)'];
const HOLE_WIDTH = 28;

interface RoundChartsProps {
  holeResults: HolePointsResult[];
  players: RoundPlayer[];
  usesTeams: boolean;
}

export function RoundCharts({ holeResults, players, usesTeams }: RoundChartsProps) {
  const cumulative = buildCumulativeSeries(holeResults, players, usesTeams);
  const perHole = buildPerHoleSeries(holeResults, players, usesTeams);
  const playedHoles = cumulative[0]?.values.length ?? 0;
  const [selected, setSelected] = useState<number | null>(null);
  const selectedHole = selected != null ? Math.min(selected, playedHoles - 1) : null;

  if (playedHoles === 0) {
    return <p className="round-charts__empty">Inga ifyllda hål att visa diagram för än.</p>;
  }

  return (
    <div className="round-charts">
      <div className="round-charts__legend">
        {cumulative.map((s, i) => (
          <span key={s.id} className="round-charts__legend-item">
            <span className="round-charts__legend-dot" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            {s.label}
          </span>
        ))}
      </div>

      <h4 className="round-charts__title">Ställning per hål</h4>
      <TrendChart series={cumulative} playedHoles={playedHoles} selectedHole={selectedHole} onSelect={setSelected} />

      <h4 className="round-charts__title">Poäng per hål</h4>
      <PerHoleChart series={perHole} playedHoles={playedHoles} selectedHole={selectedHole} onSelect={setSelected} />

      {selectedHole != null && (
        <p className="round-charts__readout">
          <strong>Hål {selectedHole + 1}:</strong>{' '}
          {cumulative.map((s) => `${s.label} ${s.values[selectedHole]}`).join(' · ')}
          {' — poäng på hålet: '}
          {perHole.map((s) => `${s.label} ${s.values[selectedHole] ?? 0}`).join(' · ')}
        </p>
      )}
    </div>
  );
}

function holeFromPointerEvent(e: ReactPointerEvent<SVGSVGElement>, playedHoles: number): number {
  const rect = e.currentTarget.getBoundingClientRect();
  const scale = HOLE_WIDTH * playedHoles / rect.width;
  const x = (e.clientX - rect.left) * scale;
  return Math.max(0, Math.min(playedHoles - 1, Math.floor(x / HOLE_WIDTH)));
}

interface ChartProps {
  series: ChartSeries[];
  playedHoles: number;
  selectedHole: number | null;
  onSelect: (hole: number) => void;
}

function TrendChart({ series, playedHoles, selectedHole, onSelect }: ChartProps) {
  const width = HOLE_WIDTH * playedHoles;
  const height = 140;
  const padding = { top: 10, bottom: 20 };
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...series.flatMap((s) => s.values));
  const yFor = (v: number) => padding.top + plotHeight - (v / maxValue) * plotHeight;
  const xFor = (i: number) => i * HOLE_WIDTH + HOLE_WIDTH / 2;

  function handlePointer(e: ReactPointerEvent<SVGSVGElement>) {
    onSelect(holeFromPointerEvent(e, playedHoles));
  }

  return (
    <div className="round-charts__scroll">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="round-charts__svg"
        onPointerDown={handlePointer}
        onPointerMove={(e) => e.buttons === 1 && handlePointer(e)}
        role="img"
        aria-label="Ställning per hål"
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={padding.top + plotHeight * (1 - f)}
            y2={padding.top + plotHeight * (1 - f)}
            className="round-charts__grid"
          />
        ))}

        {series.map((s, si) => (
          <g key={s.id}>
            <polyline
              points={s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')}
              fill="none"
              stroke={SERIES_COLORS[si % SERIES_COLORS.length]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={xFor(i)}
                cy={yFor(v)}
                r={i === selectedHole ? 5 : 4}
                fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            ))}
          </g>
        ))}

        {selectedHole != null && (
          <line
            x1={xFor(selectedHole)}
            x2={xFor(selectedHole)}
            y1={padding.top}
            y2={padding.top + plotHeight}
            className="round-charts__crosshair"
          />
        )}

        {Array.from({ length: playedHoles }, (_, i) => (
          <text key={i} x={xFor(i)} y={height - 4} textAnchor="middle" className="round-charts__axis-label">
            {i + 1}
          </text>
        ))}
      </svg>
    </div>
  );
}

function PerHoleChart({ series, playedHoles, selectedHole, onSelect }: ChartProps) {
  const width = HOLE_WIDTH * playedHoles;
  const height = 100;
  const padding = { top: 6, bottom: 20 };
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...series.flatMap((s) => s.values));
  const barWidth = Math.max(4, Math.min(24, (HOLE_WIDTH - 4) / series.length - 2));

  return (
    <div className="round-charts__scroll">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="round-charts__svg" role="img" aria-label="Poäng per hål">
        {Array.from({ length: playedHoles }, (_, holeIndex) => {
          const groupX = holeIndex * HOLE_WIDTH;
          return (
            <g key={holeIndex} onPointerDown={() => onSelect(holeIndex)}>
              <rect x={groupX} y={0} width={HOLE_WIDTH} height={height} fill="transparent" />
              {series.map((s, si) => {
                const value = s.values[holeIndex] ?? 0;
                const barHeight = Math.max((value / maxValue) * plotHeight, value > 0 ? 2 : 0);
                const x = groupX + 2 + si * (barWidth + 2);
                const y = padding.top + plotHeight - barHeight;
                return (
                  <rect
                    key={s.id}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={3}
                    fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                    opacity={selectedHole === holeIndex ? 1 : 0.85}
                  />
                );
              })}
              <text x={groupX + HOLE_WIDTH / 2} y={height - 4} textAnchor="middle" className="round-charts__axis-label">
                {holeIndex + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
