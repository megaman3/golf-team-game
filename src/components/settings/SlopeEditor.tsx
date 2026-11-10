import { useStorage } from '../../StorageContext';
import './SlopeEditor.css';

export function SlopeEditor() {
  const { storage, update } = useStorage();

  function handleChange(courseId: string, teeId: string, field: 'slope' | 'courseRating', value: string) {
    const parsed = value.trim() === '' ? undefined : Number(value);
    if (value.trim() !== '' && Number.isNaN(parsed)) return;

    update((current) => ({
      ...current,
      courses: current.courses.map((course) =>
        course.id === courseId
          ? { ...course, tees: course.tees.map((tee) => (tee.id === teeId ? { ...tee, [field]: parsed } : tee)) }
          : course,
      ),
    }));
  }

  return (
    <section className="slope-editor">
      <h3>Slope &amp; course rating</h3>
      <p className="slope-editor__hint">
        Rätta ett värde om det är fel - ändringen sparas permanent och används direkt i handicapberäkningen.
        Lämna tomt om du inte vill använda den exakta formeln för en tee. Värdena avser <strong>herrarnas</strong>
        slope/course rating (appen har inget könsfält för spelare ännu).
      </p>

      {storage.courses.map((course) => (
        <details key={course.id} className="slope-editor__course">
          <summary>
            {course.club} – {course.name}
          </summary>
          <table className="slope-editor__table">
            <thead>
              <tr>
                <th scope="col">Tee</th>
                <th scope="col">Slope</th>
                <th scope="col">Course rating</th>
              </tr>
            </thead>
            <tbody>
              {course.tees.map((tee) => (
                <tr key={tee.id}>
                  <th scope="row">{tee.label}</th>
                  <td>
                    <input
                      type="number"
                      className="slope-editor__input"
                      value={tee.slope ?? ''}
                      onChange={(e) => handleChange(course.id, tee.id, 'slope', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      className="slope-editor__input"
                      value={tee.courseRating ?? ''}
                      onChange={(e) => handleChange(course.id, tee.id, 'courseRating', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}
    </section>
  );
}
