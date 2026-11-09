import type { Tee } from '../../domain/types';

interface TeeSelectProps {
  tees: Tee[];
  value: string | null;
  onChange: (teeId: string) => void;
}

export function TeeSelect({ tees, value, onChange }: TeeSelectProps) {
  return (
    <label className="field">
      <span>Tee</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={tees.length === 0}>
        <option value="" disabled>
          Välj tee…
        </option>
        {tees.map((tee) => (
          <option key={tee.id} value={tee.id}>
            {tee.label}
            {tee.lengthMeters ? ` (${tee.lengthMeters} m)` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
