import type { Course } from '../../domain/types';

interface CourseSelectProps {
  courses: Course[];
  value: string | null;
  onChange: (courseId: string) => void;
}

export function CourseSelect({ courses, value, onChange }: CourseSelectProps) {
  return (
    <label className="field">
      <span>Bana</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          Välj bana…
        </option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.club} – {course.name}
          </option>
        ))}
      </select>
    </label>
  );
}
