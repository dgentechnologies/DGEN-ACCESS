import admin from 'firebase-admin';

let db, realtimeDb, app;

// Initialize Firebase Admin SDK
try {
  // Check if Firebase app is already initialized
  if (!admin.apps.length) {
    // Use environment variables for service account
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || "dgen-access",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://dgen-access-default-rtdb.asia-southeast1.firebasedatabase.app"
    });

    // Firestore database instance
    db = admin.firestore();
    
    // Realtime Database instance
    realtimeDb = admin.database();

    console.log('✓ Firebase Admin initialized successfully');
  } else {
    app = admin.app();
    db = admin.firestore();
    realtimeDb = admin.database();
  }
} catch (error) {
  console.error('✗ Firebase Admin initialization error:', error.message);
  console.warn('⚠ Running without Firebase - check your configuration');
}

// Initialize default super admin users if Firebase is connected
async function initializeDefaultUsers() {
  if (!db) return;

  try {
    const defaultUsers = [
      {
        id: 'DGEN-EX-01',
        name: 'Tirthankar Dasgupta',
        role: 'CEO & CTO',
        status: 'Active',
        isSuperAdmin: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-FI-02',
        name: 'Sukomal Debnath',
        role: 'CFO',
        status: 'Active',
        isSuperAdmin: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-OP-03',
        name: 'Arpan Bairagi',
        role: 'COO',
        status: 'Active',
        isSuperAdmin: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-MK-04',
        name: 'Sagnik Mandal',
        role: 'CMO',
        status: 'Active',
        isSuperAdmin: true,
        createdAt: new Date().toISOString()
      }
    ];

    // Check and add default users if they don't exist
    for (const user of defaultUsers) {
      const userRef = db.collection('users').doc(user.id);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        await userRef.set(user);
        console.log(`✓ Initialized super admin: ${user.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing default users:', error.message);
  }
}

// Initialize users (will run once)
if (typeof window === 'undefined') {
  initializeDefaultUsers();
}

export { admin, db, realtimeDb };
