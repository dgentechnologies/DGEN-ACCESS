import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBfsPTPTuL0slzJTabaiuvXs75jj0NWWLg",
  authDomain: "dgen-access.firebaseapp.com",
  projectId: "dgen-access",
  storageBucket: "dgen-access.firebasestorage.app",
  messagingSenderId: "1039121440447",
  appId: "1:1039121440447:web:387546d1176a6cbb1f700a",
  measurementId: "G-LX6GYDQC6E",
  databaseURL: "https://dgen-access-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const firestoreDb = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;
