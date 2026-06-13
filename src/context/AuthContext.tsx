import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { User, AuthSession, Task, StudySession } from '../types';
import * as DB from '../services/database';

const ADMIN_PASSKEY = 'Kuldeep Singh';
const SESSION_KEY = 'studyflow-auth-session';
const DEVICE_ID_KEY = 'studyflow-device-id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getLocalSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalSession(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

type AuthPage = 'login' | 'register';

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authPage: AuthPage;
  setAuthPage: (p: AuthPage) => void;
  isLoading: boolean;

  register: (name: string, mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (passkey: string) => { success: boolean; error?: string };
  logout: () => Promise<void>;

  getAllUsers: () => Promise<User[]>;
  getUserData: (userId: string) => Promise<{ tasks: Task[]; sessions: StudySession[]; settings: any }>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getLocalSession());
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session;
  const isAdmin = session?.isAdmin || false;
  const deviceId = getDeviceId();

  // Validate session on mount
  useEffect(() => {
    let mounted = true;
    async function validateSession() {
      const saved = getLocalSession();
      if (saved && !saved.isAdmin) {
        try {
          const user = await DB.getUserById(saved.userId);
          if (mounted) {
            if (!user || user.deviceId !== deviceId) {
              setSession(null);
              saveLocalSession(null);
            }
          }
        } catch (err) {
          console.error('[Auth] Session validation failed:', err);
          // Keep session if Firebase unreachable (offline tolerance)
        }
      }
      if (mounted) setIsLoading(false);
    }
    validateSession();
    return () => { mounted = false; };
  }, [deviceId]);

  const register = useCallback(async (name: string, mobile: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimName = name.trim();
    const trimMobile = mobile.trim();
    const trimPass = password.trim();

    if (!trimName) return { success: false, error: 'Name is required' };
    if (trimName.length < 2) return { success: false, error: 'Name must be at least 2 characters' };
    if (!/^\d{10}$/.test(trimMobile)) return { success: false, error: 'Enter a valid 10-digit mobile number' };
    if (!/^\d{4}$/.test(trimPass)) return { success: false, error: 'Password must be exactly 4 digits' };

    try {
      const existing = await DB.getUserByMobile(trimMobile);
      if (existing) {
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
        deviceId: deviceId,
      };

      await DB.createUser(newUser);

      const newSession: AuthSession = {
        userId: newUser.id,
        mobile: newUser.mobile,
        name: newUser.name,
        deviceId: deviceId,
        loggedInAt: new Date().toISOString(),
        isAdmin: false,
      };
      setSession(newSession);
      saveLocalSession(newSession);

      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Register error:', err);
      const msg = err?.code === 'permission-denied'
        ? 'Database permission denied. Please check Firestore security rules.'
        : err?.code === 'unavailable'
          ? 'Cannot reach database. Check your internet connection.'
          : `Registration failed: ${err?.message || 'Unknown error'}`;
      return { success: false, error: msg };
    }
  }, [deviceId]);

  const login = useCallback(async (mobile: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimMobile = mobile.trim();
    const trimPass = password.trim();

    if (!/^\d{10}$/.test(trimMobile)) return { success: false, error: 'Enter a valid 10-digit mobile number' };
    if (!/^\d{4}$/.test(trimPass)) return { success: false, error: 'Password must be exactly 4 digits' };

    try {
      const user = await DB.getUserByMobile(trimMobile);

      if (!user) return { success: false, error: 'No account found with this mobile number' };
      if (user.password !== trimPass) return { success: false, error: 'Incorrect password' };

      if (user.isLoggedIn && user.deviceId !== deviceId) {
        return { success: false, error: 'You are already logged in on another device. Please logout from there first.' };
      }

      await DB.updateUser(user.id, {
        isLoggedIn: true,
        deviceId: deviceId,
        lastLoginAt: new Date().toISOString(),
      });

      const newSession: AuthSession = {
        userId: user.id,
        mobile: user.mobile,
        name: user.name,
        deviceId: deviceId,
        loggedInAt: new Date().toISOString(),
        isAdmin: false,
      };
      setSession(newSession);
      saveLocalSession(newSession);

      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      const msg = err?.code === 'permission-denied'
        ? 'Database permission denied. Please check Firestore security rules.'
        : err?.code === 'unavailable'
          ? 'Cannot reach database. Check your internet connection.'
          : `Login failed: ${err?.message || 'Unknown error'}`;
      return { success: false, error: msg };
    }
  }, [deviceId]);

  const adminLogin = useCallback((passkey: string): { success: boolean; error?: string } => {
    if (passkey !== ADMIN_PASSKEY) {
      return { success: false, error: 'Invalid admin passkey' };
    }

    const newSession: AuthSession = {
      userId: 'admin',
      mobile: '',
      name: 'Admin',
      deviceId: deviceId,
      loggedInAt: new Date().toISOString(),
      isAdmin: true,
    };
    setSession(newSession);
    saveLocalSession(newSession);

    return { success: true };
  }, [deviceId]);

  const logout = useCallback(async () => {
    if (session && !session.isAdmin) {
      try {
        await DB.updateUser(session.userId, { isLoggedIn: false });
      } catch (err) {
        console.error('[Auth] Logout update failed:', err);
      }
    }
    setSession(null);
    saveLocalSession(null);
  }, [session]);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    return await DB.getAllUsers();
  }, []);

  const getUserData = useCallback(async (userId: string) => {
    return await DB.getUserDataForAdmin(userId);
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    await DB.deleteUserCompletely(userId);
  }, []);

  const value = useMemo(() => ({
    session, isAuthenticated, isAdmin, authPage, setAuthPage, isLoading,
    register, login, adminLogin, logout,
    getAllUsers, getUserData, deleteUser,
  }), [session, isAuthenticated, isAdmin, authPage, setAuthPage, isLoading, register, login, adminLogin, logout, getAllUsers, getUserData, deleteUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
