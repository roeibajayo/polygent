import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { useTheme, useSignalRConnection } from '@/hooks';
import { Header, Footer, Button } from '@/components';
import { useInitStore, useWorkspaceStore } from '@/stores';
import { useEffect } from 'react';

// Pages
import Home from '@/pages/Home';
import Session from './pages/Session';
import Backlogs from './pages/Backlogs';
import Agents from './pages/Agents';
import Workspaces from './pages/Workspaces';
import Workspace from './pages/Workspace';
import MCPs from './pages/MCPs';

function App() {
  useTheme(); // Initialize theme
  useSignalRConnection(); // Initialize global SignalR connection

  const { initialize, isInitialized, isInitializing, initError } =
    useInitStore();
  const { loadSessions, loadWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      // Load workspaces and sessions after initialization
      const loadData = async () => {
        await loadWorkspaces();
        await loadSessions(null);
      };
      loadData();
    }
  }, [isInitialized, loadSessions, loadWorkspaces]);

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-300">
            Initializing application...
          </p>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Initialization Failed
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{initError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col h-screen select-none">
        <Header />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/session/:sessionId" element={<Session />} />
            <Route path="/backlogs" element={<Backlogs />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/workspace/:workspaceId" element={<Workspace />} />
            <Route path="/mcps" element={<MCPs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
