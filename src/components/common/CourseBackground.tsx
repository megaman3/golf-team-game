import type { ReactNode } from 'react';
import { getCourseBackgroundImage } from '../../data/courseImages';
import './CourseBackground.css';

interface CourseBackgroundProps {
  courseId: string;
  // Picks a deterministic image from the course's pool - pass the round id
  // alone for one consistent photo for the whole view (e.g. the
  // scorecard), or round id + hole number to vary it per hole.
  seed: string;
  children: ReactNode;
}

export function CourseBackground({ courseId, seed, children }: CourseBackgroundProps) {
  const image = getCourseBackgroundImage(courseId, seed);

  return (
    <div className="course-background" style={image ? { backgroundImage: `url(${image})` } : undefined}>
      <div className="course-background__scrim">{children}</div>
    </div>
  );
}
