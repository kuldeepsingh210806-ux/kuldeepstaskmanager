import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { cloudSyncAppData, cloudPullAppData } from '../services/database';
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

// --- localStorage helpers (instant, 0ms) ---
function ls(key: string): any {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function lsSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// Merge two arrays by id, keeping the most recently updated item for conflicts
function mergeById<T extends { id: string; updatedAt?: string; createdAt?: string }>(local: T[], cloud: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of cloud) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      // Prefer whichever has a newer updatedAt/createdAt
      const existingDate = existing.updatedAt || existing.createdAt || '';
      const cloudDate = item.updatedAt || item.createdAt || '';
      if (cloudDate > existingDate) map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'actualMinutes' | 'subtasks'> & { subtasks?: Subtask[] }) => void;
  updateTask: (id: string, u: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  sessions: StudySession[];
  addSession: (s: Omit<StudySession, 'id'>) => void;
  settings: AppSettings;
  updateSettings: (u: Partial<AppSettings>) => void;
  getTodayStudyMinutes: () => number;
  getWeekStudyHours: () => number;
  getStreak: () => number;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const uid = session?.userId || 'guest';
  const tK = `sf-tasks-${uid}`, sK = `sf-sessions-${uid}`, stK = `sf-settings-${uid}`, vK = `sf-view-${uid}`;

  // State — initialized from localStorage (INSTANT, 0ms)
  const [currentView, setViewState] = useState<ViewType>(() => ls(vK) || 'dashboard');
  const [tasks, setTasks] = useState<Task[]>(() => ls(tK) || []);
  const [sessions, setSessions] = useState<StudySession[]>(() => ls(sK) || []);
  const [settings, setSettingsState] = useState<AppSettings>(() => ls(stK) || defaultSettings);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ tasks, sessions, settings, currentView });

  // Keep stateRef current + persist to localStorage on EVERY change (instant)
  useEffect(() => {
    stateRef.current = { tasks, sessions, settings, currentView };
    lsSet(tK, tasks);
    lsSet(sK, sessions);
    lsSet(stK, settings);
    lsSet(vK, currentView);
  }, [tasks, sessions, settings, currentView, tK, sK, stK, vK]);

  // Debounced cloud sync — fires 3s after last change
  const scheduleCloudSync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSyncStatus('syncing');
    timerRef.current = setTimeout(() => {
      const s = stateRef.current;
      cloudSyncAppData(uid, s);
      setTimeout(() => setSyncStatus('synced'), 800);
    }, 3000);
  }, [uid]);

  // Pull cloud data on mount — merge properly by ID so cross-device data is preserved
  useEffect(() => {
    if (!uid || uid === 'guest') return;
    cloudPullAppData(uid).then(cloud => {
      if (!cloud) return;

      const localTasks: Task[] = ls(tK) || [];
      const localSessions: StudySession[] = ls(sK) || [];
      const localSettings = ls(stK);

      // Merge tasks and sessions by id — keeps all unique items from both devices
      const mergedTasks = mergeById(localTasks, cloud.tasks || []);
      const mergedSessions = mergeById(localSessions, cloud.sessions || []);

      // Update state and localStorage with merged data
      if (mergedTasks.length !== localTasks.length ||
          JSON.stringify(mergedTasks) !== JSON.stringify(localTasks)) {
        setTasks(mergedTasks);
        lsSet(tK, mergedTasks);
      }
      if (mergedSessions.length !== localSessions.length ||
          JSON.stringify(mergedSessions) !== JSON.stringify(localSessions)) {
        setSessions(mergedSessions);
        lsSet(sK, mergedSessions);
      }
      if (cloud.settings && !localSettings) {
        setSettingsState(cloud.settings);
        lsSet(stK, cloud.settings);
      }
    });
  }, [uid, tK, sK, stK]);

  // --- All setters: instant local + schedule cloud ---

  const setCurrentView = useCallback((v: ViewType) => {
    setViewState(v); scheduleCloudSync();
  }, [scheduleCloudSync]);

  const addTask = useCallback((t: Omit<Task, 'id' | 'createdAt' | 'actualMinutes' | 'subtasks'> & { subtasks?: Subtask[] }) => {
    setTasks(p => [{ ...t, id: uuidv4(), createdAt: new Date().toISOString(), actualMinutes: 0, subtasks: t.subtasks || [] }, ...p]);
    scheduleCloudSync();
  }, [scheduleCloudSync]);

  const updateTask = useCallback((id: string, u: Partial<Task>) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, ...u, updatedAt: new Date().toISOString() } : t));
    scheduleCloudSync();
  }, [scheduleCloudSync]);

  const deleteTask = useCallback((id: string) => {
    setTasks(p => p.filter(t => t.id !== id)); scheduleCloudSync();
  }, [scheduleCloudSync]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(p => p.map(t => {
      if (t.id !== id) return t;
      return t.status === 'completed'
        ? { ...t, status: 'todo' as const, completedAt: undefined, updatedAt: new Date().toISOString() }
        : { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }));
    scheduleCloudSync();
  }, [scheduleCloudSync]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(p => p.map(t => t.id !== taskId ? t : {
      ...t,
      updatedAt: new Date().toISOString(),
      subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
    }));
    scheduleCloudSync();
  }, [scheduleCloudSync]);

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks(p => p.map(t => t.id !== taskId ? t : {
      ...t,
      updatedAt: new Date().toISOString(),
      subtasks: [...t.subtasks, { id: uuidv4(), title, completed: false }]
    }));
    scheduleCloudSync();
  }, [scheduleCloudSync]);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(p => p.map(t => t.id !== taskId ? t : {
      ...t,
      updatedAt: new Date().toISOString(),
      subtasks: t.subtasks.filter(s => s.id !== subtaskId)
    }));
    scheduleCloudSync();
  }, [scheduleCloudSync]);

  const addSession = useCallback((s: Omit<StudySession, 'id'>) => {
    setSessions(p => [{ ...s, id: uuidv4() }, ...p]); scheduleCloudSync();
  }, [scheduleCloudSync]);

  const updateSettings = useCallback((u: Partial<AppSettings>) => {
    setSettingsState(p => ({ ...p, ...u })); scheduleCloudSync();
  }, [scheduleCloudSync]);

  // --- Stats (pure computation, instant) ---

  const getTodayStudyMinutes = useCallback(() => {
    const today = new Date().toDateString();
    return sessions.filter(s => new Date(s.startTime).toDateString() === today && s.type === 'work' && s.completed)
      .reduce((a, s) => a + s.duration / 60, 0);
  }, [sessions]);

  const getWeekStudyHours = useCallback(() => {
    const ago = Date.now() - 7 * 86400000;
    return sessions.filter(s => new Date(s.startTime).getTime() >= ago && s.type === 'work' && s.completed)
      .reduce((a, s) => a + s.duration / 3600, 0);
  }, [sessions]);

  const getStreak = useCallback(() => {
    const dates = new Set(sessions.filter(s => s.type === 'work' && s.completed).map(s => new Date(s.startTime).toDateString()));
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      if (dates.has(new Date(Date.now() - i * 86400000).toDateString())) streak++;
      else if (i > 0) break;
    }
    return streak;
  }, [sessions]);

  const value = useMemo(() => ({
    currentView, setCurrentView,
    tasks, addTask, updateTask, deleteTask, toggleTaskStatus, toggleSubtask, addSubtask, deleteSubtask,
    sessions, addSession, settings, updateSettings,
    getTodayStudyMinutes, getWeekStudyHours, getStreak, syncStatus,
  }), [currentView, setCurrentView, tasks, addTask, updateTask, deleteTask, toggleTaskStatus,
    toggleSubtask, addSubtask, deleteSubtask, sessions, addSession, settings, updateSettings,
    getTodayStudyMinutes, getWeekStudyHours, getStreak, syncStatus]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
