import admin from 'firebase-admin';

let db, app;

// Initialize Firebase Admin SDK
try {
  // Check if Firebase app is already initialized
  if (!admin.apps.length) {
    // Validate required environment variables
    const requiredEnvVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please create a .env.local file with your Firebase credentials.\n' +
        'See SETUP.md for detailed instructions.'
      );
    }

    // Use environment variables for service account
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    // Firestore database instance
    db = admin.firestore();

    // Log Realtime Database status
    if (process.env.FIREBASE_DATABASE_URL) {
      console.log('✓ Realtime Database URL:', process.env.FIREBASE_DATABASE_URL);
    } else {
      console.warn('⚠️  FIREBASE_DATABASE_URL not set – Realtime Database features disabled');
    }

    console.log('✓ Firebase Admin initialized successfully');
    console.log('✓ Project ID:', process.env.FIREBASE_PROJECT_ID);
  } else {
    app = admin.app();
    db = admin.firestore();
  }
} catch (error) {
  console.error('\n❌ Firebase Admin initialization error:');
  console.error(error.message);
  console.error('\n📖 Setup Instructions:');
  console.error('1. Create a .env.local file in the root directory');
  console.error('2. Add your Firebase service account credentials');
  console.error('3. See SETUP.md for detailed instructions\n');
  console.warn('⚠️  API routes will return 503 errors until Firebase is configured\n');
}

// Initialize default super admin users if Firebase is connected
async function initializeDefaultUsers() {
  if (!db) return;

  try {
    const defaultUsers = [
      {
        id: 'DGEN-ADM-00000',
        name: 'System Administrator',
        role: 'Superuser / Admin',
        status: 'Active',
        isSuperAdmin: true,
        isAdmin: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-EX-01001',
        name: 'Tirthankar Dasgupta',
        role: 'CEO & CTO',
        status: 'Active',
        isSuperAdmin: false,
        isAdmin: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-FI-01002',
        name: 'Sukomal Debnath',
        role: 'CFO',
        status: 'Active',
        isSuperAdmin: false,
        isAdmin: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-OP-01003',
        name: 'Arpan Bairagi',
        role: 'COO',
        status: 'Active',
        isSuperAdmin: false,
        isAdmin: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'DGEN-MK-01004',
        name: 'Sagnik Mandal',
        role: 'CMO',
        status: 'Active',
        isSuperAdmin: false,
        isAdmin: false,
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

/**
 * On every server cold-start (including Vercel deploys), sync all Firestore
 * users into the Realtime Database so the ESP32 always has an up-to-date
 * card list even if the RTDB was empty (e.g. after first deploy).
 */
async function syncAllUsersToRtdb() {
  if (!db || !process.env.FIREBASE_DATABASE_URL) return;

  try {
    // Dynamic import avoids a circular-dependency issue at module load time
    const { syncUserToRtdb } = await import('./realtimeDb.js');
    const snapshot = await db.collection('users').get();

    await Promise.all(snapshot.docs.map(doc => syncUserToRtdb(doc.id, doc.data())));

    if (snapshot.size > 0) {
      console.log(`✓ Synced ${snapshot.size} user(s) to Realtime Database on startup`);
    }
  } catch (error) {
    console.error('Error syncing users to Realtime Database on startup:', error.message);
  }
}

// Initialize users (will run once)
if (typeof window === 'undefined') {
  initializeDefaultUsers();
  syncAllUsersToRtdb();
}

export { admin, db };
