import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import type { User } from '../types';

// =============================================
// All functions are fire-and-forget.
// They NEVER block the UI. Errors are silent.
// localStorage is the source of truth.
// Firebase is just a cloud backup mirror.
// =============================================

// --- USERS (cloud mirror) ---

export function cloudSyncAllUsers(users: User[]) {
  // Sync entire users list to cloud in background
  Promise.resolve().then(async () => {
    try {
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), JSON.parse(JSON.stringify(u)));
      }
    } catch (e) { console.warn('[cloud] sync users failed:', e); }
  });
}

export function cloudSyncUser(user: User) {
  setDoc(doc(db, 'users', user.id), JSON.parse(JSON.stringify(user)))
    .catch(e => console.warn('[cloud] sync user failed:', e));
}

export function cloudDeleteUser(id: string) {
  Promise.resolve().then(async () => {
    try {
      await deleteDoc(doc(db, 'appData', id));
      await deleteDoc(doc(db, 'users', id));
    } catch (e) { console.warn('[cloud] delete user failed:', e); }
  });
}

// --- APP DATA (single doc per user) ---

export function cloudSyncAppData(userId: string, data: object) {
  setDoc(doc(db, 'appData', userId), JSON.parse(JSON.stringify(data)))
    .catch(e => console.warn('[cloud] sync appData failed:', e));
}

// --- PULL from cloud (used once on first-ever load) ---

export async function cloudPullUsers(): Promise<User[] | null> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return null;
    return snap.docs.map(d => d.data() as User);
  } catch { return null; }
}

export async function cloudPullAppData(userId: string): Promise<any | null> {
  try {
    const d = await getDoc(doc(db, 'appData', userId));
    return d.exists() ? d.data() : null;
  } catch { return null; }
}

// --- CONNECTION TEST ---

export async function testFirestoreConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await getDocs(collection(db, 'users'));
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.code || err?.message || 'Unknown error' };
  }
}
