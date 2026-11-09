import { useState } from 'react';
import './App.css';
import { TabBar, type TabId } from './components/layout/TabBar';
import { RoundSetup } from './components/setup/RoundSetup';
import { useStorage } from './StorageContext';

function TabPlaceholder({ title }: { title: string }) {
  return (
    <div className="tab-placeholder">
      <h2>{title}</h2>
      <p>Kommer snart.</p>
    </div>
  );
}

function RundaTab() {
  const { storage } = useStorage();
  if (storage.inProgressRound) {
    // Hålinmatningsskärmen byggs i nästa steg - tills den finns visas bara
    // att en runda pågår, så datan inte tappas bort.
    return <TabPlaceholder title="Runda pågår" />;
  }
  return <RoundSetup />;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('runda');

  return (
    <div className="app-shell">
      <main className="app-shell__content">
        {activeTab === 'runda' && <RundaTab />}
        {activeTab === 'historik' && <TabPlaceholder title="Historik" />}
        {activeTab === 'total' && <TabPlaceholder title="Total" />}
        {activeTab === 'installningar' && <TabPlaceholder title="Inställningar" />}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;
