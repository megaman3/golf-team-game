import { describe, expect, it } from 'vitest';
import { scoreCategory } from './scoreCategory';

describe('scoreCategory', () => {
  const par = 4;

  it('classifies par and the three under-par categories', () => {
    expect(scoreCategory(par, par)).toBe('par');
    expect(scoreCategory(par - 1, par)).toBe('birdie');
    expect(scoreCategory(par - 2, par)).toBe('eagle');
    expect(scoreCategory(par - 3, par)).toBe('double-eagle');
  });

  it('treats anything 3 or more under par as double-eagle', () => {
    expect(scoreCategory(par - 4, par)).toBe('double-eagle');
    expect(scoreCategory(par - 10, par)).toBe('double-eagle');
  });

  it('classifies the three over-par categories', () => {
    expect(scoreCategory(par + 1, par)).toBe('bogey');
    expect(scoreCategory(par + 2, par)).toBe('double-bogey');
    expect(scoreCategory(par + 3, par)).toBe('triple-bogey-or-worse');
  });

  it('treats anything 3 or more over par as triple-bogey-or-worse', () => {
    expect(scoreCategory(par + 4, par)).toBe('triple-bogey-or-worse');
    expect(scoreCategory(par + 10, par)).toBe('triple-bogey-or-worse');
  });

  it('a handicap stroke that turns a gross par into a net birdie is a birdie', () => {
    const grossStrokes = par;
    const handicapStrokes = 1;
    const net = grossStrokes - handicapStrokes;
    expect(scoreCategory(net, par)).toBe('birdie');
  });

  it('works the same regardless of par value (relative, not absolute)', () => {
    expect(scoreCategory(2, 3)).toBe('birdie');
    expect(scoreCategory(5, 5)).toBe('par');
    expect(scoreCategory(6, 5)).toBe('bogey');
  });
});
