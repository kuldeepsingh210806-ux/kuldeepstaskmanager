import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBsmOeiY8r07hNHqJl6rzeLtx4Na0HXBnM",
  authDomain: "task-manager-3cc82.firebaseapp.com",
  projectId: "task-manager-3cc82",
  storageBucket: "task-manager-3cc82.firebasestorage.app",
  messagingSenderId: "449204186783",
  appId: "1:449204186783:web:5fb08cfaf154c0d8a73caa",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
