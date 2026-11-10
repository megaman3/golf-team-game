import { formatRegistry } from '../../engine/formats/registry';

interface FormatSelectProps {
  value: string;
  onChange: (formatId: string) => void;
}

export function FormatSelect({ value, onChange }: FormatSelectProps) {
  return (
    <label className="field">
      <span>Spelform</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.values(formatRegistry).map((format) => (
          <option key={format.id} value={format.id}>
            {format.label}
          </option>
        ))}
      </select>
    </label>
  );
}
