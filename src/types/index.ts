export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TimerMode = 'work' | 'short-break' | 'long-break';
export type ViewType = 'dashboard' | 'tasks' | 'timer' | 'calendar' | 'statistics' | 'settings' | 'ai';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  subtasks: Subtask[];
  tags: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface StudySession {
  id: string;
  category: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  type: TimerMode;
  completed: boolean;
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  timer: TimerSettings;
  categories: string[];
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
}

export interface DailyStats {
  date: string;
  totalStudyMinutes: number;
  tasksCompleted: number;
  sessionsCompleted: number;
}

// ===== Auth Types =====

export interface User {
  id: string;
  name: string;
  mobile: string;
  password: string; // 4-digit pin
  createdAt: string;
  lastLoginAt: string;
  isLoggedIn: boolean;       // track active login
  deviceId: string;          // bind to one device
}

export interface AuthSession {
  userId: string;
  mobile: string;
  name: string;
  deviceId: string;
  loggedInAt: string;
  isAdmin: boolean;
}
