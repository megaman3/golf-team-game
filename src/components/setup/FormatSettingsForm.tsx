import type { BestBallWorstBallSettings } from '../../engine/formats/bestBallWorstBall';

interface FormatSettingsFormProps {
  settings: BestBallWorstBallSettings;
  onChange: (settings: BestBallWorstBallSettings) => void;
}

export function FormatSettingsForm({ settings, onChange }: FormatSettingsFormProps) {
  return (
    <fieldset className="format-settings">
      <legend>Poäng per delmatch</legend>
      <label className="field">
        <span>Bästboll</span>
        <input
          type="number"
          min={0}
          value={settings.bestBallPoints}
          onChange={(e) => onChange({ ...settings, bestBallPoints: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>Sämstboll</span>
        <input
          type="number"
          min={0}
          value={settings.worstBallPoints}
          onChange={(e) => onChange({ ...settings, worstBallPoints: Number(e.target.value) })}
        />
      </label>
    </fieldset>
  );
}
