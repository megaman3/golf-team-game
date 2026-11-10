import { ExportImportPanel } from './ExportImportPanel';
import { CourseManager } from './CourseManager';
import './SettingsView.css';

export function SettingsView() {
  return (
    <div className="settings-view">
      <h2>Inställningar</h2>
      <ExportImportPanel />
      <hr className="settings-view__divider" />
      <CourseManager />
    </div>
  );
}
