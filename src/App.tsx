import { StoreProvider, useStore } from './store/StoreContext';
import { HomePage } from './pages/HomePage';
import { TrainingPage } from './pages/TrainingPage';
import { ReviewPage } from './pages/ReviewPage';
import { TasksPage } from './pages/TasksPage';
import { HistoryPage } from './pages/HistoryPage';
import { WeaknessPage } from './pages/WeaknessPage';
import { SettingsPage } from './pages/SettingsPage';
import type { AppView } from './types';

interface NavItem {
  view: AppView;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { view: 'home', icon: '🏠', label: '首页' },
  { view: 'training', icon: '💬', label: '训练' },
  { view: 'history', icon: '📚', label: '历史' },
  { view: 'weakness', icon: '🎯', label: '弱点' },
  { view: 'settings', icon: '⚙️', label: '设置' },
];

function AppContent() {
  const { view, setView, currentSession, setCurrentSession } = useStore();

  // review 和 tasks 是训练流程的延伸视图，不在底部导航中
  const showBottomNav = !['review', 'tasks'].includes(view);

  function renderView() {
    switch (view) {
      case 'home':
        return <HomePage />;
      case 'training':
        return <TrainingPage />;
      case 'review':
        return <ReviewPage />;
      case 'tasks':
        return <TasksPage />;
      case 'history':
        return <HistoryPage />;
      case 'weakness':
        return <WeaknessPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  }

  function handleNav(target: AppView) {
    // 点击「训练」时，若当前会话已完成复盘，则清空以开启新一轮
    if (target === 'training' && currentSession?.report) {
      setCurrentSession(null);
    }
    setView(target);
  }

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderView()}
      </div>

      {showBottomNav ? (
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              className={`nav-item ${view === item.view ? 'active' : ''}`}
              onClick={() => handleNav(item.view)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      ) : (
        // review / tasks 视图的简化导航
        <nav className="bottom-nav">
          <button className="nav-item active" onClick={() => handleNav('home')}>
            <span className="nav-icon">🏠</span>
            <span>回首页</span>
          </button>
          <button
            className="nav-item"
            onClick={() => handleNav(view === 'review' ? 'tasks' : 'home')}
          >
            <span className="nav-icon">➡️</span>
            <span>{view === 'review' ? '去训练任务' : '完成'}</span>
          </button>
        </nav>
      )}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
