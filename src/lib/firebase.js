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

// Named Firestore database ID must be provided via the env var.
// Silently falling back to '(default)' would connect the client to the wrong
// database while the server writes to the named database, causing logs and
// other data to appear missing in the UI.
const firestoreDatabaseId = process.env.NEXT_PUBLIC_FIREBASE_ACCESS_DATABASE_ID;

if (!firestoreDatabaseId) {
  throw new Error(
    'NEXT_PUBLIC_FIREBASE_ACCESS_DATABASE_ID is not set. ' +
    'Add it to your .env.local file (e.g. NEXT_PUBLIC_FIREBASE_ACCESS_DATABASE_ID=access).'
  );
}

export const firestoreDb = getFirestore(app, firestoreDatabaseId);

export default app;
