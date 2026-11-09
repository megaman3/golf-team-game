import './TabBar.css';

export type TabId = 'runda' | 'historik' | 'total' | 'installningar';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'runda', label: 'Runda' },
  { id: 'historik', label: 'Historik' },
  { id: 'total', label: 'Total' },
  { id: 'installningar', label: 'Inställningar' },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Huvudnavigering">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-bar__tab${tab.id === active ? ' tab-bar__tab--active' : ''}`}
          aria-current={tab.id === active ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
