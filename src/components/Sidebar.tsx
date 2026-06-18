import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import type { ViewType } from '../types';
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  Calendar,
  BarChart3,
  Settings,
  GraduationCap,
  Menu,
  X,
  LogOut,
  Bot,
  Layers,
} from 'lucide-react';
import { useState } from 'react';

const navItems: { view: ViewType; label: string; icon: React.ReactNode; badge?: string }[] = [
  { view: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard size={20} /> },
  { view: 'tasks',      label: 'Tasks',        icon: <ListTodo size={20} /> },
  { view: 'timer',      label: 'Study Timer',  icon: <Timer size={20} /> },
  { view: 'calendar',   label: 'Calendar',     icon: <Calendar size={20} /> },
  { view: 'statistics', label: 'Statistics',   icon: <BarChart3 size={20} /> },
  { view: 'ai',         label: 'AI Tutor',     icon: <Bot size={20} />,    badge: 'AI' },
  { view: 'flashcards', label: 'Flashcards',   icon: <Layers size={20} />, badge: 'AI' },
  { view: 'settings',   label: 'Settings',     icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const { currentView, setCurrentView, getTodayStudyMinutes, settings, syncStatus } = useApp();
  const { session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const todayMinutes = getTodayStudyMinutes();
  const goalProgress = Math.min((todayMinutes / settings.dailyGoalMinutes) * 100, 100);

  const handleNav = (view: ViewType) => {
    setCurrentView(view);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <GraduationCap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">StudyFlow</h1>
          <p className="text-[11px] text-slate-400 -mt-0.5">Time & Task Manager</p>
        </div>
      </div>

      {/* User Info */}
      {session && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{session.name}</p>
              <p className="text-[10px] text-slate-500">{session.mobile ? `+91 ${session.mobile}` : 'User'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Online" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => handleNav(item.view)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              currentView === item.view
                ? item.view === 'ai'
                  ? 'bg-gradient-to-r from-fuchsia-600/90 to-violet-600/90 text-white shadow-lg shadow-fuchsia-500/20'
                  : 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                currentView === item.view
                  ? 'bg-white/20 text-white'
                  : 'bg-fuchsia-500/20 text-fuchsia-400'
              )}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Daily Goal Progress */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-400">Daily Goal</span>
          <span className="text-white font-medium">{Math.round(todayMinutes)}m / {settings.dailyGoalMinutes}m</span>
        </div>
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        {goalProgress >= 100 && (
          <p className="text-xs text-emerald-400 mt-1.5 font-medium">🎉 Goal reached!</p>
        )}
      </div>

      {/* Sync Status */}
      <div className="px-4 py-2 flex items-center gap-1.5 text-[10px]">
        {syncStatus === 'syncing' ? (
          <><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-400/70">Syncing...</span></>
        ) : syncStatus === 'synced' ? (
          <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-slate-500">Cloud synced</span></>
        ) : (
          <><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-red-400/70">Offline</span></>
        )}
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-slate-800 text-white shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static z-40 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 shadow-2xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <LogOut size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Logout</h3>
                <p className="text-xs text-slate-400">Are you sure you want to logout?</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              You will need to login again with your mobile number and PIN to access your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-sm text-white font-medium hover:bg-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
