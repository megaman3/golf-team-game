import { useState } from 'react';
import './App.css';
import { TabBar, type TabId } from './components/layout/TabBar';
import { RoundSetup } from './components/setup/RoundSetup';
import { HoleEntry } from './components/round/HoleEntry';
import { Scorecard } from './components/round/Scorecard';
import { RoundSaved } from './components/round/RoundSaved';
import { HistoryList } from './components/history/HistoryList';
import { HistoryDetail } from './components/history/HistoryDetail';
import { TotalsView } from './components/totals/TotalsView';
import { SettingsView } from './components/settings/SettingsView';
import { useStorage } from './StorageContext';

type RundaView = 'entry' | 'scorecard' | 'saved';

function RundaTab() {
  const { storage } = useStorage();
  const [view, setView] = useState<RundaView>('entry');

  if (storage.inProgressRound) {
    if (view === 'scorecard') {
      return <Scorecard onSelectHole={() => setView('entry')} />;
    }
    return (
      <HoleEntry
        onShowScorecard={() => setView('scorecard')}
        onFinished={() => setView('saved')}
        onAborted={() => setView('entry')}
      />
    );
  }

  if (view === 'saved') {
    return <RoundSaved onStartNewRound={() => setView('entry')} />;
  }

  return <RoundSetup />;
}

function HistorikTab() {
  const [openRoundId, setOpenRoundId] = useState<string | null>(null);

  if (openRoundId) {
    return <HistoryDetail roundId={openRoundId} onBack={() => setOpenRoundId(null)} />;
  }

  return <HistoryList onOpenRound={setOpenRoundId} />;
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('runda');

  return (
    <div className="app-shell">
      <main className="app-shell__content">
        {activeTab === 'runda' && <RundaTab />}
        {activeTab === 'historik' && <HistorikTab />}
        {activeTab === 'total' && <TotalsView />}
        {activeTab === 'installningar' && <SettingsView />}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

export default App;
