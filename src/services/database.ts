import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import type { User, Task, StudySession, AppSettings, ViewType } from '../types';

// ============================================================
// USERS — stored as individual docs in /users/{id}
// ============================================================

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as User);
}

export async function getUserByMobile(mobile: string): Promise<User | null> {
  const all = await getAllUsers();
  return all.find(u => u.mobile === mobile) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const d = await getDoc(doc(db, 'users', id));
  if (!d.exists()) return null;
  return d.data() as User;
}

export async function createUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), {
    id: user.id, name: user.name, mobile: user.mobile, password: user.password,
    createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
    isLoggedIn: user.isLoggedIn, deviceId: user.deviceId,
  });
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  await setDoc(doc(db, 'users', id), updates, { merge: true });
}

export async function deleteUserCompletely(id: string): Promise<void> {
  try { await deleteDoc(doc(db, 'appData', id)); } catch {}
  await deleteDoc(doc(db, 'users', id));
}

// ============================================================
// APP DATA — ALL user data in ONE document: /appData/{userId}
// { tasks: [...], sessions: [...], settings: {...}, currentView: "..." }
// 1 read to load everything, 1 write to save everything.
// ============================================================

export interface UserAppData {
  tasks: Task[];
  sessions: StudySession[];
  settings: AppSettings | null;
  currentView: ViewType;
}

export async function loadUserAppData(userId: string): Promise<UserAppData | null> {
  try {
    const d = await getDoc(doc(db, 'appData', userId));
    if (!d.exists()) return null;
    const raw = d.data();
    return {
      tasks: raw.tasks || [],
      sessions: raw.sessions || [],
      settings: raw.settings || null,
      currentView: raw.currentView || 'dashboard',
    };
  } catch {
    return null;
  }
}

export async function saveUserAppData(userId: string, data: UserAppData): Promise<void> {
  await setDoc(doc(db, 'appData', userId), JSON.parse(JSON.stringify(data)));
}

// ============================================================
// CONNECTION TEST
// ============================================================

export async function testFirestoreConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getDocs(collection(db, 'users'));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.code || err?.message || 'Unknown error' };
  }
}

// ============================================================
// ADMIN helpers
// ============================================================

export async function getUserDataForAdmin(userId: string) {
  const data = await loadUserAppData(userId);
  return {
    tasks: data?.tasks || [],
    sessions: data?.sessions || [],
    settings: data?.settings || null,
  };
}
