import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBfsPTPTuL0slzJTabaiuvXs75jj0NWWLg",
  authDomain: "dgen-access.firebaseapp.com",
  databaseURL: "https://dgen-access-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dgen-access",
  storageBucket: "dgen-access.firebasestorage.app",
  messagingSenderId: "1039121440447",
  appId: "1:1039121440447:web:387546d1176a6cbb1f700a",
  measurementId: "G-LX6GYDQC6E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);
export const firestoreDb = getFirestore(app);

export default app;
