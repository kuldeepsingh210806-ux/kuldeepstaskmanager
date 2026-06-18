import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import PomodoroTimer from './components/PomodoroTimer';
import CalendarView from './components/CalendarView';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import AISection from './components/AISection';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import AdminPanel from './components/admin/AdminPanel';
import { GraduationCap, Loader2 } from 'lucide-react';

function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30 mb-6">
          <GraduationCap size={40} className="text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
          <Loader2 size={14} className="text-violet-400 animate-spin" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">StudyFlow</h1>
      <p className="text-sm text-slate-400">Checking session...</p>
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, isAdmin, authPage, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  if (!isAuthenticated) {
    if (authPage === 'register') return <RegisterPage />;
    return <LoginPage />;
  }

  if (isAdmin) return <AdminPanel />;

  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

function MainApp() {
  const { currentView } = useApp();
  const isAI = currentView === 'ai';

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':  return <Dashboard />;
      case 'tasks':      return <TaskManager />;
      case 'timer':      return <PomodoroTimer />;
      case 'calendar':   return <CalendarView />;
      case 'statistics': return <Statistics />;
      case 'settings':   return <Settings />;
      case 'ai':         return <AISection />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] overflow-hidden">
      <Sidebar />
      {/* AI view: full height, no padding, no max-width — owns the entire main area */}
      {isAI ? (
        <main className="flex-1 flex flex-col overflow-hidden pt-12 lg:pt-0">
          {renderView()}
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-6 max-w-7xl mx-auto animate-fade-in">
            {renderView()}
          </div>
        </main>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
