import { useState } from 'react';
import { useStorage } from '../../StorageContext';
import { seedCourses, validateCourseShape } from '../../data/courses';
import { upsertCourse, deleteCourse } from '../../storage/courseRepository';
import { createId } from '../../domain/id';
import type { Course, Tee } from '../../domain/types';
import './CourseManager.css';

const seedCourseIds = new Set(seedCourses.map((c) => c.id));

interface DraftTee {
  label: string;
  slope: string;
  courseRating: string;
}

function emptyDraftTee(): DraftTee {
  return { label: '', slope: '', courseRating: '' };
}

function parseNumberList(input: string): number[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(Number);
}

export function CourseManager() {
  const { storage, update } = useStorage();
  const [club, setClub] = useState('');
  const [name, setName] = useState('');
  const [holes, setHoles] = useState('18');
  const [par, setPar] = useState('');
  const [index, setIndex] = useState('');
  const [teeRows, setTeeRows] = useState<DraftTee[]>([emptyDraftTee()]);
  const [error, setError] = useState<string | null>(null);

  function updateTeeRow(rowIndex: number, patch: Partial<DraftTee>) {
    setTeeRows((current) => current.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row)));
  }

  function addTeeRow() {
    setTeeRows((current) => [...current, emptyDraftTee()]);
  }

  function removeTeeRow(rowIndex: number) {
    setTeeRows((current) => current.filter((_, i) => i !== rowIndex));
  }

  function buildTees(): Tee[] | null {
    const tees: Tee[] = [];
    for (const row of teeRows) {
      if (row.label.trim() === '') continue;

      const tee: Tee = { id: row.label.trim().toLowerCase().replace(/\s+/g, '-'), label: row.label.trim() };

      if (row.slope.trim() !== '') {
        const slope = Number(row.slope);
        if (Number.isNaN(slope)) return null;
        tee.slope = slope;
      }
      if (row.courseRating.trim() !== '') {
        const courseRating = Number(row.courseRating);
        if (Number.isNaN(courseRating)) return null;
        tee.courseRating = courseRating;
      }

      tees.push(tee);
    }
    return tees;
  }

  function handleAdd() {
    if (!club.trim() || !name.trim()) {
      setError('Ange klubb och bana.');
      return;
    }

    const tees = buildTees();
    if (tees == null) {
      setError('Slope och course rating måste vara tal (eller lämnas tomma).');
      return;
    }

    const course: Course = {
      id: createId(),
      club: club.trim(),
      name: name.trim(),
      holes: Number(holes),
      par: parseNumberList(par),
      index: parseNumberList(index),
      tees,
    };

    const problems = validateCourseShape(course);
    if (problems.length > 0) {
      setError(problems.join(' '));
      return;
    }

    update((current) => upsertCourse(current, course));
    setClub('');
    setName('');
    setHoles('18');
    setPar('');
    setIndex('');
    setTeeRows([emptyDraftTee()]);
    setError(null);
  }

  function handleDelete(courseId: string) {
    const confirmed = window.confirm('Radera den här banan? Det går inte att ångra.');
    if (!confirmed) return;
    update((current) => deleteCourse(current, courseId));
  }

  return (
    <section className="course-manager">
      <h3>Banor</h3>

      <ul className="course-manager__list">
        {storage.courses.map((course) => (
          <li key={course.id} className="course-manager__item">
            <div>
              <strong>
                {course.club} – {course.name}
              </strong>
              <div className="course-manager__meta">
                {course.holes} hål, par {course.par.reduce((a, b) => a + b, 0)} · tees:{' '}
                {course.tees.map((t) => t.label).join(', ') || 'inga'}
              </div>
            </div>
            {!seedCourseIds.has(course.id) && (
              <button type="button" onClick={() => handleDelete(course.id)}>
                Radera
              </button>
            )}
          </li>
        ))}
      </ul>

      <h4>Lägg till bana</h4>
      {error && <p className="course-manager__error">{error}</p>}
      <div className="course-manager__form">
        <label className="field">
          <span>Klubb</span>
          <input type="text" value={club} onChange={(e) => setClub(e.target.value)} />
        </label>
        <label className="field">
          <span>Bana</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Antal hål</span>
          <input type="number" value={holes} onChange={(e) => setHoles(e.target.value)} />
        </label>
        <label className="field">
          <span>Par per hål (kommaseparerat)</span>
          <input type="text" placeholder="4,4,3,5,…" value={par} onChange={(e) => setPar(e.target.value)} />
        </label>
        <label className="field">
          <span>Index per hål (kommaseparerat)</span>
          <input type="text" placeholder="7,13,1,…" value={index} onChange={(e) => setIndex(e.target.value)} />
        </label>

        <fieldset className="course-manager__tees">
          <legend>Tees</legend>
          <p className="course-manager__hint">
            Slope och course rating är valfria - lämna tomt om du inte har de exakta värdena än. Avser herrarnas
            värden (appen har inget könsfält för spelare ännu).
          </p>
          {teeRows.map((row, rowIndex) => (
            <div className="course-manager__tee-row" key={rowIndex}>
              <input
                type="text"
                placeholder="Namn, t.ex. Blå"
                value={row.label}
                onChange={(e) => updateTeeRow(rowIndex, { label: e.target.value })}
              />
              <input
                type="number"
                placeholder="Slope"
                value={row.slope}
                onChange={(e) => updateTeeRow(rowIndex, { slope: e.target.value })}
              />
              <input
                type="number"
                step="0.1"
                placeholder="Course rating"
                value={row.courseRating}
                onChange={(e) => updateTeeRow(rowIndex, { courseRating: e.target.value })}
              />
              <button
                type="button"
                className="course-manager__remove-tee"
                onClick={() => removeTeeRow(rowIndex)}
                aria-label="Ta bort tee"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="course-manager__add-tee" onClick={addTeeRow}>
            + Lägg till tee
          </button>
        </fieldset>

        <button type="button" className="course-manager__add" onClick={handleAdd}>
          Lägg till bana
        </button>
      </div>
    </section>
  );
}
