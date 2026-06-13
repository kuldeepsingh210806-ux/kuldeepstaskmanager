import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import type { User, Task, StudySession, AppSettings } from '../types';

// ========================
// 🔑 USER OPERATIONS
// ========================

export async function getAllUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as User);
  } catch (err) {
    console.error('[DB] getAllUsers failed:', err);
    throw err;
  }
}

export async function getUserByMobile(mobile: string): Promise<User | null> {
  try {
    const q = query(collection(db, 'users'), where('mobile', '==', mobile));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as User;
  } catch (err) {
    console.error('[DB] getUserByMobile failed:', err);
    throw err;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const d = await getDoc(doc(db, 'users', id));
    if (!d.exists()) return null;
    return d.data() as User;
  } catch (err) {
    console.error('[DB] getUserById failed:', err);
    throw err;
  }
}

export async function createUser(user: User): Promise<void> {
  try {
    await setDoc(doc(db, 'users', user.id), {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      password: user.password,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isLoggedIn: user.isLoggedIn,
      deviceId: user.deviceId,
    });
  } catch (err) {
    console.error('[DB] createUser failed:', err);
    throw err;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
  try {
    // Use setDoc with merge instead of updateDoc to avoid issues
    await setDoc(doc(db, 'users', id), updates, { merge: true });
  } catch (err) {
    console.error('[DB] updateUser failed:', err);
    throw err;
  }
}

export async function deleteUserCompletely(id: string): Promise<void> {
  try {
    // Delete sub-collections first
    const taskSnap = await getDocs(collection(db, 'users', id, 'tasks'));
    for (const d of taskSnap.docs) await deleteDoc(d.ref);
    const sessSnap = await getDocs(collection(db, 'users', id, 'sessions'));
    for (const d of sessSnap.docs) await deleteDoc(d.ref);
    // Delete user settings
    try { await deleteDoc(doc(db, 'userData', id)); } catch {}
    // Delete user document
    await deleteDoc(doc(db, 'users', id));
  } catch (err) {
    console.error('[DB] deleteUserCompletely failed:', err);
    throw err;
  }
}

// ========================
// 📝 TASK OPERATIONS
// ========================

export async function getUserTasks(userId: string): Promise<Task[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'tasks'));
    return snap.docs.map(d => d.data() as Task);
  } catch (err) {
    console.error('[DB] getUserTasks failed:', err);
    return [];
  }
}

export async function setUserTask(userId: string, task: Task): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), JSON.parse(JSON.stringify(task)));
  } catch (err) {
    console.error('[DB] setUserTask failed:', err);
  }
}

export async function deleteUserTask(userId: string, taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (err) {
    console.error('[DB] deleteUserTask failed:', err);
  }
}

// ========================
// ⏱️ SESSION OPERATIONS
// ========================

export async function getUserSessions(userId: string): Promise<StudySession[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'sessions'));
    return snap.docs.map(d => d.data() as StudySession);
  } catch (err) {
    console.error('[DB] getUserSessions failed:', err);
    return [];
  }
}

export async function addUserSession(userId: string, session: StudySession): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', session.id), JSON.parse(JSON.stringify(session)));
  } catch (err) {
    console.error('[DB] addUserSession failed:', err);
  }
}

// ========================
// ⚙️ SETTINGS & VIEW
// ========================

export async function getUserSettings(userId: string): Promise<AppSettings | null> {
  try {
    const d = await getDoc(doc(db, 'userData', userId));
    if (!d.exists()) return null;
    return (d.data().settings || null) as AppSettings | null;
  } catch (err) {
    console.error('[DB] getUserSettings failed:', err);
    return null;
  }
}

export async function setUserSettings(userId: string, settings: AppSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'userData', userId), { settings: JSON.parse(JSON.stringify(settings)) }, { merge: true });
  } catch (err) {
    console.error('[DB] setUserSettings failed:', err);
  }
}

export async function getUserView(userId: string): Promise<string | null> {
  try {
    const d = await getDoc(doc(db, 'userData', userId));
    if (!d.exists()) return null;
    return d.data().currentView || null;
  } catch (err) {
    console.error('[DB] getUserView failed:', err);
    return null;
  }
}

export async function setUserView(userId: string, view: string): Promise<void> {
  try {
    await setDoc(doc(db, 'userData', userId), { currentView: view }, { merge: true });
  } catch (err) {
    console.error('[DB] setUserView failed:', err);
  }
}

// ========================
// 📊 ADMIN: GET ALL USER DATA
// ========================

export async function getUserDataForAdmin(userId: string) {
  const tasks = await getUserTasks(userId);
  const sessions = await getUserSessions(userId);
  const settings = await getUserSettings(userId);
  return { tasks, sessions, settings };
}
