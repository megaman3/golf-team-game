import { describe, expect, it } from 'vitest';
import { pickDefaultTeeId } from './defaultTee';

describe('pickDefaultTeeId', () => {
  it('picks yellow when color tees are available', () => {
    const tees = [
      { id: 'blue', label: 'Blå' },
      { id: 'red', label: 'Röd' },
      { id: 'white', label: 'Vit' },
      { id: 'yellow', label: 'Gul' },
    ];
    expect(pickDefaultTeeId(tees)).toBe('yellow');
  });

  it('picks the length-based tee closest to 57 (e.g. Links 58, Lakes 59)', () => {
    const links = [
      { id: '68', label: '68' },
      { id: '65', label: '65' },
      { id: '61', label: '61' },
      { id: '58', label: '58' },
      { id: '53', label: '53' },
      { id: '49', label: '49' },
    ];
    expect(pickDefaultTeeId(links)).toBe('58');

    const lakes = [
      { id: '68', label: '68' },
      { id: '65', label: '65' },
      { id: '62', label: '62' },
      { id: '59', label: '59' },
      { id: '54', label: '54' },
      { id: '51', label: '51' },
      { id: '48', label: '48' },
    ];
    expect(pickDefaultTeeId(lakes)).toBe('59');
  });

  it('falls back to the first tee when there is no yellow and ids are not all numeric', () => {
    const tees = [
      { id: 'green', label: 'Grön' },
      { id: 'orange', label: 'Orange' },
    ];
    expect(pickDefaultTeeId(tees)).toBe('green');
  });

  it('returns an empty string when there are no tees', () => {
    expect(pickDefaultTeeId([])).toBe('');
  });
});
