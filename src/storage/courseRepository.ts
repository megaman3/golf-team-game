import type { Course } from '../domain/types';
import type { AppStorage } from './schema';

export function upsertCourse(storage: AppStorage, course: Course): AppStorage {
  const exists = storage.courses.some((c) => c.id === course.id);
  const courses = exists
    ? storage.courses.map((c) => (c.id === course.id ? course : c))
    : [...storage.courses, course];
  return { ...storage, courses };
}

export function deleteCourse(storage: AppStorage, courseId: string): AppStorage {
  return { ...storage, courses: storage.courses.filter((c) => c.id !== courseId) };
}
