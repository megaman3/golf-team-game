import { describe, expect, it } from 'vitest';
import { getCourseBackgroundImage } from './courseImages';

describe('getCourseBackgroundImage', () => {
  it('returns null for a course with no photos (e.g. a user-added custom course)', () => {
    expect(getCourseBackgroundImage('some-custom-course', 'round-1')).toBeNull();
  });

  it('is deterministic: the same seed always yields the same image', () => {
    const a = getCourseBackgroundImage('barseback-ocean', 'round-1-hole-5');
    const b = getCourseBackgroundImage('barseback-ocean', 'round-1-hole-5');
    expect(a).toBe(b);
    expect(a).not.toBeNull();
  });

  it('can vary by seed, letting a caller change the image per hole', () => {
    const images = new Set(
      Array.from({ length: 18 }, (_, i) => getCourseBackgroundImage('barseback-ocean', `round-1-hole-${i + 1}`)),
    );
    // Barseback has 16 photos, so across 18 holes we should see more than
    // just one image reused every time (not a strict guarantee, but this
    // seed set is known to produce more than one distinct value).
    expect(images.size).toBeGreaterThan(1);
  });
});
