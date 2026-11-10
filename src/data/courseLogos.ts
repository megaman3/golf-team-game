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

const orestadLogo = firstMatch(
  import.meta.glob('/src/pictures/Örestad/logo_*.{png,jpg,jpeg}', { eager: true, import: 'default' }),
);

const COURSE_LOGOS: Record<string, string | undefined> = {
  'barseback-ocean': barsebackLogo,
  'barseback-pine': barsebackLogo,
  'the-national-links': theNationalLogo,
  'the-national-lakes': theNationalLogo,
  'orestad-rod-bla': orestadLogo,
  'orestad-rod-gul': orestadLogo,
  'orestad-gul-bla': orestadLogo,
  'orestad-gul-rod': orestadLogo,
  'orestad-bla-rod': orestadLogo,
  'orestad-bla-gul': orestadLogo,
};

export function getCourseLogo(courseId: string): string | null {
  return COURSE_LOGOS[courseId] ?? null;
}
