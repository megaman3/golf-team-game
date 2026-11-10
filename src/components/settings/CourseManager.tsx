import { useState } from 'react';
import { useStorage } from '../../StorageContext';
import { seedCourses, validateCourseShape } from '../../data/courses';
import { upsertCourse, deleteCourse } from '../../storage/courseRepository';
import { createId } from '../../domain/id';
import type { Course, Tee } from '../../domain/types';
import './CourseManager.css';

const seedCourseIds = new Set(seedCourses.map((c) => c.id));

function parseNumberList(input: string): number[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(Number);
}

function parseTees(input: string): Tee[] {
  return input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((label) => ({ id: label.toLowerCase().replace(/\s+/g, '-'), label }));
}

export function CourseManager() {
  const { storage, update } = useStorage();
  const [club, setClub] = useState('');
  const [name, setName] = useState('');
  const [holes, setHoles] = useState('18');
  const [par, setPar] = useState('');
  const [index, setIndex] = useState('');
  const [tees, setTees] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!club.trim() || !name.trim()) {
      setError('Ange klubb och bana.');
      return;
    }

    const course: Course = {
      id: createId(),
      club: club.trim(),
      name: name.trim(),
      holes: Number(holes),
      par: parseNumberList(par),
      index: parseNumberList(index),
      tees: parseTees(tees),
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
    setTees('');
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
      <p className="course-manager__hint">
        Slope och course rating kan inte matas in här ännu - lägg till en bana utan dem och komplettera senare i
        koddatan om du behöver den exakta formeln.
      </p>
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
        <label className="field">
          <span>Tees (kommaseparerade namn)</span>
          <input type="text" placeholder="Blå, Röd, Vit, Gul" value={tees} onChange={(e) => setTees(e.target.value)} />
        </label>
        <button type="button" className="course-manager__add" onClick={handleAdd}>
          Lägg till bana
        </button>
      </div>
    </section>
  );
}
