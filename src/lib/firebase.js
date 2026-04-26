import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Reuse an existing app instance if one was already initialised (e.g. during
// Next.js HMR or when the module is evaluated more than once).
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Named Firestore database ("access"). Falls back to the default database if
// the env var is not set (useful for local dev without the full config).
const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_ACCESS_DATABASE_ID || '(default)';

export const firestoreDb = getFirestore(app, firestoreDatabaseId);

export default app;
