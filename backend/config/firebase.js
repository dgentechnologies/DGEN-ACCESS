const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let db, realtimeDb;

try {
  // Initialize with service account credentials from environment
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  // Firestore database instance
  db = admin.firestore();
  
  // Realtime Database instance
  realtimeDb = admin.database();

  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('✗ Firebase initialization error:', error.message);
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

// Initialize users on startup
initializeDefaultUsers();

module.exports = {
  admin,
  db,
  realtimeDb
};
