import { describe, expect, it } from 'vitest';
import { seedCourses, validateCourseShape } from './courses';

describe('seed courses', () => {
  it('includes both Barsebäck courses and both The National courses', () => {
    expect(seedCourses.map((c) => c.id)).toEqual([
      'barseback-ocean',
      'barseback-pine',
      'the-national-links',
      'the-national-lakes',
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

  it('The National courses have their own club-specific tee sets', () => {
    const links = seedCourses.find((c) => c.id === 'the-national-links')!;
    const lakes = seedCourses.find((c) => c.id === 'the-national-lakes')!;
    expect(links.tees.map((t) => t.id).sort()).toEqual(['blue', 'green', 'white', 'yellow']);
    expect(lakes.tees.map((t) => t.id).sort()).toEqual(['blue', 'orange', 'red', 'white', 'yellow']);
  });
});
