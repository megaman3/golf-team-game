import { useRef, useState, type ChangeEvent } from 'react';
import { useStorage } from '../../StorageContext';
import { exportAllAsJson, parseImportedJson } from '../../storage/exportImport';
import './ExportImportPanel.css';

export function ExportImportPanel() {
  const { storage, update } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    const json = exportAllAsJson(storage);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `golf-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const text = await file.text();
    const result = parseImportedJson(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const confirmed = window.confirm('Detta skriver över all nuvarande data i appen (banor, spelare, historik). Fortsätt?');
    if (!confirmed) return;

    update(() => result.storage);
    setError(null);
  }

  return (
    <section className="export-import">
      <h3>Export och import</h3>
      <p className="export-import__hint">
        Exportera all data (banor, spelare, historik, inställningar) som en JSON-fil - bra som backup eftersom
        webbläsarens lagring kan rensas. Importera samma fil för att återställa den.
      </p>
      {error && <p className="export-import__error">{error}</p>}
      <div className="export-import__actions">
        <button type="button" onClick={handleExport}>
          Exportera data
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Importera data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="export-import__file-input"
          onChange={handleFileChange}
        />
      </div>
    </section>
  );
}
