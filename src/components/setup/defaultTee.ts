import type { Tee } from '../../domain/types';

const DEFAULT_LENGTH_TEE_TARGET = 57;

// Picks a sensible starting tee: "gult" for the classic color tees, or
// whichever course-length tee (e.g. The National's 68/65/.../48) is
// closest to a typical middle-of-the-road length, for clubs that label
// tees by length instead of color.
export function pickDefaultTeeId(tees: Tee[]): string {
  if (tees.length === 0) return '';

  const yellow = tees.find((t) => t.id === 'yellow');
  if (yellow) return yellow.id;

  const numericTees = tees.filter((t) => !Number.isNaN(Number(t.id)));
  if (numericTees.length === tees.length) {
    return numericTees.reduce((closest, tee) =>
      Math.abs(Number(tee.id) - DEFAULT_LENGTH_TEE_TARGET) < Math.abs(Number(closest.id) - DEFAULT_LENGTH_TEE_TARGET)
        ? tee
        : closest,
    ).id;
  }

  return tees[0].id;
}
