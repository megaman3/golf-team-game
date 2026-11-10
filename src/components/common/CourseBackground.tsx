import type { ReactNode } from 'react';
import './CourseBackground.css';

interface CourseBackgroundProps {
  image: string | null;
  // 'cover' (default) fills the area, cropping as needed - right for a
  // photo. 'contain' shows the whole image letterboxed - right for a logo,
  // which usually shouldn't be cropped.
  fit?: 'cover' | 'contain';
  children: ReactNode;
}

export function CourseBackground({ image, fit = 'cover', children }: CourseBackgroundProps) {
  return (
    <div
      className="course-background"
      style={image ? { backgroundImage: `url(${image})`, backgroundSize: fit } : undefined}
    >
      <div className="course-background__scrim">{children}</div>
    </div>
  );
}
