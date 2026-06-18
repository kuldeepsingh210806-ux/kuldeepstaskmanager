import { db } from '../firebase';
import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot
} from 'firebase/firestore';
import type { User } from '../types';

const TAG = '[🔥 Firestore]';

function logOp(op: string, path: string) {
  console.log(`${TAG} ▶ ${op} → ${path}`);
}
function logOk(op: string, path: string) {
  console.log(`${TAG} ✅ ${op} succeeded → ${path}`);
}
function logFail(op: string, path: string, err: any) {
  const code = err?.code || '';
  const msg  = err?.message || String(err);
  if (code === 'permission-denied') {
    console.error(
      `${TAG} 🚫 PERMISSION DENIED on ${op} → ${path}\n` +
      `  → Your Firestore Security Rules are blocking writes.\n` +
      `  → Open Firebase Console → Firestore → Rules and set:\n` +
      `       allow read, write: if true;\n` +
      `  → Then click Publish.`
    );
  } else if (code === 'unavailable' || msg.includes('Failed to fetch')) {
    console.error(`${TAG} 📡 NETWORK ERROR on ${op} → ${path}: ${msg}`);
  } else if (code === 'not-found' || code === 'NOT_FOUND') {
    console.error(`${TAG} ❓ NOT FOUND on ${op} → ${path}. Database may not exist yet.`);
  } else {
    console.error(`${TAG} ❌ ${op} FAILED → ${path} [${code}] ${msg}`);
  }
}

// =============================================
// All write functions are fire-and-forget.
// They NEVER block the UI. Errors are VISIBLE.
// localStorage is the source of truth.
// Firebase is just a cloud backup mirror.
// =============================================

// --- USERS (cloud mirror) ---

export function cloudSyncAllUsers(users: User[]) {
  Promise.resolve().then(async () => {
    for (const u of users) {
      const path = `users/${u.id}`;
      logOp('setDoc', path);
      try {
        await setDoc(doc(db, 'users', u.id), JSON.parse(JSON.stringify(u)));
        logOk('setDoc', path);
      } catch (e) {
        logFail('setDoc', path, e);
      }
    }
  });
}

export function cloudSyncUser(user: User) {
  const path = `users/${user.id}`;
  logOp('setDoc', path);
  setDoc(doc(db, 'users', user.id), JSON.parse(JSON.stringify(user)))
    .then(() => logOk('setDoc', path))
    .catch(e  => logFail('setDoc', path, e));
}

export function cloudDeleteUser(id: string) {
  Promise.resolve().then(async () => {
    for (const col of ['appData', 'users']) {
      const path = `${col}/${id}`;
      logOp('deleteDoc', path);
      try {
        await deleteDoc(doc(db, col, id));
        logOk('deleteDoc', path);
      } catch (e) {
        logFail('deleteDoc', path, e);
      }
    }
  });
}

// --- APP DATA (single doc per user) ---

export function cloudSyncAppData(userId: string, data: object) {
  const path = `appData/${userId}`;
  logOp('setDoc', path);
  setDoc(doc(db, 'appData', userId), JSON.parse(JSON.stringify(data)))
    .then(() => logOk('setDoc', path))
    .catch(e  => logFail('setDoc', path, e));
}

// --- PULL from cloud ---

export async function cloudPullUsers(): Promise<User[] | null> {
  const path = 'users (collection)';
  logOp('getDocs', path);
  try {
    const snap = await getDocs(collection(db, 'users'));
    logOk('getDocs', path);
    if (snap.empty) return null;
    return snap.docs.map(d => d.data() as User);
  } catch (e) {
    logFail('getDocs', path, e);
    return null;
  }
}

export async function cloudPullAppData(userId: string): Promise<any | null> {
  const path = `appData/${userId}`;
  logOp('getDoc', path);
  try {
    const d = await getDoc(doc(db, 'appData', userId));
    logOk('getDoc', path);
    return d.exists() ? d.data() : null;
  } catch (e) {
    logFail('getDoc', path, e);
    return null;
  }
}

// --- REAL-TIME SUBSCRIPTIONS (onSnapshot) ---

/**
 * Subscribe to the entire users collection.
 * Fires immediately with the current snapshot, then on every change.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToUsers(
  onData: (users: User[]) => void,
  onErr?: (err: Error) => void
): () => void {
  const path = 'users (collection)';
  console.log(`${TAG} ▶ onSnapshot → ${path} [LIVE]`);
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      console.log(`${TAG} ✅ onSnapshot update → ${path} (${snap.docs.length} docs)`);
      onData(snap.docs.map(d => d.data() as User));
    },
    (err) => {
      logFail('onSnapshot', path, err);
      onErr?.(err);
    }
  );
}

/**
 * Subscribe to a single student's appData document.
 * Fires immediately and on every task/session/settings change.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeToAppData(
  userId: string,
  onData: (data: { tasks: any[]; sessions: any[]; settings: any } | null) => void,
  onErr?: (err: Error) => void
): () => void {
  const path = `appData/${userId}`;
  console.log(`${TAG} ▶ onSnapshot → ${path} [LIVE]`);
  return onSnapshot(
    doc(db, 'appData', userId),
    (snap) => {
      console.log(`${TAG} ✅ onSnapshot update → ${path}`);
      onData(snap.exists() ? (snap.data() as any) : null);
    },
    (err) => {
      logFail('onSnapshot', path, err);
      onErr?.(err);
    }
  );
}

// --- CONNECTION + WRITE TEST ---
// Tests BOTH read and write so the login page accurately reflects write access.

export async function testFirestoreConnection(): Promise<{ ok: boolean; error?: string; writeOk?: boolean }> {
  // 1. Test read
  try {
    logOp('getDocs [connection test]', 'users');
    await getDocs(collection(db, 'users'));
    logOk('getDocs [connection test]', 'users');
  } catch (err: any) {
    const code = err?.code || err?.message || 'Unknown error';
    logFail('getDocs [connection test]', 'users', err);
    return { ok: false, error: code };
  }

  // 2. Test write using a probe document
  const probeId = 'sf-probe-test';
  const path = `_probe/${probeId}`;
  try {
    logOp('setDoc [write test]', path);
    await setDoc(doc(db, '_probe', probeId), { ts: Date.now(), probe: true });
    logOk('setDoc [write test]', path);
    // Clean up
    await deleteDoc(doc(db, '_probe', probeId));
    return { ok: true, writeOk: true };
  } catch (err: any) {
    const code = err?.code || err?.message || 'Unknown error';
    logFail('setDoc [write test]', path, err);
    return { ok: false, error: code, writeOk: false };
  }
}
