import type { Course } from '../../domain/types';
import { getCourseLogo } from '../../data/courseLogos';
import './CourseSelect.css';

interface CourseSelectProps {
  courses: Course[];
  value: string | null;
  onChange: (courseId: string) => void;
}

export function CourseSelect({ courses, value, onChange }: CourseSelectProps) {
  const logo = value ? getCourseLogo(value) : null;

  return (
    <div className="course-select">
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
      {logo && <img className="course-select__logo" src={logo} alt="" />}
    </div>
  );
}
