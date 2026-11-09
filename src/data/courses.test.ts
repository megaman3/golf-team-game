import { describe, expect, it } from 'vitest';
import { seedCourses, validateCourseShape } from './courses';

describe('seed courses', () => {
  it('includes both Barsebäck courses', () => {
    expect(seedCourses.map((c) => c.id)).toEqual(['barseback-ocean', 'barseback-pine']);
  });

  it.each(seedCourses)('$name has a valid shape (par/index length, index is a 1..holes permutation)', (course) => {
    expect(validateCourseShape(course)).toEqual([]);
  });

  it('Ocean Course par sums to 73 and Pine Course par sums to 71', () => {
    const [ocean, pine] = seedCourses;
    expect(ocean.par.reduce((sum, par) => sum + par, 0)).toBe(73);
    expect(pine.par.reduce((sum, par) => sum + par, 0)).toBe(71);
  });

  it('every course has all four tee colors', () => {
    for (const course of seedCourses) {
      expect(course.tees.map((t) => t.id).sort()).toEqual(['blue', 'red', 'white', 'yellow']);
    }
  });
});
