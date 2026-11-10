import './ScoreLegend.css';

const LEGEND_ITEMS: Array<{ label: string; className: string }> = [
  { label: 'Double-Eagle', className: 'score-legend__swatch score-cell--double-eagle' },
  { label: 'Eagle', className: 'score-legend__swatch score-cell--eagle' },
  { label: 'Birdie', className: 'score-legend__swatch score-cell--birdie' },
  { label: 'Par', className: 'score-legend__swatch score-legend__swatch--par' },
  { label: 'Bogey', className: 'score-legend__swatch score-cell--bogey' },
  { label: 'Double-Bogey', className: 'score-legend__swatch score-cell--double-bogey' },
  { label: '3+ Bogey', className: 'score-legend__swatch score-cell--triple-bogey-or-worse' },
];

// Explains what the scorecard's net-score cell colors mean - mirrors the
// swatch-plus-label legend under flashscore's golf scorecards.
export function ScoreLegend() {
  return (
    <ul className="score-legend">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.label} className="score-legend__item">
          <span className={item.className} aria-hidden="true" />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
