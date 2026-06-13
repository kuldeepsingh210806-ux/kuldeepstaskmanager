import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import * as DB from '../services/database';
import type { Task, StudySession, AppSettings, ViewType, Subtask } from '../types';

const defaultSettings: AppSettings = {
  theme: 'dark',
  timer: {
    workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
    sessionsBeforeLongBreak: 4, autoStartBreaks: false, autoStartWork: false, soundEnabled: true,
  },
  categories: ['Mathematics', 'Science', 'English', 'History', 'Programming', 'Art', 'Music', 'Other'],
  dailyGoalMinutes: 120,
  weeklyGoalHours: 14,
};

// ---- Local cache helpers ----
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveLocal(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'actualMinutes' | 'subtasks'> & { subtasks?: Subtask[] }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  sessions: StudySession[];
  addSession: (session: Omit<StudySession, 'id'>) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  getTodayStudyMinutes: () => number;
  getWeekStudyHours: () => number;
  getStreak: () => number;
  isDataLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.userId || 'guest';

  // Keys for localStorage cache
  const tKey = `sf-tasks-${userId}`;
  const sKey = `sf-sessions-${userId}`;
  const stKey = `sf-settings-${userId}`;
  const vKey = `sf-view-${userId}`;

  // State — initialized from localStorage (INSTANT)
  const [currentView, setCurrentViewState] = useState<ViewType>(() => loadLocal(vKey, 'dashboard'));
  const [tasks, setTasks] = useState<Task[]>(() => loadLocal(tKey, []));
  const [sessions, setSessions] = useState<StudySession[]>(() => loadLocal(sKey, []));
  const [settings, setSettingsState] = useState<AppSettings>(() => loadLocal(stKey, defaultSettings));
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Track if we need to sync to cloud
  const dirtyRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- SAVE TO LOCAL (instant) + mark dirty for cloud sync ----
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    // Debounce: sync to cloud after 2 seconds of inactivity
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncToCloud();
    }, 2000);
  }, []);

  // Ref to always have latest state for the sync function
  const stateRef = useRef({ tasks, sessions, settings, currentView });
  useEffect(() => {
    stateRef.current = { tasks, sessions, settings, currentView };
    // Save to localStorage on every change (instant, no latency)
    saveLocal(tKey, tasks);
    saveLocal(sKey, sessions);
    saveLocal(stKey, settings);
    saveLocal(vKey, currentView);
  }, [tasks, sessions, settings, currentView, tKey, sKey, stKey, vKey]);

  // ---- CLOUD SYNC (background, debounced) ----
  const syncToCloud = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    setSyncStatus('syncing');
    try {
      const s = stateRef.current;
      await DB.saveUserAppData(userId, {
        tasks: s.tasks,
        sessions: s.sessions,
        settings: s.settings,
        currentView: s.currentView,
      });
      setSyncStatus('synced');
    } catch {
      setSyncStatus('offline');
      dirtyRef.current = true; // retry next time
    }
  }, [userId]);

  // ---- INITIAL LOAD: show local cache instantly, fetch cloud in background ----
  useEffect(() => {
    let cancelled = false;
    async function loadFromCloud() {
      setIsDataLoading(true);
      try {
        const cloud = await DB.loadUserAppData(userId);
        if (cancelled || !cloud) {
          setIsDataLoading(false);
          return;
        }
        // Merge strategy: cloud wins if it has more data, otherwise keep local
        const localTasks: Task[] = loadLocal(tKey, []);
        const localSessions: StudySession[] = loadLocal(sKey, []);

        // Use cloud if it exists and has data, otherwise keep local
        const finalTasks = cloud.tasks.length >= localTasks.length ? cloud.tasks : localTasks;
        const finalSessions = cloud.sessions.length >= localSessions.length ? cloud.sessions : localSessions;
        const finalSettings = cloud.settings || loadLocal(stKey, defaultSettings);
        const finalView = cloud.currentView || loadLocal(vKey, 'dashboard');

        setTasks(finalTasks);
        setSessions(finalSessions);
        setSettingsState(finalSettings);
        setCurrentViewState(finalView);

        // Save merged data to local
        saveLocal(tKey, finalTasks);
        saveLocal(sKey, finalSessions);
        saveLocal(stKey, finalSettings);
        saveLocal(vKey, finalView);
      } catch {
        // Cloud failed — that's ok, local data is already loaded
        setSyncStatus('offline');
      }
      if (!cancelled) setIsDataLoading(false);
    }
    loadFromCloud();
    return () => { cancelled = true; };
  }, [userId, tKey, sKey, stKey, vKey]);

  // Sync to cloud before page unload
  useEffect(() => {
    const handleUnload = () => {
      if (dirtyRef.current) {
        const s = stateRef.current;
        // Use sendBeacon for reliable last-chance sync
        // Fall back: at least local is saved
        try {
          DB.saveUserAppData(userId, {
            tasks: s.tasks, sessions: s.sessions,
            settings: s.settings, currentView: s.currentView,
          });
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId]);

  // ---- STATE SETTERS (instant local + background cloud) ----
  const setCurrentView = useCallback((view: ViewType) => {
    setCurrentViewState(view);
    markDirty();
  }, [markDirty]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'actualMinutes' | 'subtasks'> & { subtasks?: Subtask[] }) => {
    const newTask: Task = {
      ...task, id: uuidv4(), createdAt: new Date().toISOString(),
      actualMinutes: 0, subtasks: task.subtasks || [],
    };
    setTasks(prev => [newTask, ...prev]);
    markDirty();
  }, [markDirty]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    markDirty();
  }, [markDirty]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    markDirty();
  }, [markDirty]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return t.status === 'completed'
        ? { ...t, status: 'todo' as const, completedAt: undefined }
        : { ...t, status: 'completed' as const, completedAt: new Date().toISOString() };
    }));
    markDirty();
  }, [markDirty]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) };
    }));
    markDirty();
  }, [markDirty]);

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: [...t.subtasks, { id: uuidv4(), title, completed: false }] };
    }));
    markDirty();
  }, [markDirty]);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
    }));
    markDirty();
  }, [markDirty]);

  const addSession = useCallback((session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = { ...session, id: uuidv4() };
    setSessions(prev => [newSession, ...prev]);
    markDirty();
  }, [markDirty]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => ({ ...prev, ...updates }));
    markDirty();
  }, [markDirty]);

  // ---- STATS ----
  const getTodayStudyMinutes = useCallback(() => {
    const today = new Date().toDateString();
    return sessions
      .filter(s => new Date(s.startTime).toDateString() === today && s.type === 'work' && s.completed)
      .reduce((acc, s) => acc + s.duration / 60, 0);
  }, [sessions]);

  const getWeekStudyHours = useCallback(() => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return sessions
      .filter(s => new Date(s.startTime) >= weekAgo && s.type === 'work' && s.completed)
      .reduce((acc, s) => acc + s.duration / 3600, 0);
  }, [sessions]);

  const getStreak = useCallback(() => {
    const dates = new Set(
      sessions.filter(s => s.type === 'work' && s.completed).map(s => new Date(s.startTime).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      if (dates.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [sessions]);

  const value = useMemo(() => ({
    currentView, setCurrentView,
    tasks, addTask, updateTask, deleteTask, toggleTaskStatus, toggleSubtask, addSubtask, deleteSubtask,
    sessions, addSession,
    settings, updateSettings,
    getTodayStudyMinutes, getWeekStudyHours, getStreak,
    isDataLoading, syncStatus,
  }), [currentView, setCurrentView, tasks, addTask, updateTask, deleteTask, toggleTaskStatus,
    toggleSubtask, addSubtask, deleteSubtask, sessions, addSession, settings, updateSettings,
    getTodayStudyMinutes, getWeekStudyHours, getStreak, isDataLoading, syncStatus]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
