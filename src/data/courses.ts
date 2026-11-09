import type { Course } from '../domain/types';
import rawCourses from './courses.json';

export const seedCourses: Course[] = rawCourses as Course[];

export function validateCourseShape(course: Course): string[] {
  const problems: string[] = [];

  if (course.par.length !== course.holes) {
    problems.push(`par has ${course.par.length} entries, expected ${course.holes}`);
  }
  if (course.index.length !== course.holes) {
    problems.push(`index has ${course.index.length} entries, expected ${course.holes}`);
  }
  if (course.par.some((par) => !Number.isInteger(par) || par <= 0)) {
    problems.push('par must contain only positive integers');
  }

  const sortedIndex = [...course.index].sort((a, b) => a - b);
  const expectedIndex = Array.from({ length: course.holes }, (_, i) => i + 1);
  if (JSON.stringify(sortedIndex) !== JSON.stringify(expectedIndex)) {
    problems.push(`index must be a permutation of 1..${course.holes}`);
  }

  if (course.tees.length === 0) {
    problems.push('course must have at least one tee');
  }

  return problems;
}
