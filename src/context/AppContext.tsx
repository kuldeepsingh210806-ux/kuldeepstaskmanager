import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import * as DB from '../services/database';
import type { Task, StudySession, AppSettings, ViewType, Subtask } from '../types';

const defaultSettings: AppSettings = {
  theme: 'dark',
  timer: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
  },
  categories: ['Mathematics', 'Science', 'English', 'History', 'Programming', 'Art', 'Music', 'Other'],
  dailyGoalMinutes: 120,
  weeklyGoalHours: 14,
};

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.userId || 'guest';

  const [currentView, setCurrentViewState] = useState<ViewType>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load all data from Firestore on mount / user change
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setIsDataLoading(true);
      try {
        const [dbTasks, dbSessions, dbSettings, dbView] = await Promise.all([
          DB.getUserTasks(userId),
          DB.getUserSessions(userId),
          DB.getUserSettings(userId),
          DB.getUserView(userId),
        ]);
        if (cancelled) return;
        setTasks(dbTasks);
        setSessions(dbSessions);
        if (dbSettings) setSettingsState(dbSettings);
        if (dbView) setCurrentViewState(dbView as ViewType);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
      if (!cancelled) setIsDataLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [userId]);

  // View
  const setCurrentView = useCallback((view: ViewType) => {
    setCurrentViewState(view);
    DB.setUserView(userId, view).catch(console.error);
  }, [userId]);

  // Tasks
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'actualMinutes' | 'subtasks'> & { subtasks?: Subtask[] }) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      actualMinutes: 0,
      subtasks: task.subtasks || [],
    };
    setTasks(prev => [newTask, ...prev]);
    DB.setUserTask(userId, newTask).catch(console.error);
  }, [userId]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      const task = updated.find(t => t.id === id);
      if (task) DB.setUserTask(userId, task).catch(console.error);
      return updated;
    });
  }, [userId]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    DB.deleteUserTask(userId, id).catch(console.error);
  }, [userId]);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== id) return t;
        if (t.status === 'completed') {
          return { ...t, status: 'todo' as const, completedAt: undefined };
        }
        return { ...t, status: 'completed' as const, completedAt: new Date().toISOString() };
      });
      const task = updated.find(t => t.id === id);
      if (task) DB.setUserTask(userId, task).catch(console.error);
      return updated;
    });
  }, [userId]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) };
      });
      const task = updated.find(t => t.id === taskId);
      if (task) DB.setUserTask(userId, task).catch(console.error);
      return updated;
    });
  }, [userId]);

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: [...t.subtasks, { id: uuidv4(), title, completed: false }] };
      });
      const task = updated.find(t => t.id === taskId);
      if (task) DB.setUserTask(userId, task).catch(console.error);
      return updated;
    });
  }, [userId]);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
      });
      const task = updated.find(t => t.id === taskId);
      if (task) DB.setUserTask(userId, task).catch(console.error);
      return updated;
    });
  }, [userId]);

  // Sessions
  const addSession = useCallback((session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = { ...session, id: uuidv4() };
    setSessions(prev => [newSession, ...prev]);
    DB.addUserSession(userId, newSession).catch(console.error);
  }, [userId]);

  // Settings
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...updates };
      DB.setUserSettings(userId, updated).catch(console.error);
      return updated;
    });
  }, [userId]);

  // Stats
  const getTodayStudyMinutes = useCallback(() => {
    const today = new Date().toDateString();
    return sessions
      .filter(s => new Date(s.startTime).toDateString() === today && s.type === 'work' && s.completed)
      .reduce((acc, s) => acc + s.duration / 60, 0);
  }, [sessions]);

  const getWeekStudyHours = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
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
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (dates.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [sessions]);

  const value = useMemo(() => ({
    currentView, setCurrentView,
    tasks, addTask, updateTask, deleteTask, toggleTaskStatus, toggleSubtask, addSubtask, deleteSubtask,
    sessions, addSession,
    settings, updateSettings,
    getTodayStudyMinutes, getWeekStudyHours, getStreak,
    isDataLoading,
  }), [currentView, setCurrentView, tasks, addTask, updateTask, deleteTask, toggleTaskStatus, toggleSubtask, addSubtask, deleteSubtask, sessions, addSession, settings, updateSettings, getTodayStudyMinutes, getWeekStudyHours, getStreak, isDataLoading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
