import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsSO684kk2gCjJU75cjRdupm7mAl8pJNg",
  authDomain: "kuldeep-a1832.firebaseapp.com",
  projectId: "kuldeep-a1832",
  storageBucket: "kuldeep-a1832.firebasestorage.app",
  messagingSenderId: "482488965700",
  appId: "1:482488965700:web:03080cae8bfb7ab8363a11",
  measurementId: "G-FJ6LZV3KRW",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
