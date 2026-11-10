import { describe, expect, it } from 'vitest';
import { seedCourses, validateCourseShape } from './courses';

describe('seed courses', () => {
  it('includes both Barsebäck courses, both The National courses, and all six Örestad combinations', () => {
    expect(seedCourses.map((c) => c.id)).toEqual([
      'barseback-ocean',
      'barseback-pine',
      'the-national-links',
      'the-national-lakes',
      'orestad-rod-bla',
      'orestad-rod-gul',
      'orestad-gul-bla',
      'orestad-gul-rod',
      'orestad-bla-rod',
      'orestad-bla-gul',
    ]);
  });

  it.each(seedCourses)('$name has a valid shape (par/index length, index is a 1..holes permutation)', (course) => {
    expect(validateCourseShape(course)).toEqual([]);
  });

  it('par sums match each course\'s stated par', () => {
    const parByCourseId: Record<string, number> = {
      'barseback-ocean': 73,
      'barseback-pine': 71,
      'the-national-links': 72,
      'the-national-lakes': 72,
      'orestad-rod-bla': 72,
      'orestad-rod-gul': 71,
      'orestad-gul-bla': 71,
      'orestad-gul-rod': 71,
      'orestad-bla-rod': 72,
      'orestad-bla-gul': 71,
    };
    for (const course of seedCourses) {
      expect(course.par.reduce((sum, par) => sum + par, 0)).toBe(parByCourseId[course.id]);
    }
  });

  it('Barsebäck courses have the standard blue/red/white/yellow tees', () => {
    for (const course of seedCourses.filter((c) => c.club === 'Barsebäck Golf & Resort')) {
      expect(course.tees.map((t) => t.id).sort()).toEqual(['blue', 'red', 'white', 'yellow']);
    }
  });

  it('The National Links course is labeled by its six course-length tees (meters/100), not colors', () => {
    const links = seedCourses.find((c) => c.id === 'the-national-links')!;
    expect(links.tees.map((t) => t.id).sort()).toEqual(['49', '53', '58', '61', '65', '68']);
  });

  it('The National Lakes course is labeled by its own seven course-length tees', () => {
    const lakes = seedCourses.find((c) => c.id === 'the-national-lakes')!;
    expect(lakes.tees.map((t) => t.id).sort()).toEqual(['48', '51', '54', '59', '62', '65', '68']);
  });

  it('Örestad courses use the club\'s standard vit/gul/bla/rod tees', () => {
    for (const course of seedCourses.filter((c) => c.club === 'Örestads Golfklubb')) {
      expect(course.tees.map((t) => t.id).sort()).toEqual(['bla', 'gul', 'rod', 'vit']);
    }
  });

  it('Örestad\'s slope/course rating per tee is the same regardless of which nine is played first', () => {
    const pairs: Array<[string, string]> = [
      ['orestad-rod-gul', 'orestad-gul-rod'],
      ['orestad-rod-bla', 'orestad-bla-rod'],
      ['orestad-gul-bla', 'orestad-bla-gul'],
    ];
    for (const [idA, idB] of pairs) {
      const courseA = seedCourses.find((c) => c.id === idA)!;
      const courseB = seedCourses.find((c) => c.id === idB)!;
      for (const teeA of courseA.tees) {
        const teeB = courseB.tees.find((t) => t.id === teeA.id)!;
        expect(teeB.slope).toBe(teeA.slope);
        expect(teeB.courseRating).toBe(teeA.courseRating);
      }
      // But the two orderings are not just duplicates - the hole index differs.
      expect(courseA.index).not.toEqual(courseB.index);
    }
  });

  it('every tee has a plausible slope (55-155) and course rating (50-90) when set', () => {
    for (const course of seedCourses) {
      for (const tee of course.tees) {
        if (tee.slope != null) {
          expect(tee.slope).toBeGreaterThanOrEqual(55);
          expect(tee.slope).toBeLessThanOrEqual(155);
        }
        if (tee.courseRating != null) {
          expect(tee.courseRating).toBeGreaterThan(50);
          expect(tee.courseRating).toBeLessThan(90);
        }
      }
    }
  });
});
