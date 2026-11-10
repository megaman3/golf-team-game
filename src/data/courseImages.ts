const barsebackImages = Object.values(
  import.meta.glob('/src/pictures/Barseback/*.jpeg', { eager: true, import: 'default' }),
) as string[];

const theNationalImages = Object.values(
  import.meta.glob('/src/pictures/TheNational/*.jpeg', { eager: true, import: 'default' }),
) as string[];

const orestadImages = Object.values(
  import.meta.glob('/src/pictures/Örestad/*.jpeg', { eager: true, import: 'default' }),
) as string[];

const falsterboImages = Object.values(
  import.meta.glob('/src/pictures/Falsterbo/*.jpeg', { eager: true, import: 'default' }),
) as string[];

const COURSE_IMAGES: Record<string, string[]> = {
  'barseback-ocean': barsebackImages,
  'barseback-pine': barsebackImages,
  'the-national-links': theNationalImages,
  'the-national-lakes': theNationalImages,
  'orestad-rod-bla': orestadImages,
  'orestad-rod-gul': orestadImages,
  'orestad-gul-bla': orestadImages,
  'orestad-gul-rod': orestadImages,
  'orestad-bla-rod': orestadImages,
  'orestad-bla-gul': orestadImages,
  falsterbo: falsterboImages,
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Deterministically picks one image per course for a given seed - the same
// seed always yields the same image, so the caller controls whether it
// changes (e.g. seed by round id + hole number) or stays put (seed by round
// id alone). Returns null when the course has no photos.
export function getCourseBackgroundImage(courseId: string, seed: string): string | null {
  const images = COURSE_IMAGES[courseId];
  if (!images || images.length === 0) return null;
  return images[hashString(seed) % images.length];
}
