function firstMatch(pattern: Record<string, unknown>): string | undefined {
  const values = Object.values(pattern) as string[];
  return values[0];
}

const barsebackLogo = firstMatch(
  import.meta.glob('/src/pictures/Barseback/logo_*.{png,jpg,jpeg}', { eager: true, import: 'default' }),
);

const theNationalLogo = firstMatch(
  import.meta.glob('/src/pictures/TheNational/logo_*.{png,jpg,jpeg}', { eager: true, import: 'default' }),
);

// Add a mapping here once a course exists for a club whose logo has been
// uploaded (e.g. Örestad has a logo but no course data yet).
const COURSE_LOGOS: Record<string, string | undefined> = {
  'barseback-ocean': barsebackLogo,
  'barseback-pine': barsebackLogo,
  'the-national-links': theNationalLogo,
  'the-national-lakes': theNationalLogo,
};

export function getCourseLogo(courseId: string): string | null {
  return COURSE_LOGOS[courseId] ?? null;
}
