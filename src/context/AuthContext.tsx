import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, AuthSession, Task, StudySession } from '../types';
import { cloudSyncUser, cloudDeleteUser, cloudPullUsers } from '../services/database';

const ADMIN_PASSKEY = import.meta.env.VITE_ADMIN_PASSKEY || 'Kuldeep Singh';
const SESSION_KEY = 'sf-session';
const DEVICE_KEY = 'sf-device';
const USERS_KEY = 'sf-users';

// --- Pure localStorage helpers (instant, 0ms) ---
function ls(key: string): any {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function lsSet(key: string, val: any) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function getDeviceId(): string {
  let id = ls(DEVICE_KEY);
  if (!id) { id = uuidv4(); lsSet(DEVICE_KEY, id); }
  return id;
}

function getUsers(): User[] { return ls(USERS_KEY) || []; }
function saveUsers(users: User[]) { lsSet(USERS_KEY, users); }

type AuthPage = 'login' | 'register';

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authPage: AuthPage;
  setAuthPage: (p: AuthPage) => void;
  isLoading: boolean;
  register: (name: string, mobile: string, password: string) => { success: boolean; error?: string };
  login: (mobile: string, password: string) => { success: boolean; error?: string };
  adminLogin: (passkey: string) => { success: boolean; error?: string };
  logout: () => void;
  getAllUsers: () => User[];
  getUserData: (userId: string) => { tasks: Task[]; sessions: StudySession[]; settings: any };
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => ls(SESSION_KEY));
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const isLoading = false;
  const deviceId = getDeviceId();
  const isAuthenticated = !!session;
  const isAdmin = session?.isAdmin || false;

  // Background: pull users from cloud once and merge with local
  useEffect(() => {
    cloudPullUsers().then(cloudUsers => {
      if (!cloudUsers || cloudUsers.length === 0) return;
      const local = getUsers();
      const localIds = new Set(local.map(u => u.id));
      const localMobiles = new Set(local.map(u => u.mobile));
      let merged = [...local];
      for (const cu of cloudUsers) {
        if (!localIds.has(cu.id) && !localMobiles.has(cu.mobile)) {
          merged.push(cu);
        } else {
          // Update existing user with cloud version if cloud is newer
          const idx = merged.findIndex(u => u.id === cu.id || u.mobile === cu.mobile);
          if (idx !== -1) {
            const localUser = merged[idx];
            const cloudNewer = cu.lastLoginAt && localUser.lastLoginAt
              ? new Date(cu.lastLoginAt) > new Date(localUser.lastLoginAt)
              : false;
            if (cloudNewer) {
              merged[idx] = { ...cu };
            }
          }
        }
      }
      saveUsers(merged);
    });
  }, []);

  // REGISTER — instant, no await
  const register = useCallback((name: string, mobile: string, password: string): { success: boolean; error?: string } => {
    const trimName = name.trim();
    const trimMobile = mobile.trim();
    const trimPass = password.trim();

    if (!trimName || trimName.length < 2) return { success: false, error: 'Name must be at least 2 characters' };
    if (!/^\d{10}$/.test(trimMobile)) return { success: false, error: 'Enter a valid 10-digit mobile number' };
    if (!/^\d{4}$/.test(trimPass)) return { success: false, error: 'Password must be exactly 4 digits' };

    const users = getUsers();
    if (users.find(u => u.mobile === trimMobile)) {
      return { success: false, error: 'This mobile number is already registered' };
    }

    const newUser: User = {
      id: uuidv4(),
      name: trimName,
      mobile: trimMobile,
      password: trimPass,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isLoggedIn: true,
      deviceId,
    };

    users.push(newUser);
    saveUsers(users);

    // Cloud backup (fire and forget)
    cloudSyncUser(newUser);

    const s: AuthSession = {
      userId: newUser.id, mobile: newUser.mobile, name: newUser.name,
      deviceId, loggedInAt: new Date().toISOString(), isAdmin: false,
    };
    setSession(s);
    lsSet(SESSION_KEY, s);

    return { success: true };
  }, [deviceId]);

  // LOGIN — works across devices, no device lock
  const login = useCallback((mobile: string, password: string): { success: boolean; error?: string } => {
    const trimMobile = mobile.trim();
    const trimPass = password.trim();

    if (!/^\d{10}$/.test(trimMobile)) return { success: false, error: 'Enter a valid 10-digit mobile number' };
    if (!/^\d{4}$/.test(trimPass)) return { success: false, error: 'Password must be exactly 4 digits' };

    const users = getUsers();
    let user = users.find(u => u.mobile === trimMobile);

    if (!user) {
      // User not in local storage — try pulling from cloud first
      cloudPullUsers().then(cloudUsers => {
        if (!cloudUsers) return;
        const local = getUsers();
        const localIds = new Set(local.map(u => u.id));
        const localMobiles = new Set(local.map(u => u.mobile));
        let merged = [...local];
        for (const cu of cloudUsers) {
          if (!localIds.has(cu.id) && !localMobiles.has(cu.mobile)) merged.push(cu);
        }
        saveUsers(merged);
      });
      return { success: false, error: 'Account not found. Try again in a moment if you just registered on another device.' };
    }

    if (user.password !== trimPass) return { success: false, error: 'Incorrect password' };

    // Update user — allow login from any device
    user.isLoggedIn = true;
    user.deviceId = deviceId;
    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    // Cloud backup (fire and forget)
    cloudSyncUser(user);

    const s: AuthSession = {
      userId: user.id, mobile: user.mobile, name: user.name,
      deviceId, loggedInAt: new Date().toISOString(), isAdmin: false,
    };
    setSession(s);
    lsSet(SESSION_KEY, s);

    return { success: true };
  }, [deviceId]);

  // ADMIN LOGIN — instant
  const adminLogin = useCallback((passkey: string): { success: boolean; error?: string } => {
    if (passkey !== ADMIN_PASSKEY) return { success: false, error: 'Invalid admin passkey' };
    const s: AuthSession = {
      userId: 'admin', mobile: '', name: 'Admin',
      deviceId, loggedInAt: new Date().toISOString(), isAdmin: true,
    };
    setSession(s);
    lsSet(SESSION_KEY, s);
    return { success: true };
  }, [deviceId]);

  // LOGOUT — instant
  const logout = useCallback(() => {
    if (session && !session.isAdmin) {
      const users = getUsers();
      const user = users.find(u => u.id === session.userId);
      if (user) {
        user.isLoggedIn = false;
        saveUsers(users);
        cloudSyncUser(user); // background
      }
    }
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, [session]);

  // ADMIN: get all users — instant from localStorage
  const getAllUsers = useCallback((): User[] => {
    return getUsers();
  }, []);

  // ADMIN: get user data — instant from localStorage
  const getUserData = useCallback((userId: string) => {
    const tasks: Task[] = ls(`sf-tasks-${userId}`) || [];
    const sessions: StudySession[] = ls(`sf-sessions-${userId}`) || [];
    const settings = ls(`sf-settings-${userId}`) || {};
    return { tasks, sessions, settings };
  }, []);

  // ADMIN: delete user — instant
  const deleteUser = useCallback((userId: string) => {
    const users = getUsers().filter(u => u.id !== userId);
    saveUsers(users);
    localStorage.removeItem(`sf-tasks-${userId}`);
    localStorage.removeItem(`sf-sessions-${userId}`);
    localStorage.removeItem(`sf-settings-${userId}`);
    localStorage.removeItem(`sf-view-${userId}`);
    cloudDeleteUser(userId); // background
  }, []);

  const value = useMemo(() => ({
    session, isAuthenticated, isAdmin, authPage, setAuthPage, isLoading,
    register, login, adminLogin, logout,
    getAllUsers, getUserData, deleteUser,
  }), [session, isAuthenticated, isAdmin, authPage, setAuthPage, isLoading,
    register, login, adminLogin, logout, getAllUsers, getUserData, deleteUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
